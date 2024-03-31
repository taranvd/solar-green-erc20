// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
    // Declare the ERC20 token contract
    IERC20 public TOKEN;
    // Declare the token purchase rate (tokens per ether)
    uint public RATE;

    // Declare the total number of tokens available for sale
    uint256 public tokensForSale = 50000000 * 10 ** 18;

    // Declare the maximum number of tokens a user can purchase in one transaction
    uint256 public maxTokensPerPurchase = 50000 * 10 ** 18;

    // Declare the total number of tokens sold during the sale
    uint256 public totalTokensSold;

    // Declare the start time of the token sale
    uint256 public startTime = 1710502468;
    // Declare the duration of the token sale
    uint256 public duration = 5 weeks;

    // Mapping to track token balances of users
    mapping(address => uint256) tokenBalances;

    // Modifier to check if the token sale has ended
    modifier isSaleEnded() {
        require(
            block.timestamp < startTime + duration,
            "Token sale has ended!"
        );
        _;
    }

    // Event emitted when tokens are purchased
    event TokensPurchased(address buyer, uint256 amount);

    constructor(address _token, uint _rate) {
        TOKEN = IERC20(_token);
        RATE = _rate;
    }

    /**
     * @dev Returns the balance of tokens held by the contract.
     */
    function getBalanceToken() public view returns (uint balance) {
        balance = TOKEN.balanceOf(address(this));
    }

    /**
     * @dev Returns the balance of ether held by the contract.
     */
    function getBalanceEther() public view returns (uint balanceEther) {
        balanceEther = address(this).balance;
    }

    /**
     * @dev Returns the total number of tokens sold during the sale.
     */
    function getTokensSold() public view returns (uint256) {
        return totalTokensSold;
    }

    /**
     * @dev Sets the duration of the token sale, only callable by the owner.
     * @param _duration The new duration of the token sale in seconds.
     */
    function setDuration(uint256 _duration) external onlyOwner {
        require(
            block.timestamp < startTime + duration,
            "Token sale has already ended!"
        );
        duration = _duration;
    }

    /**
     * @dev Sets the ERC20 token address, only callable by the owner.
     * @param token_ The new address of the ERC20 token.
     */
    function setToken(address token_) external onlyOwner {
        require(
            token_ != address(0),
            "ERC20: Error - Token address cannot be zero."
        );
        TOKEN = IERC20(token_);
    }

    /**
     * @dev Withdraws remaining tokens from the contract, only callable by the owner.
     */
    function withdrawTokens() external onlyOwner {
        require(getBalanceToken() > 0, "Not enough tokens!");
        TOKEN.transfer(owner(), getBalanceToken());
    }

    /**
     * @dev Withdraws ether from the contract, only callable by the owner.
     */
    function withdrawEther() external onlyOwner {
        require(getBalanceEther() > 0, "Not enough tokens!");
        payable(owner()).transfer(getBalanceEther());
    }

    /**
     * @dev Allows users to purchase tokens with ether, only callable when the sale is ongoing.
     */
    function buyTokens() external payable isSaleEnded {
        require(msg.value > RATE, "Not enough ether!");
        uint valueTokens = msg.value / RATE;
        require(getBalanceToken() >= valueTokens, "Not enough tokens!");
        require(
            totalTokensSold + valueTokens <= tokensForSale,
            "Token sale limit reached!"
        );
        require(
            valueTokens <= maxTokensPerPurchase,
            "Exceeds maximum tokens per purchase"
        );
        TOKEN.transfer(msg.sender, valueTokens);
        tokenBalances[msg.sender] += valueTokens;
        totalTokensSold += valueTokens;

        emit TokensPurchased(msg.sender, valueTokens);
    }
}
