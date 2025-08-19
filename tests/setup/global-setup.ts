// Global Test Setup for Waternity
import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Waternity test environment setup...');
  
  try {
    // 1. Clean previous test artifacts
    await cleanTestArtifacts();
    
    // 2. Setup test database (if needed)
    await setupTestDatabase();
    
    // 3. Prepare mock data
    await prepareMockData();
    
    // 4. Verify application is running
    await verifyApplicationHealth();
    
    // 5. Setup test wallets and accounts
    await setupTestAccounts();
    
    console.log('✅ Test environment setup completed successfully');
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}

async function cleanTestArtifacts() {
  console.log('🧹 Cleaning previous test artifacts...');
  
  const artifactDirs = [
    '../test-results',
    '../coverage',
    '../screenshots',
    '../videos'
  ];
  
  for (const dir of artifactDirs) {
    try {
      const fullPath = path.resolve(__dirname, dir);
      await fs.rm(fullPath, { recursive: true, force: true });
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error) {
      // Directory might not exist, which is fine
    }
  }
}

async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');
  
  // For now, we're using in-memory/mock data
  // In a real implementation, you might:
  // 1. Create a test database
  // 2. Run migrations
  // 3. Seed with test data
  
  const testDbConfig = {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || '5432',
    database: process.env.TEST_DB_NAME || 'waternity_test',
    user: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password'
  };
  
  // Save test database config
  const configPath = path.resolve(__dirname, '../test-results/db-config.json');
  await fs.writeFile(configPath, JSON.stringify(testDbConfig, null, 2));
  
  console.log('✅ Test database configuration saved');
}

async function prepareMockData() {
  console.log('📊 Preparing mock data...');
  
  const mockData = {
    wells: [
      {
        id: 'test-well-1',
        name: 'Test Well Jakarta',
        location: 'Jakarta, Indonesia',
        capacity: 1000,
        pricePerLiter: 0.05,
        nftTokenId: '0.0.1001',
        fractionalTokenId: '0.0.1002',
        hcsTopicId: '0.0.1003',
        operator: '0.0.1234'
      },
      {
        id: 'test-well-2',
        name: 'Test Well Bandung',
        location: 'Bandung, Indonesia',
        capacity: 2000,
        pricePerLiter: 0.06,
        nftTokenId: '0.0.1004',
        fractionalTokenId: '0.0.1005',
        hcsTopicId: '0.0.1006',
        operator: '0.0.1235'
      }
    ],
    users: [
      {
        id: 'test-user-1',
        walletAddress: '0.0.1234',
        role: 'operator',
        name: 'Test Operator',
        email: 'operator@test.com'
      },
      {
        id: 'test-user-2',
        walletAddress: '0.0.1235',
        role: 'investor',
        name: 'Test Investor',
        email: 'investor@test.com'
      },
      {
        id: 'test-user-3',
        walletAddress: '0.0.1236',
        role: 'user',
        name: 'Test User',
        email: 'user@test.com'
      }
    ],
    devices: [
      {
        id: 'test-device-1',
        wellId: 'test-well-1',
        serialNumber: 'WTR-TEST001',
        model: 'WaterFlow Pro',
        firmwareVersion: '1.0.0',
        publicKey: 'ed25519_public_key_hex_here',
        status: 'online'
      },
      {
        id: 'test-device-2',
        wellId: 'test-well-2',
        serialNumber: 'WTR-TEST002',
        model: 'WaterFlow Pro',
        firmwareVersion: '1.0.0',
        publicKey: 'ed25519_public_key_hex_here_2',
        status: 'online'
      }
    ],
    sessions: [
      {
        id: 'test-session-1',
        userId: 'test-user-3',
        wellId: 'test-well-1',
        deviceId: 'test-device-1',
        volumeDispensed: 10.5,
        totalCost: 0.525,
        status: 'completed'
      }
    ]
  };
  
  // Save mock data
  const mockDataPath = path.resolve(__dirname, '../test-results/mock-data.json');
  await fs.writeFile(mockDataPath, JSON.stringify(mockData, null, 2));
  
  console.log('✅ Mock data prepared');
}

async function verifyApplicationHealth() {
  console.log('🏥 Verifying application health...');
  
  const baseURL = process.env.TEST_URL || 'http://localhost:3000';
  const maxRetries = 30;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      
      const response = await page.goto(baseURL, { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      if (response?.status() === 200) {
        await browser.close();
        console.log('✅ Application is healthy and responding');
        return;
      }
      
      await browser.close();
      throw new Error(`HTTP ${response?.status()}`);
      
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Application not ready (${error.message})`);
      
      if (i === maxRetries - 1) {
        throw new Error(`Application failed to start after ${maxRetries} attempts`);
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

async function setupTestAccounts() {
  console.log('👤 Setting up test accounts...');
  
  // In a real implementation, you might:
  // 1. Create test Hedera accounts
  // 2. Fund them with test HBAR
  // 3. Deploy test smart contracts
  // 4. Create test HTS tokens
  
  const testAccounts = {
    operator: {
      accountId: '0.0.1234',
      privateKey: 'test_private_key_1',
      publicKey: 'test_public_key_1'
    },
    investor: {
      accountId: '0.0.1235',
      privateKey: 'test_private_key_2',
      publicKey: 'test_public_key_2'
    },
    user: {
      accountId: '0.0.1236',
      privateKey: 'test_private_key_3',
      publicKey: 'test_public_key_3'
    },
    contracts: {
      wellRegistry: '0.0.2001',
      depositManager: '0.0.2002',
      revenueSplitter: '0.0.2003',
      fractionalVault: '0.0.2004'
    },
    tokens: {
      stablecoin: '0.0.3001',
      wellNFT: '0.0.3002',
      fractionalShares: '0.0.3003'
    },
    topics: {
      waterFlow: '0.0.4001',
      deviceStatus: '0.0.4002',
      revenue: '0.0.4003'
    }
  };
  
  // Save test accounts configuration
  const accountsPath = path.resolve(__dirname, '../test-results/test-accounts.json');
  await fs.writeFile(accountsPath, JSON.stringify(testAccounts, null, 2));
  
  // Set environment variables for tests
  process.env.TEST_OPERATOR_ACCOUNT = testAccounts.operator.accountId;
  process.env.TEST_INVESTOR_ACCOUNT = testAccounts.investor.accountId;
  process.env.TEST_USER_ACCOUNT = testAccounts.user.accountId;
  
  console.log('✅ Test accounts configured');
}

export default globalSetup;