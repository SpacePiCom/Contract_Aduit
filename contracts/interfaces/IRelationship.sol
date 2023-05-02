// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

interface IRelationship {
    // Invitee is the address of the person being invited
    struct Invitee {
        address invitee;
        uint256 timestamp;
    }

    // User is the address of the person who is inviting
    struct User {
        Invitee[] inviteeList;
        address inviter;
        bytes code;
        mapping(address => uint256) lengths;
    }

    function binding(bytes memory c) external;

    function isInvited(address player) external view returns (bool);

    function getInviteeList(address player) external view returns (Invitee[] memory);

    function getParent(address player) external view returns (address);

    function getInviteCode(address player) external view returns (bytes memory);

    function getPlayerByCode(bytes memory code) external view returns (address);
}
