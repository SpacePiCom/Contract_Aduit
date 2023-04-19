// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.9;

import {IERC20, SafeERC20, Address} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

    error AlreadyClaimed();
    error InvalidSignature();

contract SpacePiETHDistributor is Ownable {
    using SafeERC20 for IERC20;
    using Address for address;

    // @dev the signer address
    address public immutable signer;
    // @dev the token address
    address public immutable token;
    // @dev the limit of per user claim
    uint256 public perUserClaimLimit;

    // @dev the claimed bitmap
    mapping(uint256 => uint256) private claimedBitMap;
    event Claimed(uint256 indexed index, address indexed account, uint256 indexed amount);

    constructor(address token_, uint256 perUserClaimLimit_, address signer_) {
        require(token_ != address(0), "token is the zero address");
        require(signer_ != address(0) && !signer_.isContract(), "signer is the zero or contract address");
        token = token_;
        perUserClaimLimit = perUserClaimLimit_;
        signer = signer_;
    }
    // @dev check if the index is claimed
    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }
    // @dev set the index to claimed
    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }
    // @dev set the limit of per user claim
    function setLimit(uint256 newLimit) external onlyOwner {
        perUserClaimLimit = newLimit;
    }
    // @dev claim tokens
    // @param index the index of the claim
    // @param signature the signature from singer
    function claim(uint256 index,bytes memory signature) public {
        address account = msg.sender;
        if (isClaimed(index)) revert AlreadyClaimed();

        // Verify the signature from singer.
        bytes memory node = abi.encodePacked(index, account);
        address _signer = ECDSA.recover(ECDSA.toEthSignedMessageHash(node), signature);
        if (_signer != signer) revert InvalidSignature();

        // Mark it claimed and send the token.
        _setClaimed(index);
        IERC20(token).safeTransfer(account, perUserClaimLimit);

        emit Claimed(index, account, perUserClaimLimit);
    }
    // @dev withdraw unclaimed tokens in the contract
    function withdraw() external onlyOwner {
        require(IERC20(token).balanceOf(address(this)) > 0, "Nothing to withdraw");
        IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}
