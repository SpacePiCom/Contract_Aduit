// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./utils/Relationship.sol";

interface IMintNft is IERC721Enumerable {
    function mint(address to) external;
}

interface IERC20 {
    function transferFrom(address _from, address _to, uint _value) external;
}

contract ERC721Distributor is Ownable, ReentrancyGuard, Relationship {
    using SafeMath for uint256;

    address public nft;

    address public cashier;

    //    uint256 public personalLimit;
    uint256 public started;
    uint256 public ended;
    uint256 public total;
    uint256 public sold;

    address public dead = 0x000000000000000000000000000000000000dEaD;
    //    mapping(address => uint256) public bought;
    mapping(address => mapping(address => uint256)) private bought;
    mapping(address => uint256) public prices;
    address[] public tokens;
    constructor(
        uint256 end,
        address _nft,
        uint256 _total
    )Relationship(block.timestamp, end) {
        started = block.timestamp;
        ended = end;
        nft = _nft;

        total = _total;
        cashier = msg.sender;
    }

    event Claim(uint256 indexed tokenID, address indexed user);

    modifier isFilled(uint256 quantity) {
        require(total >= sold.add(quantity), "sold out");
        _;
    }

    function removePrice(address currency) public onlyOwner {
        delete prices[currency];

    }
    function setPrice(address currency, uint256 amount) public onlyOwner {
        prices[currency] = amount;
    }

    function setTotal(uint256 q) public onlyOwner {
        total = q;
    }

    function setNFT(address _nft) external onlyOwner {
        require(_nft != address(0), "Is zero address");
        nft = _nft;
    }

    function setCashier(address _cashier) external onlyOwner {
        require(_cashier != address(0), "Is zero address");
        cashier = _cashier;
    }

    function claim(address currency, uint256 quantity, bool isBlack) external nonReentrant inDuration {
        require(isInvited(msg.sender), "not invited");
        _claim( currency, quantity, isBlack);
    }

    function transferStranded(address currency, uint256 quantity, bool isBlack) internal {
        require(prices[currency] != 0, 'not found this currency');
        if (getParent(msg.sender) == address(0)) {
            IERC20(currency).transferFrom(msg.sender, cashier, prices[currency].mul(quantity));
        } else {
            if (isBlack) {
                IERC20(currency).transferFrom(msg.sender, dead, prices[currency].mul(quantity).mul(90).div(100));
            }else {
                IERC20(currency).transferFrom(msg.sender, cashier, prices[currency].mul(quantity).mul(90).div(100));
            }
            IERC20(currency).transferFrom(msg.sender, getParent(msg.sender), prices[currency].mul(quantity).mul(10).div(100));
            bought[getParent(msg.sender)][currency] = bought[getParent(msg.sender)][currency].add(prices[currency].mul(quantity).mul(10).div(100));
        }
    }

    function _claim(address currency, uint256 quantity, bool isBlack) internal isFilled(quantity) {
        address user = msg.sender;
        transferStranded(currency, quantity, isBlack);

        for (uint256 i = 0; i < quantity; i++) {
            IMintNft(nft).mint(user);
            sold = sold.add(1);
            uint256 id = IMintNft(nft).totalSupply();
            emit Claim(id, user);
        }
    }

    function getInviteReward(address user, address currency) public view returns (uint256) {
        if (getParent(user) == address(0)) return 0;
        return bought[user][currency];
    }
}
