// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenSale
 * @notice Contract for token sale
 */
contract TokenSale is Ownable {
    // Token contract
    IERC20 public immutable token;

    // Token purchase rate (tokens per ether)
    uint256 public immutable rate;

    // Total number of tokens available for sale
    uint256 public tokensForSale = 50_000_000 ether;

    // Maximum number of tokens a user can purchase in one transaction
    uint256 public maxTokensPerPurchase = 50_000 ether;

    // Total number of tokens sold during the sale
    uint256 public totalTokensSold;

    // Start time of the token sale
    uint256 public immutable startTime;

    // End time of the token sale
    uint256 public endTime;

    // Custom errors
    error NotEnoughEther(string message);
    error NotEnoughTokens(string message);
    error TokenSaleLimitReached(string message);
    error ExceedsMaximumTokensPerPurchase(string message);
    error TokenSaleHasEnded(string message);
    error InvalidTokenAddress(string message);
    error InvalidTokenRate(string message);

    // Mapping to track tokens purchased by each address
    mapping(address => uint256) public tokensPurchased;

    // Modifier to check if the token sale has ended
    modifier isSaleEnded() {
        if (block.timestamp >= endTime) {
            revert TokenSaleHasEnded("Token sale has ended!");
        }
        _;
    }

    // Event emitted when tokens are purchased
    event TokensPurchased(address indexed buyer, uint256 amount);

    /**
     * @notice Constructor to initialize the TokenSale contract
     * @param _token Address of the token contract
     * @param _rate Rate of token per ether
     * @param _startTime Start time of the token sale
     */
    constructor(address _token, uint256 _rate, uint256 _startTime) {
        if (!Address.isContract(_token)) {
            revert InvalidTokenAddress("Token address must be a contract.");
        }
        if (_rate == 0) {
            revert InvalidTokenRate("Token rate cannot be zero.");
        }
        token = IERC20(_token);
        rate = _rate;
        startTime = _startTime;
    }

    /**
     * @notice Returns the balance of tokens held by the contract
     */
    function getBalanceToken() public view returns (uint256 balance) {
        balance = token.balanceOf(address(this));
    }

    /**
     * @notice Returns the balance of ether held by the contract
     */
    function getBalanceEther() public view returns (uint256 balanceEther) {
        balanceEther = address(this).balance;
    }

    /**
     * @notice Sets the duration of the token sale, only callable by the owner
     * @param _duration The new duration of the token sale in seconds
     */
    function setDuration(uint256 _duration) external onlyOwner isSaleEnded {
        endTime = startTime + _duration;
    }

    /**
     * @notice Withdraws remaining tokens from the contract, only callable by the owner
     */
    function withdrawTokens() external onlyOwner isSaleEnded {
        uint balance = getBalanceToken();
        if (balance == 0) {
            revert NotEnoughTokens("Not enough tokens!");
        }
        token.transfer(owner(), balance);
    }

    /**
     * @notice Withdraws ether from the contract, only callable by the owner
     */
    function withdrawEther() external onlyOwner {
        uint balanceEther = getBalanceEther();
        if (balanceEther == 0) {
            revert NotEnoughEther("Not enough ether!");
        }
        payable(owner()).transfer(balanceEther);
    }

    /**
     * @notice Allows users to purchase tokens with ether, only callable when the sale is ongoing
     * @param _amount The amount of tokens to purchase
     */
    function buyTokens(uint256 _amount) external payable isSaleEnded {
        if (msg.value == 0) {
            revert NotEnoughEther("Not enough ether!");
        }
        if (_amount > maxTokensPerPurchase) {
            revert ExceedsMaximumTokensPerPurchase(
                "Exceeds maximum tokens per purchase"
            );
        }
        if (totalTokensSold + _amount > tokensForSale) {
            revert TokenSaleLimitReached("Token sale limit reached!");
        }
        if (tokensPurchased[msg.sender] + _amount > maxTokensPerPurchase) {
            revert ExceedsMaximumTokensPerPurchase(
                "Exceeds maximum tokens per purchase for this address"
            );
        }

        uint256 valueTokens = msg.value * rate;

        if (valueTokens < _amount) {
            revert NotEnoughTokens("Not enough tokens!");
        }

        token.transfer(msg.sender, _amount);
        tokensPurchased[msg.sender] += _amount;
        totalTokensSold += _amount;

        emit TokensPurchased(msg.sender, _amount);
    }
}
