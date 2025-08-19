// Hardhat Configuration for Waternity Smart Contract Testing
import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: '10000000000000000000000', // 10,000 ETH
      },
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },
    
    // Local testnet for integration testing
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
      gas: 12000000,
      gasPrice: 20000000000, // 20 gwei
    },
    
    // Hedera Testnet (for future integration)
    hederaTestnet: {
      url: process.env.HEDERA_TESTNET_URL || 'https://testnet.hashio.io/api',
      chainId: 296,
      accounts: process.env.HEDERA_TESTNET_PRIVATE_KEY ? [process.env.HEDERA_TESTNET_PRIVATE_KEY] : [],
      gas: 10000000,
      gasPrice: 'auto',
    },
    
    // Hedera Mainnet (for production)
    hederaMainnet: {
      url: process.env.HEDERA_MAINNET_URL || 'https://mainnet.hashio.io/api',
      chainId: 295,
      accounts: process.env.HEDERA_MAINNET_PRIVATE_KEY ? [process.env.HEDERA_MAINNET_PRIVATE_KEY] : [],
      gas: 10000000,
      gasPrice: 'auto',
    },
  },
  
  // Path configuration
  paths: {
    sources: './src/contracts',
    tests: './tests/contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 20, // gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: './test-results/gas-report.txt',
    noColors: true,
  },
  
  // Test configuration
  mocha: {
    timeout: 60000, // 60 seconds
    reporter: 'spec',
    reporterOptions: {
      output: './test-results/contract-tests.txt',
    },
  },
  
  // TypeScript configuration
  typechain: {
    outDir: 'src/contracts/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false,
    externalArtifacts: ['externalArtifacts/*.json'],
  },
};

// Task definitions
import { task } from 'hardhat/config';

// Custom task to deploy contracts for testing
task('deploy-test', 'Deploy contracts for testing')
  .setAction(async (taskArgs, hre) => {
    console.log('🚀 Deploying Waternity contracts for testing...');
    
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying contracts with account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());
    
    // Deploy WellRegistry
    const WellRegistry = await hre.ethers.getContractFactory('WellRegistry');
    const wellRegistry = await WellRegistry.deploy();
    await wellRegistry.deployed();
    console.log('✅ WellRegistry deployed to:', wellRegistry.address);
    
    // Deploy DepositManager
    const DepositManager = await hre.ethers.getContractFactory('DepositManager');
    const depositManager = await DepositManager.deploy();
    await depositManager.deployed();
    console.log('✅ DepositManager deployed to:', depositManager.address);
    
    // Deploy RevenueSplitter
    const RevenueSplitter = await hre.ethers.getContractFactory('RevenueSplitter');
    const revenueSplitter = await RevenueSplitter.deploy();
    await revenueSplitter.deployed();
    console.log('✅ RevenueSplitter deployed to:', revenueSplitter.address);
    
    // Deploy FractionalVault
    const FractionalVault = await hre.ethers.getContractFactory('FractionalVault');
    const fractionalVault = await FractionalVault.deploy();
    await fractionalVault.deployed();
    console.log('✅ FractionalVault deployed to:', fractionalVault.address);
    
    // Save deployment addresses
    const deployments = {
      wellRegistry: wellRegistry.address,
      depositManager: depositManager.address,
      revenueSplitter: revenueSplitter.address,
      fractionalVault: fractionalVault.address,
      deployer: deployer.address,
      network: hre.network.name,
      timestamp: new Date().toISOString(),
    };
    
    const fs = require('fs');
    const path = require('path');
    const deploymentsPath = path.join(__dirname, 'test-results', 'deployments.json');
    
    // Ensure directory exists
    const dir = path.dirname(deploymentsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log('📄 Deployment addresses saved to:', deploymentsPath);
    
    return deployments;
  });

// Task to run comprehensive tests
task('test-all', 'Run all contract tests with coverage')
  .setAction(async (taskArgs, hre) => {
    console.log('🧪 Running comprehensive contract tests...');
    
    // Deploy contracts first
    await hre.run('deploy-test');
    
    // Run tests with coverage
    await hre.run('coverage');
    
    console.log('✅ All contract tests completed');
  });

// Task to generate test data
task('generate-test-data', 'Generate test data for contracts')
  .setAction(async (taskArgs, hre) => {
    console.log('📊 Generating test data...');
    
    const testData = {
      accounts: {
        deployer: '0x0000000000000000000000000000000000000000',
        operator1: '0x1111111111111111111111111111111111111111',
        operator2: '0x2222222222222222222222222222222222222222',
        investor1: '0x3333333333333333333333333333333333333333',
        investor2: '0x4444444444444444444444444444444444444444',
        user1: '0x5555555555555555555555555555555555555555',
        user2: '0x6666666666666666666666666666666666666666',
      },
      wells: [
        {
          name: 'Jakarta Test Well',
          location: 'Jakarta, Indonesia',
          capacity: 1000,
          pricePerLiter: hre.ethers.utils.parseUnits('0.05', 18),
          nftTokenId: '0.0.1001',
          fractionalTokenId: '0.0.1002',
          hcsTopicId: '0.0.1003',
        },
        {
          name: 'Bandung Test Well',
          location: 'Bandung, Indonesia',
          capacity: 2000,
          pricePerLiter: hre.ethers.utils.parseUnits('0.06', 18),
          nftTokenId: '0.0.1004',
          fractionalTokenId: '0.0.1005',
          hcsTopicId: '0.0.1006',
        },
      ],
      sessions: [
        {
          userId: '0x5555555555555555555555555555555555555555',
          wellId: 1,
          volume: hre.ethers.utils.parseUnits('10.5', 18),
          cost: hre.ethers.utils.parseUnits('0.525', 18),
        },
        {
          userId: '0x6666666666666666666666666666666666666666',
          wellId: 2,
          volume: hre.ethers.utils.parseUnits('25.0', 18),
          cost: hre.ethers.utils.parseUnits('1.50', 18),
        },
      ],
    };
    
    const fs = require('fs');
    const path = require('path');
    const testDataPath = path.join(__dirname, 'test-results', 'contract-test-data.json');
    
    // Ensure directory exists
    const dir = path.dirname(testDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    console.log('✅ Test data generated and saved to:', testDataPath);
    
    return testData;
  });

// Task to clean test artifacts
task('clean-test', 'Clean test artifacts')
  .setAction(async (taskArgs, hre) => {
    console.log('🧹 Cleaning test artifacts...');
    
    const fs = require('fs');
    const path = require('path');
    
    const artifactDirs = [
      'test-results',
      'coverage',
      'cache',
      'artifacts',
    ];
    
    for (const dir of artifactDirs) {
      const fullPath = path.join(__dirname, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`🗑️ Removed ${dir}`);
      }
    }
    
    console.log('✅ Test artifacts cleaned');
  });

export default config;