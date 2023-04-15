// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
    error AlreadyClaimed();
    error InvalidSignature();

contract SpacePiETHDistributor is Ownable {
    using SafeERC20 for IERC20;

    address public immutable token;
    uint256 public perUserClaimLimit;

    mapping(uint256 => uint256) private claimedBitMap;
    event Claimed(uint256 index, address account, uint256 amount);

    constructor(address token_, uint256 perUserClaimLimit_) {
        token = token_;
        perUserClaimLimit = perUserClaimLimit_;
    }

    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }
    function setLimit(uint256 newLimit) external onlyOwner {
        perUserClaimLimit = newLimit;
    }
    function claim(uint256 index,bytes memory signature)
    public
    virtual
    {
        address account = msg.sender;
        if (isClaimed(index)) revert AlreadyClaimed();

        // Verify the merkle proof.
        bytes memory node = abi.encodePacked(index, account);
        address signer = ECDSA.recover(ECDSA.toEthSignedMessageHash(node), signature);
        if (signer != owner()) revert InvalidSignature();

        // Mark it claimed and send the token.
        _setClaimed(index);
        IERC20(token).safeTransfer(account, perUserClaimLimit);

        emit Claimed(index, account, perUserClaimLimit);
    }
}
