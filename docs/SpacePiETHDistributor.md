# SpacePiETHDistributor.sol

## Project Overview

SpacePiETHDistributor is a contract with using signature that allows users to claim SpacePi Token Airdrop on ETH.

## 1. Functional Requirements
## 1.1 Roles
SpacePiETHDistributor has 2 roles:
- Owner: The owner of the contract. The owner can add/remove airdrop plans, and withdraw tokens.
- User: The user of the contract. The user can claim airdrop tokens.

## 1.2 Features
- add airdrop plan(Owner).
- claim airdrop tokens(User).
- withdraw tokens(Owner).

## 1.3 Use Cases

## 2. Technical Requirements
## 2.1 Architecture Diagram
## 2.2 Contract Information
### 2.2.1 SpacePiETHDistributor.sol
A token holder contract that will allow a user to claim SpacePi Token Airdrop on ETH.
### 2.2.2 Assets
**claimedBitMap**: uint256 <-> uint256 mapping, the claimed bit map of the index.

### 2.2.3 Events
- Claimed - Emitted when a user claim airdrop tokens.

### 2.2.4 Modifiers
- onlyOwner - The function can only be called by the owner.

## 2.3 Functions
- **constructor(address token_, uint256 perUserClaimLimit_)** - The constructor of the contract.
- **function claim(uint256 index, bytes memory signature)** - Claim airdrop tokens with signature.

