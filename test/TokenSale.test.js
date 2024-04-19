const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSale", function () {
  let owner;
  let user;
  let tokenSale;
  let token;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SolarGreenToken");
    token = await Token.deploy();
    await token.deployed();

    const TokenSale = await ethers.getContractFactory("TokenSale");
    tokenSale = await TokenSale.deploy(token.address, 1000000000000000);
    await tokenSale.deployed();
  });

  describe("Deployment", function () {
    // Check successful deployment of the TokenSale contract
    it("should deploy successfully", async function () {
      expect(tokenSale.address).to.not.be.undefined;
    });

    it("should have an owner and a token", async function () {
      // Verify that the contract owner is 'owner'
      expect(await tokenSale.owner()).to.equal(owner.address);

      // Verify that the token address is set and matches the address of the previously deployed token
      expect(await tokenSale.TOKEN()).to.equal(token.address);
    });
  });

  describe("Token Exchange Functionality", function () {
    it("should allow users to buy tokens", async function () {
      // Refill the contract's token balance
      const amountToAdd = ethers.utils.parseUnits("100000", 18); // Assume adding 100000 tokens
      await token.connect(owner).transfer(tokenSale.address, amountToAdd);

      // Check that the contract's token balance increased by 100000
      expect(await token.balanceOf(tokenSale.address)).to.equal(amountToAdd);

      // Define the token price
      const tokenPrice = 1000000000000000; // Price per token in wei

      // Calculate the expected amount of tokens a user gets for 0.008 ether
      const ethersAmount = ethers.utils.parseEther("0.008");
      const expectedTokenAmount = ethersAmount / tokenPrice;

      // Call the buy tokens function on behalf of the user
      await tokenSale.connect(user).buyTokens({ value: ethersAmount });

      // Check that the user received the expected amount of tokens
      expect(await token.balanceOf(user.address)).to.equal(expectedTokenAmount);
    });

    it("should not allow users to buy tokens after the sale has ended", async function () {
      // End the token sale by setting duration to zero
      await tokenSale.setDuration(0);

      // Verify that attempting to buy tokens after the sale has ended reverts with an error
      await expect(
        tokenSale.connect(user).buyTokens({ value: 100 })
      ).to.be.revertedWith("Token sale has ended!");
    });
  });

  describe("Contract Management", function () {
    it("should allow only owner to set token address", async function () {
      // Generate a random token address
      const randomAddress = ethers.utils.getAddress(
        ethers.utils.hexlify(ethers.utils.randomBytes(20))
      );

      // Attempt to change the token address by a non-owner of the contract
      await expect(
        tokenSale.connect(user).setToken(randomAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Change the token address by the owner of the contract
      await tokenSale.setToken(randomAddress);

      // Verify that the token address has been changed
      expect(await tokenSale.TOKEN()).to.equal(randomAddress);
    });

    it("should allow only owner to withdraw ether", async function () {
      const tokenPrice = 1000000000000000; // Token price in wei

      // Amount of ether spent by the user to buy tokens
      const ethersAmount = ethers.utils.parseEther("0.008");

      // Calculate the expected amount of tokens a user gets for 0.008 ether
      const expectedTokenAmount = ethersAmount / tokenPrice;

      // Transfer tokens to the token sale contract
      await token.connect(owner).transfer(tokenSale.address, ethersAmount);

      // Ensure tokens were successfully transferred to the token sale contract
      expect(await token.balanceOf(tokenSale.address)).to.equal(ethersAmount);

      // Buy tokens from the user
      await tokenSale.connect(user).buyTokens({ value: ethersAmount });

      // Ensure that attempting to withdraw ether not by the owner of the contract reverts with an error
      await expect(tokenSale.connect(user).withdrawEther()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // Withdraw ether by the owner of the contract
      await tokenSale.withdrawEther();

      // Ensure that ether has been successfully withdrawn from the contract
      expect(await ethers.provider.getBalance(owner.address)).to.be.above(0);
    });

    it("should allow only owner to set duration", async function () {
      const newDuration = 7 * 24 * 60 * 60; // 7 days in seconds

      // Attempt to change the token sale duration by a non-owner of the contract
      await expect(
        tokenSale.connect(user).setDuration(newDuration)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Change the token sale duration by the owner of the contract
      await tokenSale.setDuration(newDuration);

      // Ensure that the token sale duration has been changed
      expect(await tokenSale.duration()).to.equal(newDuration);
    });
  });
});
