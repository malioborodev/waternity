require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000", // 10,000 ETH
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // Hedera Testnet
    testnet: {
      url: process.env.HEDERA_TESTNET_RPC || "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296,
      gas: 3000000,
      gasPrice: 10000000000, // 10 gwei
    },
    // Hedera Mainnet
    mainnet: {
      url: process.env.HEDERA_MAINNET_RPC || "https://mainnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 295,
      gas: 3000000,
      gasPrice: 10000000000, // 10 gwei
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 10, // gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      // Hedera doesn't use etherscan, but we can configure for other networks if needed
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      testnet: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "testnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.mirrornode.hedera.com/api/v1",
          browserURL: "https://hashscan.io/testnet",
        },
      },
      {
        network: "mainnet",
        chainId: 295,
        urls: {
          apiURL: "https://mainnet.mirrornode.hedera.com/api/v1",
          browserURL: "https://hashscan.io/mainnet",
        },
      },
    ],
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":WellRegistry$", ":DepositManager$", ":RevenueSplitter$", ":FractionalVault$"],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};