import fs from 'node:fs';
import solc from 'solc';
fs.mkdirSync('dist/vendor',{recursive:true});
fs.copyFileSync('node_modules/ethers/dist/ethers.min.js','dist/vendor/ethers.js');
const source=fs.readFileSync('contracts/GoalVault.sol','utf8');
const input={language:'Solidity',sources:{'GoalVault.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input)));
for(const error of output.errors||[]) { console.log(error.formattedMessage); if(error.severity==='error') process.exit(1); }
fs.writeFileSync('dist/contract.json',JSON.stringify(output.contracts['GoalVault.sol'].GoalVault,null,2));
fs.writeFileSync('dist/standard-input.json',JSON.stringify(input,null,2));
fs.writeFileSync('dist/GoalVault.sol',source);
console.log('Compiled GoalVault with '+solc.version());
