const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenSale", function () {
  let owner;
  let user;
  let buyer;
  let tokenSale;
  let token;
  const RATE = 10000;
  const START_TIME = Math.floor(Date.now() / 1000);
  const INITIAL_SUPPLY = ethers.utils.parseUnits("50000000", 18);

  beforeEach(async function () {
    [owner, user, buyer] = await ethers.getSigners();

    // Deploy the token contract
    const Token = await ethers.getContractFactory("SolarGreenToken");
    token = await Token.deploy();
    await token.deployed();

    // Deploy the TokenSale contract
    const TokenSale = await ethers.getContractFactory("TokenSale");
    tokenSale = await upgrades.deployProxy(
      TokenSale,
      [token.address, RATE, START_TIME],
      { initializer: "initialize" }
    );
    await tokenSale.deployed();

    // Transfer tokens to the TokenSale contract
    await token.transfer(tokenSale.address, INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(tokenSale.address).to.not.be.undefined;
    });

    it("should have an owner and a token", async function () {
      expect(await tokenSale.owner()).to.equal(owner.address);
      expect(await tokenSale.token()).to.equal(token.address);
    });
  });

  describe("Token Exchange Functionality", function () {
    it("should allow users to buy tokens", async function () {
      const amountToBuy = ethers.utils.parseUnits("1000", 18); // 1000 tokens
      const etherAmount = ethers.utils.parseEther("0.1"); // 0.1 ether

      // Purchase tokens
      await tokenSale
        .connect(buyer)
        .buyTokens(amountToBuy, { value: etherAmount });

      // Check the token balance of the buyer
      expect(await token.balanceOf(buyer.address)).to.equal(amountToBuy);
      expect(await tokenSale.tokensPurchased(buyer.address)).to.equal(
        amountToBuy
      );
    });

    it("should not allow users to buy tokens after the sale has ended", async function () {
      // End the token sale
      const pastTime = Math.floor(Date.now() / 1000) - 1; // Set to a past time
      await tokenSale.setEndTime(pastTime);

      // Check that buying tokens after the sale has ended is not possible
      await expect(
        tokenSale.connect(user).buyTokens(ethers.utils.parseUnits("1000", 18), {
          value: ethers.utils.parseEther("0.1"),
        })
      ).to.be.revertedWithCustomError(tokenSale, "TokenSaleHasEnded");
    });
  });

  describe("Contract Management", function () {
    it("should allow only owner to withdraw ether", async function () {
      const etherAmount = ethers.utils.parseEther("0.1"); // 0.1 ether

      // User purchases tokens
      await tokenSale
        .connect(buyer)
        .buyTokens(ethers.utils.parseUnits("1000", 18), { value: etherAmount });

      // Check the contract's balance
      expect(await ethers.provider.getBalance(tokenSale.address)).to.equal(
        etherAmount
      );

      // Verify that only the owner can withdraw ether
      await expect(tokenSale.connect(user).withdrawEther()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // Withdraw ether by the owner
      await tokenSale.withdrawEther();
      expect(await ethers.provider.getBalance(owner.address)).to.be.above(0);
    });

    it("should allow only owner to set duration", async function () {
      const newDuration = 7 * 24 * 60 * 60; // 7 days in seconds

      // Verify that only the owner can change the duration
      await expect(
        tokenSale.connect(user).setDuration(newDuration)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Owner changes the duration
      await tokenSale.setDuration(newDuration);

      // Get the end time value as BigNumber
      const actualEndTime = await tokenSale.endTime();

      // Convert BigNumber to number for comparison
      const expectedEndTime = START_TIME + newDuration;

      // Check that actualEndTime is close to expectedEndTime with an acceptable tolerance
      expect(actualEndTime.toNumber()).to.be.closeTo(expectedEndTime, 10);
    });
  });
});
