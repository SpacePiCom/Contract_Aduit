// SPDX-License-Identifier: MIT
pragma solidity >=0.8.18;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Relationship} from "./utils/Relationship.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StakeSpacePi is ReentrancyGuard, Relationship {
    using SafeERC20 for IERC20;
    struct Pool {
        uint256 apr; // pool apr
        uint256 lockSeconds; // pool lock seconds
        uint256 amount; // pool stake amount
    }

    struct UserInfo {
        uint256 amount; // user deposit amount
        uint256 accReward; // user accumulate reward
        uint256 rewardDebt; // user reward debt
        uint256 enterTime; // user enter timestamp
        uint256 billedSeconds; // user billed seconds
        bool claimed;
    }

    Pool[] public pools;
    IERC20 public token; // using token
    uint256 public accDeposit; // accumulate all deposit
    uint256 public accReward; // accumulate all reward

    uint256 public constant inviteRewardRate = 10; // invite reward rate

    mapping(address => mapping(uint256 => UserInfo)) public userInfo; // user info

    mapping(address => uint256) public inviteReward; // invite reward amount

    event Deposit(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event InviterReward(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event Reward(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event AddPool(uint256 indexed apr, uint256 indexed locked, uint256 indexed pid);
    event SetPool(uint256 indexed apr, uint256 indexed locked, uint256 indexed pid);

    constructor(IERC20 _token, uint256 start,uint256 end)Relationship(start,end){
        token = _token;
    }
    modifier onlyUnLock(uint256 pid, address _sender){
        Pool memory pool = pools[pid];
        UserInfo memory user = userInfo[_sender][pid];
        require(block.timestamp >= pool.lockSeconds + user.enterTime, "onlyUnLock: locked");
        _;
    }
    modifier onlyNotDeposit() {
        require(accDeposit == 0, "onlyNotDeposit: only not deposit");
        _;
    }

    modifier onlyInvited(address _sender){
        require(getParent(_sender) != address(0), "onlyInvited:only invited");
        _;
    }
    function addPool(uint256 apr,uint256 locked) external onlyOwner{
        require(apr > 5, "setPool: apr must > 5");
        require(apr < 500, "setPool: apr must < 500");
        require(locked > 0, "setPool: locked must > 0");
        pools.push(Pool(apr, locked, 0));
        emit AddPool(apr, locked, pools.length - 1);
    }
    function poolLength() external view returns (uint256) {
        return pools.length;
    }
    function setPool(uint256 pid, uint256 apr, uint256 locked) external onlyOwner onlyNotDeposit{
        require(apr > 5, "setPool: apr must > 5");
        require(apr < 500, "setPool: apr must < 500");
        require(locked > 0, "setPool: locked must > 0");
        pools[pid].apr = apr;
        pools[pid].lockSeconds = locked;
        emit SetPool(apr, locked, pid);
    }
    // @dev get user pending reward
    function pending(uint256 pid, address play) public view returns (uint256){
        uint256 time = block.timestamp;
        Pool memory pool = pools[pid];
        UserInfo memory user = userInfo[play][pid];
        if (user.amount == 0) return 0;
        uint256 perSecond = user.amount * pool.apr * 1e18 / 365 days / 100;
        if (time >= pool.lockSeconds + user.enterTime) {
            if (user.billedSeconds >= pool.lockSeconds) return 0;
            return (perSecond * (pool.lockSeconds - user.billedSeconds) / 1e18)+user.rewardDebt;
        }
        return (perSecond*(time- user.enterTime-user.billedSeconds) / 1e18)+user.rewardDebt;
    }

    // @dev deposit token can repeat, will settle the previous deposit
    // @dev only invited can deposit
    function deposit(uint256 pid, uint256 amount) external nonReentrant onlyInvited(msg.sender) inDuration {
        require(amount > 0, "deposit: amount must > 0");
        Pool storage pool = pools[pid];
        UserInfo storage user = userInfo[msg.sender][pid];
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 reward = pending(pid, msg.sender);
        uint256 currentBlock = block.timestamp;
        if (user.enterTime == 0) {
            user.enterTime = block.timestamp;
        }
        if (currentBlock > user.enterTime+ pool.lockSeconds) {
            if (reward > 0) revert("deposit: reward claim first");
            user.enterTime = block.timestamp;
        }

        if (user.amount > 0) {
            if (reward > 0) {
                user.rewardDebt = reward;
                user.billedSeconds = block.timestamp - user.enterTime;
            }
        }
        pool.amount = pool.amount + amount;
        user.amount = user.amount + amount;
        accDeposit = accDeposit + amount;
        emit Deposit(msg.sender, pid, amount);
    }
    // @dev withdraw deposit token whether unlock
    function withdraw(uint256 pid) external onlyUnLock(pid, msg.sender) {
        UserInfo storage user = userInfo[msg.sender][pid];
        Pool storage pool = pools[pid];
        uint256 amount = user.amount;
        uint256 reward = pending(pid, msg.sender);
        require(user.amount >= 0, "withdraw: Principal is zero");
        if (reward > 0) claim(pid);
        user.amount = 0;
        user.enterTime = 0;
        user.billedSeconds = 0;
        user.claimed = false;
        accDeposit = accDeposit - amount;
        pool.amount = pool.amount - amount;
        token.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, pid, amount);
    }

    // @dev claim interest, not locking withdraw
    // @dev inviter will get setting percent of the interest
    function claim(uint256 pid) public nonReentrant{
        UserInfo storage user = userInfo[msg.sender][pid];
        Pool memory pool = pools[pid];
        uint256 reward = pending(pid, msg.sender);
        require(reward > 0, "claim: interest is zero");
        require(!user.claimed, "claim: time ends claimed");
        if (token.balanceOf(address(this)) - accDeposit >= reward) {
            address inviter = getParent(msg.sender);

            uint256 userInviteReward = reward * inviteRewardRate / 100;
            uint256 userReward = reward - userInviteReward;
            token.safeTransfer(inviter, userInviteReward);
            token.safeTransfer(msg.sender, userReward);
            if (user.enterTime + pool.lockSeconds < block.timestamp) user.claimed = true;
            user.accReward = user.accReward + userReward;

            if ((block.timestamp - user.enterTime) >= pool.lockSeconds) user.billedSeconds = pool.lockSeconds;
            else user.billedSeconds = block.timestamp - user.enterTime;

            user.rewardDebt = 0;
            accReward = accReward + reward;
            inviteReward[inviter] = inviteReward[inviter] + userInviteReward;
            emit InviterReward(inviter, pid, userInviteReward);
            emit Reward(msg.sender, pid, userReward);
        }
    }

}
