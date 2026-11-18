// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title GoalVault - permissionless personal savings goals
/// @notice Educational testnet application. No owner, allowlist, fees or lock period.
contract GoalVault {
    struct Goal { string name; uint256 target; uint256 balance; uint256 deposited; }
    mapping(address => Goal[]) private goals;
    bool private entered;
    event GoalCreated(address indexed owner, uint256 indexed goalId, string name, uint256 target);
    event Deposited(address indexed owner, uint256 indexed goalId, uint256 amount);
    event Withdrawn(address indexed owner, uint256 indexed goalId, uint256 amount);

    modifier nonReentrant() {
        require(!entered, "Reentrant call");
        entered = true;
        _;
        entered = false;
    }

    function createGoal(string calldata name, uint256 target) external {
        require(bytes(name).length > 0 && bytes(name).length <= 120, "Invalid name");
        require(target > 0, "Target must be positive");
        uint256 id = goals[msg.sender].length;
        goals[msg.sender].push(Goal(name, target, 0, 0));
        emit GoalCreated(msg.sender, id, name, target);
    }

    function deposit(uint256 goalId) external payable {
        require(goalId < goals[msg.sender].length, "Goal not found");
        require(msg.value > 0, "Deposit must be positive");
        Goal storage goal = goals[msg.sender][goalId];
        goal.balance += msg.value;
        goal.deposited += msg.value;
        emit Deposited(msg.sender, goalId, msg.value);
    }

    function withdraw(uint256 goalId, uint256 amount) external nonReentrant {
        require(goalId < goals[msg.sender].length, "Goal not found");
        Goal storage goal = goals[msg.sender][goalId];
        require(amount > 0 && amount <= goal.balance, "Invalid withdrawal");
        goal.balance -= amount;
        (bool success,) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(msg.sender, goalId, amount);
    }

    function goalCount(address owner) external view returns (uint256) { return goals[owner].length; }
    function getGoal(address owner, uint256 goalId) external view returns (Goal memory) {
        require(goalId < goals[owner].length, "Goal not found");
        return goals[owner][goalId];
    }
    function checkBalance(uint256 goalId) external view returns (uint256) {
        require(goalId < goals[msg.sender].length, "Goal not found");
        return goals[msg.sender][goalId].balance;
    }
}
