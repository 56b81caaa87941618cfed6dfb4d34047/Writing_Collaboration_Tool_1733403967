
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MintingContract is ERC20, ERC20Burnable, Ownable {
    using SafeMath for uint256;

    uint256 public mintPrice = 0.1 ether;
    uint256 public maxMintAmount = 100;
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant COOLDOWN_PERIOD = 1 minutes;

    mapping(address => uint256) public lastMintTime;

    event TokensMinted(address indexed to, uint256 amount);
    event MintPriceUpdated(uint256 newPrice);
    event MaxMintAmountUpdated(uint256 newAmount);

    constructor() ERC20("MintingToken", "MTK") Ownable() {}

    function mint(uint256 amount) public payable {
        require(amount > 0 && amount <= maxMintAmount, "Invalid mint amount");
        require(msg.value >= amount.mul(mintPrice), "Insufficient payment");
        require(block.timestamp.sub(lastMintTime[msg.sender]) >= COOLDOWN_PERIOD, "Cooldown period not elapsed");
        require(totalSupply().add(amount.mul(10**decimals())) <= MAX_SUPPLY, "Exceeds max supply");

        _mint(msg.sender, amount.mul(10**decimals()));
        lastMintTime[msg.sender] = block.timestamp;

        emit TokensMinted(msg.sender, amount);
    }

    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    function setMaxMintAmount(uint256 newAmount) public onlyOwner {
        maxMintAmount = newAmount;
        emit MaxMintAmountUpdated(newAmount);
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
}
