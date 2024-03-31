const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const SolarGreenToken = await ethers.getContractFactory("SolarGreenToken");
  const solarGreenToken = await SolarGreenToken.deploy();

  console.log("SolarGreenToken deployed to:", solarGreenToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
