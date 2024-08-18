require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const CONFIG = require("./config");

module.exports = {
  solidity: "0.8.15",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env[CONFIG.INFURA_API_KEY]}`,
      accounts: [`0x${process.env[CONFIG.PRIVATE_KEY]}`],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env[CONFIG.ETHERSCAN_API_KEY],
  },
};
