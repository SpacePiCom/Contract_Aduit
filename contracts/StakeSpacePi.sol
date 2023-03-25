// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Relationship} from "./utils/Relationship.sol";

contract StakeSpacePi is ReentrancyGuard, Relationship {
    using SafeMath for uint256;
    struct Pool {
        uint256 apr; // pool apr
        uint256 lockBlocks; // pool lock blocks
        uint256 amount; // pool stake amount
    }

    struct UserInfo {
        uint256 amount; // user deposit amount
        uint256 accReward; // user accumulate reward
        uint256 rewardDebt; // user reward debt
        uint256 enterBlock; // user enter block
        uint256 settledBlock; // user settled block
        bool claimed;
    }

    Pool[] public pools;
    IERC20 public token; // using token
    uint256 public accDeposit; // accumulate all deposit
    uint256 public accReward; // accumulate all reward

    uint256 perBlockTime = 3 seconds; // per block gen time
    uint256 public inviteRewardRate = 10; // invite reward rate

    mapping(address => mapping(uint256 => UserInfo)) public userInfo; // user info

    mapping(address => uint256) public inviteReward; // invite reward amount

    event Deposit(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event InviterReward(address indexed user, uint256 indexed pid, uint256 indexed amount);
    event Reward(address indexed user, uint256 indexed pid, uint256 indexed amount);
//    event Reinvestment(address indexed user, uint256 indexed pid, uint256 indexed amount);

    constructor(IERC20 _token, uint256 start,uint256 end)Relationship(start,end){
//    constructor () Relationship(1678159400,1678764200){
//        token = IERC20(0x97b3d934F051F506a71e56C0233EA344FCdc54d2);
        token = _token;
        // only for test
//        addPool(40, 60 seconds / perBlockTime);
//        addPool(80, 600 seconds / perBlockTime);
        // production
        addPool(7, 30 days);
        addPool(12, 90 days);
        addPool(15, 180 days);
    }
    modifier onlyUnLock(uint256 pid, address play){
        Pool memory pool = pools[pid];
        UserInfo memory user = userInfo[play][pid];
        require(block.number >= pool.lockBlocks.add(user.enterBlock), "onlyUnLock: locked");
        _;
    }

    modifier onlyInvited(address play){
        require(getParent(play) != address(0), "onlyInvited:only invited");
        _;
    }
    function addPool (uint256 apr,uint256 locked) public onlyOwner{
        pools.push(Pool(apr, locked/ perBlockTime, 0));
    }
    function poolLength() external view returns (uint256) {
        return pools.length;
    }
    function setPoolApr(uint256 pid, uint256 apr) public onlyOwner{
        pools[pid].apr = apr;
    }
    function setPoolLocked(uint256 pid, uint256 locked) public onlyOwner{
        pools[pid].lockBlocks = locked / perBlockTime;
    }
    function setPool(uint256 pid, uint256 apr, uint256 locked) public onlyOwner{
        pools[pid].apr = apr;
        pools[pid].lockBlocks = locked;
    }
    // @dev get user pending reward
    function pending(uint256 pid, address play) public view returns (uint256){
        uint256 time = block.number;
        Pool memory pool = pools[pid];
        UserInfo memory user = userInfo[play][pid];
        if (user.amount == 0) return 0;
        uint256 perBlock = user.amount.mul(pool.apr).div(365 days).div(100).mul(perBlockTime);
        if (time >= pool.lockBlocks.add(user.enterBlock)) {
            if (user.settledBlock >= pool.lockBlocks) return 0;
            return perBlock.mul(pool.lockBlocks.sub(user.settledBlock)).add(user.rewardDebt);
        }
        return perBlock.mul(time.sub(user.enterBlock).sub(user.settledBlock)).add(user.rewardDebt);
    }

    // @dev deposit token can repeat, will settle the previous deposit
    // @dev only invited can deposit
    function deposit(uint256 pid, uint256 amount) external nonReentrant onlyInvited(msg.sender) inDuration {
        Pool storage pool = pools[pid];
        UserInfo storage user = userInfo[msg.sender][pid];
        token.transferFrom(msg.sender, address(this), amount);
        uint256 reward = pending(pid, msg.sender);
        uint256 currentBlock = block.number;
        if (user.enterBlock == 0) {
            user.enterBlock = block.number;
        }
        if (currentBlock > user.enterBlock.add(pool.lockBlocks)) {
            if (reward > 0) revert("deposit: reward claim first");
            user.enterBlock = block.number;
        }

        if (user.amount > 0) {
            if (reward > 0) {
                user.rewardDebt = user.rewardDebt.add(reward);
                user.settledBlock = block.number.sub(user.enterBlock);
            }
        }
        pool.amount = pool.amount.add(amount);
        user.amount = user.amount.add(amount);
        accDeposit = accDeposit.add(amount);
        emit Deposit(msg.sender, pid, amount);
    }
    // @dev withdraw deposit token whether unlock
    function withdraw(uint256 pid) external nonReentrant onlyUnLock(pid, msg.sender) {
        UserInfo storage user = userInfo[msg.sender][pid];
        Pool storage pool = pools[pid];
        uint256 amount = user.amount;
        require(user.amount >= 0, "withdraw: Principal is zero");
        user.amount = 0;
        user.enterBlock = 0;
        user.settledBlock = 0;
        user.claimed = false;
        accDeposit = accDeposit.sub(amount);
        pool.amount = pool.amount.sub(amount);
        token.transfer(msg.sender, amount);
        emit Withdraw(msg.sender, pid, amount);
    }

    // @dev claim interest, not locking withdraw
    // @dev inviter will get setting percent of the interest
    function claim(uint256 pid) external nonReentrant{
        UserInfo storage user = userInfo[msg.sender][pid];
        Pool memory pool = pools[pid];
        uint256 reward = pending(pid, msg.sender);
        require(reward > 0, "claim: interest is zero");
        require(!user.claimed, "claim: time ends claimed");
        if (token.balanceOf(address(this)).sub(accDeposit) >= reward&&!user.claimed) {
            address inviter = getParent(msg.sender);

            uint256 userInviteReward = reward.mul(inviteRewardRate).div(100);
            uint256 userReward = reward.sub(userInviteReward);
            token.transfer(inviter, userInviteReward);
            token.transfer(msg.sender, userReward);
            if (user.enterBlock.add(pool.lockBlocks) < block.number) user.claimed = true;
            user.accReward = user.accReward.add(userReward);
            user.settledBlock = block.number.sub(user.enterBlock);
            user.rewardDebt = 0;
            accReward = accReward.add(reward);
            inviteReward[inviter] = inviteReward[inviter].add(userInviteReward);
            emit InviterReward(inviter, pid, userInviteReward);
            emit Reward(msg.sender, pid, userReward);
        }
    }

}
