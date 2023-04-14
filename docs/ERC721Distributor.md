# ERC721Distributor.sol

## Project Overview

ERC721Distributor is a contract with make some coin to claim ERC721 NFTs.

## 1. Functional Requirements

## 1.1 Roles
1. Owner: The owner of the contract. The owner can add/remove airdrop plans, and withdraw tokens.
2. User: The maker of the contract. The maker can make some coin to claim ERC721 NFTs.
3. Inviter: The inviter of the user. The inviter can get some reward when user claim ERC721 NFTs.

## 1.2 Features
1. add/remove support coins(Owner).
2. make some coin to claim ERC721 NFTs, also can select send coin to blackhole(User).
3. withdraw tokens(Owner).

## 1.3 Use Cases
1. Owner add/remove support coin and pricing. 
2. User make some support coin to claim ERC721 NFTs.
3. Inviter get reward when user claim ERC721 NFTs.
## 2. Technical Requirements

## 2.1 Architecture Diagram

## 2.2 Contract Information

### 2.2.1 ERC721Distributor.sol

A token holder contract that will allow a user to claim ERC721 NFTs.

### 2.2.2 Assets
- state: the state of the contract.
    - nft: ERC721 token address.
    - cashier: support coin receive address.
    - started: the start time of the contract.
    - ended: the end time of the contract.
    - total: the total as the claimable NFTs.
    - sold: the sold as the claimed NFTs.
    - dead: the dead address.
- mapping:
  - bought: address <-> mapping(address -> uint256) mapping, inviter receive coin amount.
  - prices: address <-> uint256 mapping, pricing of the coin.

### 2.2.3 Events
- Claimed - Emitted when a user claim ERC721 NFTs.

### 2.2.4 Modifiers
- isFilled - The function can only be called when the contract is not filled.


## 2.3 Functions
- **constructor(address nft_, uint256 ended_, uint256 total_)** - The constructor of the contract.
- **function claim(address currency, uint256 quantity, bool isBlack)** - Claim ERC721 NFTs.
- **function setPrice(address currency, uint256 amount)** - Set pricing of the coin.
- **function setTotal(uint256 q)** - Set total as the claimable NFTs.
- **function setCashier(address payable cashier_)** - Set support coin receive address.
- **function removePrice(address currency)** - Remove pricing of the coin.
- **function getInviteReward(address user, address currency)** - Get invite reward of the user.
