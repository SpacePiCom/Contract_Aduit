# StakeSpacePi.sol tech docs


## Project Overview

Solidity project is based fixed APR interest bouns contract. It allows owners to deposit multiple APR plans and deposit tokens to allow users to receive those bouns in per interval.

## 1. Functional Requirements

### 1.1 Roles
StakeSpacePi.sol has 2 roles:
- Owner: The owner of the contract. The owner can add/remove APR plans, deposit tokens, and withdraw tokens.
- User: The user of the contract. The user can deposit tokens to receive bouns.

## 1.2 Features
- add/remove APR plans(Owner).
- deposit tokens and locked interval(User) 
- receive bouns always(User).
- withdraw tokens(Owner).
- init plans:
  - 30 days: 7% APR
  - 90 days: 12% APR
  - 180 days: 15% APR

## 1.3 Use Cases


## 2. Technical Requirements

## 2.1 Architecture Diagram
## 2.2 Contract Information
### 2.2.1 StakeSpacePi.sol
A token holder contract that will allow a user to deposit tokens and receive bouns in per interval.
### inherit
- [Relationship.sol](./Relationship.md)

### 2.2.2 Assets
StakeSpacePi.sol has two Structs:
- Pool: The pool of the contract. The pool contains the APR plans.
  - uint256 apr - The APR of the plan.
  - uint256 lockBlocks - The interval of the plan.
  - uint256 amount - The total amount of the plan.
- UserInfo: The user of the contract. The user contains the deposit information.
  - uint256 amount - The amount of the user.
  - uint256 accReward - user accumulate reward
  - uint256 rewardDebt - user reward debt
  - uint256 enterBlock - user enter block
  - uint256 settledBlock - user settled block
  - bool claimed - last reward claimed or not
Besides the mentioned structs, the following entities are present in the project:
- **pools** - The all plans of the contract.
- **token** - The contract holder token.
- **accDeposit** - accumulate all deposit
- **accReward** - accumulate all reward
- **perBlockTime** - per block time(deploy chain per block mint time)
- **userInfo** - address <-> planId <-> UserInfo mapping
- **inviteReward** - address <-> uint256 mapping, invite reward amount
### 2.2.3 Events
- Deposit - Emitted when a user deposits tokens.
- Withdraw - Emitted when a user withdraws tokens.
- Reward - Emitted when a user claims bouns.
- InviterReward - Emitted when a user invite a new user.
### 2.2.4 Modifiers
- onlyUnLock - The function can only be called when the user is not locked.
- onlyInvited - The function can only be called when the user is invited.
### 2.2.5 Functions
- **constructor(IERC20 _token, uint256 start,uint256 end)** - The constructor of the contract.
- **function deposit(uint256 pid, uint256 amount)** - Deposit tokens into contract.
- **function withdraw(uint256 pid)** - withdraw deposit token whether unlock
- **function claim(uint256 pid)** - claim reward
