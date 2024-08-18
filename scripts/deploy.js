const { ethers, upgrades } = require("hardhat");
const CONFIG = require("../config");

async function main() {
  const gas = await ethers.provider.getGasPrice();
  const TokenSale = await ethers.getContractFactory("TokenSale");

  console.log("Deploying TokenSale...");
  const tokenSale = await upgrades.deployProxy(
    TokenSale,
    [process.env[CONFIG.TOKEN_ADDRESS], 10000, Math.floor(Date.now() / 1000)],
    {
      gasPrice: gas,
      initializer: "initialize",
    }
  );

  await tokenSale.deployed();
  console.log("TokenSale deployed to:", tokenSale.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
