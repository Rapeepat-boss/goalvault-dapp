import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ganache from 'ganache';
import solc from 'solc';
import {BrowserProvider,ContractFactory,parseEther} from 'ethers';
const artifact=JSON.parse(fs.readFileSync('dist/contract.json'));
test('GoalVault: multi-user deposits, withdrawals, validation and reentrancy',async t=>{
 const rpc=ganache.provider({logging:{quiet:true},chain:{hardfork:'shanghai'},wallet:{totalAccounts:3}});
 const provider=new BrowserProvider(rpc);provider.pollingInterval=10;
 try {
 const a=await provider.getSigner(0),b=await provider.getSigner(1);
 const c=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,a).deploy();await c.waitForDeployment();
 await t.test('any wallet can create goals, without an admin',async()=>{await(await c.createGoal('Laptop',parseEther('1'))).wait();await(await c.connect(b).createGoal('Travel',parseEther('2'))).wait();assert.equal(await c.goalCount(a.address),1n);assert.equal(await c.goalCount(b.address),1n);});
 await t.test('deposits are credited only to the sender and selected goal',async()=>{await(await c.deposit(0,{value:parseEther('.5')})).wait();assert.equal(await c.checkBalance(0),parseEther('.5'));assert.equal(await c.connect(b).checkBalance(0),0n);});
 await t.test('other wallet cannot withdraw the first wallet balance',async()=>{await assert.rejects(c.connect(b).withdraw(0,1n));assert.equal(await c.checkBalance(0),parseEther('.5'));});
 await t.test('zero, missing goals, invalid names and excessive withdrawals revert',async()=>{await assert.rejects(c.deposit(0,{value:0}));await assert.rejects(c.deposit(4,{value:1}));await assert.rejects(c.withdraw(0,0));await assert.rejects(c.withdraw(0,parseEther('1')));await assert.rejects(c.createGoal('',1));await assert.rejects(c.createGoal('x'.repeat(121),1));await assert.rejects(c.createGoal('Empty',0));});
 await t.test('withdrawals work before the goal is reached and events match',async()=>{const receipt=await(await c.withdraw(0,parseEther('.2'))).wait();const event=c.interface.parseLog(receipt.logs[0]);assert.equal(event.name,'Withdrawn');assert.equal(event.args.amount,parseEther('.2'));assert.equal(await c.checkBalance(0),parseEther('.3'));assert.equal((await c.getGoal(a.address,0)).deposited,parseEther('.5'));});
 await t.test('one user can create multiple isolated goals',async()=>{await(await c.createGoal('Second',10)).wait();await(await c.deposit(1,{value:10})).wait();assert.equal(await c.checkBalance(1),10n);assert.equal(await c.checkBalance(0),parseEther('.3'));await(await c.withdraw(1,10)).wait();assert.equal(await c.checkBalance(1),0n);});
 const source=`pragma solidity 0.8.30; interface V{function createGoal(string calldata,uint) external;function deposit(uint) external payable;function withdraw(uint,uint) external;} contract Receiver{V v;bool public reject;bool public attack;bool public reentrySucceeded;constructor(address x){v=V(x);}function setup()external payable{v.createGoal("Attack",100);v.deposit{value:msg.value}(0);}function take(uint n,bool r,bool a)external{reject=r;attack=a;v.withdraw(0,n);}receive()external payable{require(!reject,"reject");if(attack){attack=false;(bool ok,)=address(v).call(abi.encodeWithSignature("withdraw(uint256,uint256)",0,1));reentrySucceeded=ok;}}}`;
 const output=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'Receiver.sol':{content:source}},settings:{evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
 const r=output.contracts['Receiver.sol'].Receiver;const receiver=await new ContractFactory(r.abi,r.evm.bytecode.object,a).deploy(await c.getAddress());await receiver.waitForDeployment();await(await receiver.setup({value:100})).wait();
 await t.test('failed transfers roll back the balance',async()=>{await assert.rejects(receiver.take(10,true,false));assert.equal((await c.getGoal(await receiver.getAddress(),0)).balance,100n);});
 await t.test('reentrant withdrawals are blocked',async()=>{await(await receiver.take(10,false,true)).wait();assert.equal(await receiver.reentrySucceeded(),false);assert.equal((await c.getGoal(await receiver.getAddress(),0)).balance,90n);});
 } finally {await provider.destroy();await rpc.disconnect();}
});
