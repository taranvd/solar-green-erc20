// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SolarGreenToken is ERC20, AccessControl {

    // Define the role for the blacklister
    bytes32 public constant BLACKLISTER = keccak256("BLACKLISTER");

    // Mapping to track blocked users
    mapping(address => bool) public isUserBlocked;

    // Event emitted when a user is blocked
    event UserBlocked(address indexed user);

    // Event emitted when a user is unblocked
    event UserUnblocked(address indexed user);

    constructor() ERC20("Solar Green", "SGR") {
        // Set the initial supply to 100,000,000 tokens
        uint256 initialSupply = 100000000 * 10 ** decimals();
        // Mint the initial supply to the contract deployer
        _mint(msg.sender, initialSupply);
        // Assign the DEFAULT_ADMIN_ROLE to the contract deployer
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Blocks the specified user from transferring tokens.
     * @dev This function can only be called by an account with the BLACKLISTER role.
     * @param user The address of the user to be blocked.
     */
    function blockUser(address user) external onlyRole(BLACKLISTER) {
        require(!isUserBlocked[user], "User is already blocked");
        isUserBlocked[user] = true;
        emit UserBlocked(user);
    }

    /**
     * @notice Unblocks the specified user, allowing them to transfer tokens again.
     * @dev This function can only be called by an account with the BLACKLISTER role.
     * @param user The address of the user to be unblocked.
     */
    function unblockUser(address user) external onlyRole(BLACKLISTER) {
        require(isUserBlocked[user], "User is not blocked");
        isUserBlocked[user] = false;
        emit UserUnblocked(user);
    }

    /**
     * @dev Internal hook that is called before any transfer of tokens.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(!isUserBlocked[from], "Sender is blocked");
        require(!isUserBlocked[to], "Recipient is blocked");
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @notice Mints new tokens and assigns them to the specified account.
     * @dev This function can only be called by an account with the DEFAULT_ADMIN_ROLE.
     * @param to The account to which new tokens will be minted.
     * @param amount The amount of tokens to mint.
     */
    function mint(
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Burns a specific amount of tokens from the specified account.
     * @dev This function can only be called by an account with the DEFAULT_ADMIN_ROLE.
     * @param from The account from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(
        address from,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(from, amount);
    }
}
