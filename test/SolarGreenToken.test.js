const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SolarGreenToken", function () {
  let owner;
  let blacklister;
  let user;
  let token;

  beforeEach(async function () {
    [owner, blacklister, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SolarGreenToken");
    token = await Token.deploy();
    await token.deployed();
  });

  describe("Deploy", function () {
    it("should deploy successfully", async function () {
      expect(token.address).to.not.be.undefined;
    });

    it("should deploy with the correct initial supply", async function () {
      const initialSupply = ethers.utils.parseUnits("100000000", 18);
      expect(await token.totalSupply()).to.equal(initialSupply);
    });

    it("should have the owner as the default admin role", async function () {
      expect(
        await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), owner.address)
      ).to.be.true;
    });
  });

  describe("Blacklister Functionality", function () {
    // Checking the ability to issue the BLACKLISTER role by the administrator.
    it("should allow issuance of BLACKLISTER role by the administrator", async function () {
      const roleName = "BLACKLISTER";
      const BLACKLISTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(roleName)
      );

      await token
        .connect(owner)
        .grantRole(BLACKLISTER_ROLE, blacklister.address);

      // Checking if the user has the BLACKLISTER role
      expect(await token.hasRole(BLACKLISTER_ROLE, blacklister.address)).to.be
        .true;
    });

    it("should block a user by BLACKLISTER", async function () {
      // Defining the BLACKLISTER role name
      const roleName = "BLACKLISTER";

      // Computing the hash of the BLACKLISTER role name
      const BLACKLISTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(roleName)
      );

      // Issuing the BLACKLISTER role by the administrator (contract owner)
      await token
        .connect(owner)
        .grantRole(BLACKLISTER_ROLE, blacklister.address);

      // Checking if the user has the BLACKLISTER role
      expect(await token.hasRole(BLACKLISTER_ROLE, blacklister.address)).to.be
        .true;

      // Address of the user to be blocked
      const userToBlock = user.address;

      // Checking if the user is not blocked before blocking
      expect(await token.isUserBlocked(userToBlock)).to.be.false;

      // Blocking the user by the BLACKLISTER
      await token.connect(blacklister).blockUser(userToBlock);

      // Checking if the user was successfully blocked
      expect(await token.isUserBlocked(userToBlock)).to.be.true;
    });

    it("should unblock a user by BLACKLISTER", async function () {
      // Defining the BLACKLISTER role name
      const roleName = "BLACKLISTER";

      // Computing the hash of the BLACKLISTER role name
      const BLACKLISTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(roleName)
      );

      // Issuing the BLACKLISTER role by the administrator (contract owner)
      await token
        .connect(owner)
        .grantRole(BLACKLISTER_ROLE, blacklister.address);

      // Checking if the user has the BLACKLISTER role
      expect(await token.hasRole(BLACKLISTER_ROLE, blacklister.address)).to.be
        .true;

      // Address of the user to be unblocked
      const userToUnblock = user.address;

      // Blocking the user by the BLACKLISTER before unblocking
      await token.connect(blacklister).blockUser(userToUnblock);
      expect(await token.isUserBlocked(userToUnblock)).to.be.true;

      // Unblocking the user by the BLACKLISTER
      await token.connect(blacklister).unblockUser(userToUnblock);

      // Checking if the user was successfully unblocked
      expect(await token.isUserBlocked(userToUnblock)).to.be.false;
    });
  });

  describe("Token Transfer", function () {
    // Checking the ability to transfer tokens between users.
    it("should allow token transfer between users", async function () {
      // Getting initial balances of users
      const initialBalanceSender = await token.balanceOf(owner.address);
      const initialBalanceRecipient = await token.balanceOf(user.address);

      // Amount of tokens to transfer
      const amount = ethers.utils.parseEther("10");

      // Transferring tokens from owner to user
      await token.connect(owner).transfer(user.address, amount);

      // Checking that tokens were successfully transferred
      const finalBalanceSender = await token.balanceOf(owner.address);
      const finalBalanceRecipient = await token.balanceOf(user.address);

      expect(finalBalanceSender).to.equal(initialBalanceSender.sub(amount));
      expect(finalBalanceRecipient).to.equal(
        initialBalanceRecipient.add(amount)
      );
    });

    // Checking token transfer from blocked users.
    it("should allow token transfer from blocked users", async function () {
      // Getting initial balances of users
      const initialBalanceSender = await token.balanceOf(owner.address);
      const initialBalanceRecipient = await token.balanceOf(user.address);

      // Amount of tokens to transfer
      const amount = ethers.utils.parseEther("10");

      // Transferring tokens from owner to user
      await token.connect(owner).transfer(user.address, amount);

      // Checking that tokens were successfully transferred
      const finalBalanceSender = await token.balanceOf(owner.address);
      const finalBalanceRecipient = await token.balanceOf(user.address);

      expect(finalBalanceSender).to.equal(initialBalanceSender.sub(amount));
      expect(finalBalanceRecipient).to.equal(
        initialBalanceRecipient.add(amount)
      );

      // Issuing the blacklister role to the owner
      await token.connect(owner).grantBlacklisterRole(owner.address);

      // Blocking the user who transferred the tokens
      await token.connect(owner).blockUser(owner.address);

      // Checking that the blocked user cannot transfer tokens
      await expect(
        token.connect(owner).transfer(user.address, amount)
      ).to.be.revertedWith("Sender is blocked");
    });
  });

  describe("Token Minting", function () {
    // Checking the ability to mint new tokens by the administrator.
    it("should allow token minting by the administrator", async function () {
      // Expected amount of tokens to mint
      const amount = 100;

      // Checking that the user's initial balance is zero
      expect(await token.balanceOf(user.address)).to.equal(0);

      // Minting new tokens by the administrator
      await token.connect(owner).mint(user.address, amount);

      // Checking that the user's balance increased by the corresponding amount of tokens
      expect(await token.balanceOf(user.address)).to.equal(amount);
    });
  });

  describe("Token Burning", function () {
    // Checking the ability to burn tokens by the administrator.
    it("should allow token burning by the administrator", async function () {
      const amount = 100;
      // Transferring tokens to the user for further burning
      await token.connect(owner).transfer(user.address, amount);

      // Checking user's balance
      expect(await token.balanceOf(user.address)).to.eq(amount);

      // Burning tokens by the administrator
      await token.connect(owner).burn(user.address, amount);

      // Checking that the user's balance decreased by the corresponding amount of tokens
      expect(await token.balanceOf(user.address)).to.equal(0);
    });
  });
});
