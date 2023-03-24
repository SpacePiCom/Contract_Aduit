# Relationship.sol
## Project Overview
Relationship.sol is a contract that allows users to invite other users to receive rewards.

## 1. Functional Requirements

### 1.1 Roles
Relationship.sol has 2 roles:
- Owner: The owner of the contract. can set time end.
- User: The user of the contract. The user can invite other users to receive rewards.

## 1.2 Features
- set time end(Owner).
- invite users(User)

## 1.3 Use Cases

## 2. Technical Requirements

## 2.1 Architecture Diagram
## 2.2 Contract Information
### 2.2.1 Relationship.sol
A token holder contract that will allow a user to invite other users to receive rewards.
### 2.2.2 Assets
Relationship.sol has two Structs:
- Invitee: Invitee is the address of the person being invited
  - address inviter - Inviter is the address of the person who invited
  - uint256 timestamp - Time is the time of the invitation
- User: User is the address of the person who is inviting
  - Invitee[] inviteeList - InviteeList is the list of people invited by the user
  - address inviter - Inviter is the address of the person who invited
  - bytes code - Code is the invitation code
  - mapping(address => uint256) indexes - Indexes is the index of the invitee in the inviteeList

Besides the mentioned structs, the following entities are present in the project:
- **_relations** - address <-> User mapping, User is the address of the person who is invited
- **_codeUsed** - bytes <-> address mapping, code used to invite

### 2.2.3 Events
- Binding - Emitted when a user invite a new user.

### 2.2.4 Modifiers
- inDuration - The function can only be called when the time is not over.

## 2.3 Functions
- **constructor** - The constructor of the contract.
- **function binding(bytes memory c)** - Binding is the function that allows users to invite other users to receive rewards.
