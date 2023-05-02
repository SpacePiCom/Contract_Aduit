// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IRelationship.sol";

/* @title Relationship
 * @author jonescyna@gmail.com
 * @dev This contract is used to manage the invitation relationship.
 *
 * @rules can't invite someone who has already invited you
 * @rules can't invite someone who has already been invited
 * @rules maximum of invitees is limited by gas
*/
contract Relationship is Ownable,IRelationship {

    bytes public constant defaultCode = "space0";
    uint256 public beginsTime;
    uint256 public endsTime;
    // User is the address of the person who is invited
    mapping(address => User) private _relations;
    // code used to invite
    mapping(bytes => address) public codeUsed;

    event Binding(address indexed inviter, address indexed invitee, bytes code);

    constructor(uint256 begins, uint256 ends) {
        beginsTime = begins;
        endsTime = ends;
        _relations[msg.sender].code = defaultCode;
        _relations[msg.sender].inviter = msg.sender;
        codeUsed[defaultCode] = msg.sender;
    }

    modifier inDuration {
        require(block.timestamp < endsTime, "not in time");
        _;
    }
    function setEnds(uint256 _end) external onlyOwner{
        require(_end > block.timestamp, "endsTime must > now");
        endsTime = _end;
    }
    function setStart(uint256 _start) external onlyOwner{
        require(_start < block.timestamp, "beginsTime must < now");
        beginsTime = _start;
    }
    // @param inviter address of the person who is inviting
    function binding(bytes memory c) external override inDuration {
        address sender = msg.sender;
        address inviter = codeUsed[c];
        require(inviter != address(0), "code not found");
        require(inviter != sender, "Not allow inviter by self");
        // invitee address info
        User storage self = _relations[sender];
        // inviter address info
        User storage parent = _relations[inviter];

        require(parent.lengths[sender] == 0, "Can not accept child invitation");
        require(self.inviter == address(0), "Already bond invite");
        parent.inviteeList.push(Invitee(sender, block.timestamp));
        parent.lengths[sender] = self.inviteeList.length;

        self.inviter = inviter;
        bytes memory code = _genCode(sender);
        require(codeUsed[code] == address(0), "please try again");
        self.code = code;

        codeUsed[code] = sender;
        emit Binding(inviter, sender, code);
    }

    // @param player address if not invited
    function isInvited(address player) public view override returns (bool){
        if (_relations[player].inviter != address(0)) return true;
        return false;
    }

    // @param get player address invitee list
    function getInviteeList(address player) external view override returns (Invitee[] memory){
        return _relations[player].inviteeList;
    }

    // @param get player address inviter
    function getParent(address player) public view override returns (address){
        return _relations[player].inviter;
    }

    // @param get player address invitation code
    function getInviteCode(address player) external view override returns (bytes memory){
        return _relations[player].code;
    }

    // @param get player address by invitation code
    function getPlayerByCode(bytes memory code) external view override returns (address){
        return codeUsed[code];
    }

    function _genCode(address player) private view  returns (bytes memory){
        bytes32 hash = keccak256(abi.encode(player, block.number));
        bytes memory code = new bytes(6);
        for (uint256 i = 0; i < code.length; i++) {
            code[i] = hash[i];
        }
        return code;
    }
}
