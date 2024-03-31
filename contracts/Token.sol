// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SolarGreenToken is ERC20, AccessControl {
    // Define the role for the blacklister
    bytes32 public constant BLACKLISTER = keccak256("BLACKLISTER");
    // Mapping to track blocked users
    mapping(address => bool) public blockedUsers;

    constructor() ERC20("Solar Green", "SGR") {
        // Set the initial supply to 100,000,000 tokens
        uint256 initialSupply = 100000000 * 10 ** decimals();
        // Mint the initial supply to the contract deployer
        _mint(msg.sender, initialSupply);
        // Assign the DEFAULT_ADMIN_ROLE to the contract deployer
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Grants the BLACKLISTER role to the specified account.
     * @param account The account to be granted the BLACKLISTER role.
     */
    function grantBlacklisterRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BLACKLISTER, account);
    }

    /**
     * @dev Blocks the specified user from transferring tokens.
     * @param user The address of the user to be blocked.
     */
    function blockUser(address user) external onlyRole(BLACKLISTER) {
        blockedUsers[user] = true;
    }

    /**
     * @dev Unblocks the specified user, allowing them to transfer tokens again.
     * @param user The address of the user to be unblocked.
     */
    function unblockUser(address user) external onlyRole(BLACKLISTER) {
        blockedUsers[user] = false;
    }

    /**
     * @dev Checks if the specified user is blocked from transferring tokens.
     * @param user The address of the user to be checked.
     * @return A boolean indicating if the user is blocked.
     */
    function isUserBlocked(address user) public view returns (bool) {
        return blockedUsers[user];
    }

    /**
     * @dev Overrides the transfer function to prevent transfers involving blocked users.
     */
    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        require(!blockedUsers[msg.sender], "Sender is blocked");
        require(!blockedUsers[to], "Recipient is blocked");
        return super.transfer(to, value);
    }

    /**
     * @dev Overrides the transferFrom function to prevent transfers involving blocked users.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        require(!blockedUsers[from], "Sender is blocked");
        require(!blockedUsers[to], "Recipient is blocked");
        return super.transferFrom(from, to, value);
    }

    /**
     * @dev Mints new tokens and assigns them to the specified account.
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
     * @dev Burns a specific amount of tokens from the specified account.
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
