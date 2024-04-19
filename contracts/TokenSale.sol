// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
    IERC20 public immutable token;
    // Declare the token purchase rate (tokens per ether)
    uint256 public immutable rate;

    // Declare the total number of tokens available for sale
    uint256 public tokensForSale = 50_000_000 ether;

    // Declare the maximum number of tokens a user can purchase in one transaction
    uint256 public maxTokensPerPurchase = 50_000 ether;

    // Declare the total number of tokens sold during the sale
    uint256 public totalTokensSold;

    // Declare the start time of the token sale
    uint256 public immutable startTime;

   // Declare the end time of the token sale
    uint256 public endTime;

    // Custom errors
    error NotEnoughEther(string message);
    // Occurs when insufficient ether is sent for token purchase.

    error NotEnoughTokens(string message);
    // Occurs when there are not enough tokens on the contract to perform the operation.

    error TokenSaleLimitReached(string message);
    // Occurs when the maximum number of tokens available for sale is reached.

    // Occurs when the number of tokens a user is trying to purchase in a single transaction exceeds the maximum allowed.
    error ExceedsMaximumTokensPerPurchase(string message);

    // Error for when the token sale has ended
    error TokenSaleHasEnded(string message);

    // Error that occurs when the token address is invalid or equal to zero.
    error InvalidTokenAddress(string message);

    // Error that occurs when the token rate is invalid or equal to zero.
    error InvalidTokenRate(string message);


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



    constructor(
        address _token,
        uint256 _rate,
        uint256 _startTime
    ) {

        // Sanity check for the token address
    if (!Address.isContract(_token)) {
        revert InvalidTokenAddress("Token address must be a contract.");
    }

       // Sanity check for the token rate
    if (_rate == 0) {
        revert InvalidTokenRate("Token rate cannot be zero.");
    }

        token = IERC20(_token);
        rate = _rate;
        startTime = _startTime;
    }

    /**
     * @dev Returns the balance of tokens held by the contract.
     */
    function getBalanceToken() public view returns (uint256 balance) {
        balance = token.balanceOf(address(this));
    }

    /**
     * @dev Returns the balance of ether held by the contract.
     */
    function getBalanceEther() public view returns (uint256 balanceEther) {
        balanceEther = address(this).balance;
    }


    /**
     * @dev Sets the duration of the token sale, only callable by the owner.
     * @param _duration The new duration of the token sale in seconds.
     */
    function setDuration(uint256 _duration) external onlyOwner isSaleEnded{
        endTime = startTime + _duration;
    }

    /**
     * @dev Withdraws remaining tokens from the contract, only callable by the owner.
     */
    function withdrawTokens() external onlyOwner isSaleEnded {
        uint balance = getBalanceToken();
        if (balance == 0) {
            revert NotEnoughTokens("Not enough tokens!");
        }
        token.transfer(owner(), balance);
    }

    /**
     * @dev Withdraws ether from the contract, only callable by the owner.
     */
    function withdrawEther() external onlyOwner {
        uint balanceEther = getBalanceEther();
        if (balanceEther == 0) {
            revert NotEnoughEther("Not enough ether!");
        }
        payable(owner()).transfer(balanceEther);
    }

    /**
     * @dev Allows users to purchase tokens with ether, only callable when the sale is ongoing.
     */
  function buyTokens(uint256 _amount) external payable isSaleEnded {
        if (msg.value == 0) {
            revert NotEnoughEther("Not enough ether!");
        }
        if (_amount > maxTokensPerPurchase) {
            revert ExceedsMaximumTokensPerPurchase("Exceeds maximum tokens per purchase");
        }
        if (totalTokensSold + _amount > tokensForSale) {
            revert TokenSaleLimitReached("Token sale limit reached!");
        }
        if (tokensPurchased[msg.sender] + _amount > maxTokensPerPurchase) {
            revert ExceedsMaximumTokensPerPurchase("Exceeds maximum tokens per purchase for this address");
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
