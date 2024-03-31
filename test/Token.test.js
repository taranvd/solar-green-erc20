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
    // Перевірка можливості видання ролі BLACKLISTER адміністратором.
    it("should allow issuance of BLACKLISTER role by the administrator", async function () {
      const roleName = "BLACKLISTER";
      const BLACKLISTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(roleName)
      );

      await token
        .connect(owner)
        .grantRole(BLACKLISTER_ROLE, blacklister.address);

      // Перевірка, чи має користувач роль BLACKLISTER
      expect(await token.hasRole(BLACKLISTER_ROLE, blacklister.address)).to.be
        .true;
    });

    it("should block a user by BLACKLISTER", async function () {
      // Визначення назви ролі BLACKLISTER
      const roleName = "BLACKLISTER";

      // Обчислення хешу назви ролі BLACKLISTER
      const BLACKLISTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(roleName)
      );

      // Видання ролі BLACKLISTER адміністратором (власником контракту)
      await token
        .connect(owner)
        .grantRole(BLACKLISTER_ROLE, blacklister.address);

      // Перевірка, чи має користувач роль BLACKLISTER
      expect(await token.hasRole(BLACKLISTER_ROLE, blacklister.address)).to.be
        .true;

      // Адреса користувача, якого потрібно заблокувати
      const userToBlock = user.address;

      // Перевірка, чи користувач не заблокований перед блокуванням
      expect(await token.isUserBlocked(userToBlock)).to.be.false;

      // Блокування користувача BLACKLISTER'ом
      await token.connect(blacklister).blockUser(userToBlock);

      // Перевірка, чи користувач був успішно заблокований
      expect(await token.isUserBlocked(userToBlock)).to.be.true;
    });

    it("should unblock a user by BLACKLISTER", async function () {
      // Визначення назви ролі BLACKLISTER
      const roleName = "BLACKLISTER";

      // Обчислення хешу назви ролі BLACKLISTER
      const BLACKLISTER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(roleName)
      );

      // Видання ролі BLACKLISTER адміністратором (власником контракту)
      await token
        .connect(owner)
        .grantRole(BLACKLISTER_ROLE, blacklister.address);

      // Перевірка, чи має користувач роль BLACKLISTER
      expect(await token.hasRole(BLACKLISTER_ROLE, blacklister.address)).to.be
        .true;

      // Адреса користувача, якого потрібно розблокувати
      const userToUnblock = user.address;

      // Блокування користувача BLACKLISTER'ом перед розблокуванням
      await token.connect(blacklister).blockUser(userToUnblock);
      expect(await token.isUserBlocked(userToUnblock)).to.be.true;

      // Розблокування користувача BLACKLISTER'ом
      await token.connect(blacklister).unblockUser(userToUnblock);

      // Перевірка, чи користувач був успішно розблокований
      expect(await token.isUserBlocked(userToUnblock)).to.be.false;
    });
  });

  describe("Token Transfer", function () {
    // Перевірка можливості передачі токенів між користувачами.
    it("should allow token transfer between users", async function () {
      // Отримати початковий баланс користувачів
      const initialBalanceSender = await token.balanceOf(owner.address);
      const initialBalanceRecipient = await token.balanceOf(user.address);

      // Кількість токенів для передачі
      const amount = ethers.utils.parseEther("10");

      // Передача токенів від власника до користувача
      await token.connect(owner).transfer(user.address, amount);

      // Перевірити, що токени були успішно передані
      const finalBalanceSender = await token.balanceOf(owner.address);
      const finalBalanceRecipient = await token.balanceOf(user.address);

      expect(finalBalanceSender).to.equal(initialBalanceSender.sub(amount));
      expect(finalBalanceRecipient).to.equal(
        initialBalanceRecipient.add(amount)
      );
    });

    // Перевірка передачі токенів від блокованих користувачів.
    it("should allow token transfer from blocked users", async function () {
      // Отримати початковий баланс користувачів
      const initialBalanceSender = await token.balanceOf(owner.address);
      const initialBalanceRecipient = await token.balanceOf(user.address);

      // Кількість токенів для передачі
      const amount = ethers.utils.parseEther("10");

      // Передача токенів від власника до користувача
      await token.connect(owner).transfer(user.address, amount);

      // Перевірити, що токени були успішно передані
      const finalBalanceSender = await token.balanceOf(owner.address);
      const finalBalanceRecipient = await token.balanceOf(user.address);

      expect(finalBalanceSender).to.equal(initialBalanceSender.sub(amount));
      expect(finalBalanceRecipient).to.equal(
        initialBalanceRecipient.add(amount)
      );

      // Перед блокуванням видати роль овнеру
      await token.connect(owner).grantBlacklisterRole(owner.address);

      // Блокування користувача, який передав токени
      await token.connect(owner).blockUser(owner.address);

      // Перевірити, що блокований користувач не може передати токени
      await expect(
        token.connect(owner).transfer(user.address, amount)
      ).to.be.revertedWith("Sender is blocked");
    });
  });

  describe("Token Minting", function () {
    // Перевірка можливості видання нових токенів адміністратором.
    it("should allow token minting by the administrator", async function () {
      // Очікувана кількість токенів для видання
      const amount = 100;

      // Перевірка, що початковий баланс користувача дорівнює нулю
      expect(await token.balanceOf(user.address)).to.equal(0);

      // Видання нових токенів адміністратором
      await token.connect(owner).mint(user.address, amount);

      // Перевірка, що баланс користувача збільшився на відповідну кількість токенів
      expect(await token.balanceOf(user.address)).to.equal(amount);
    });
  });

  describe("Token Burning", function () {
    // Перевірка можливості спалення токенів адміністратором.
    it("should allow token burning by the administrator", async function () {
      const amount = 100;
      // Передача токенів користувачеві для подальшого спалення
      await token.connect(owner).transfer(user.address, amount);

      // перевірка балансу користувача
      expect(await token.balanceOf(user.address)).to.eq(amount);

      // Спалення токенів адміністратором
      await token.connect(owner).burn(user.address, amount);

      // Перевірка, що баланс користувача зменшився на відповідну кількість токенів
      expect(await token.balanceOf(user.address)).to.equal(0);
    });
  });
});
