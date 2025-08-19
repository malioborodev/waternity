// Database Schema for Waternity Off-chain Data
// This provides minimal off-chain storage for performance and user experience

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  name?: string;
  role: 'investor' | 'user' | 'operator';
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    notifications: boolean;
    language: string;
    currency: string;
  };
}

export interface Well {
  id: string;
  nftTokenId: string; // HTS NFT Token ID
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    country: string;
  };
  operatorId: string;
  capacity: number; // Liters per day
  pricePerLiter: number; // In USD
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    installationDate: Date;
    lastMaintenance?: Date;
    waterQuality: {
      ph: number;
      tds: number; // Total Dissolved Solids
      turbidity: number;
      lastTested: Date;
    };
  };
}

export interface Investment {
  id: string;
  userId: string;
  wellId: string;
  fractionalTokenId: string; // HTS Fractional Token ID
  shares: number;
  totalShares: number;
  ownershipPercentage: number;
  investmentAmount: number; // In USD
  transactionHash: string;
  createdAt: Date;
  status: 'active' | 'sold' | 'transferred';
}

export interface WaterSession {
  id: string;
  userId: string;
  wellId: string;
  deviceId: string;
  startTime: Date;
  endTime?: Date;
  volumeDispensed: number; // Liters
  pricePerLiter: number;
  totalCost: number;
  paymentMethod: 'prepaid' | 'postpaid';
  status: 'active' | 'completed' | 'cancelled' | 'error';
  hcsTopicId: string;
  hcsSequenceNumbers: number[];
  transactionHash?: string;
  errorMessage?: string;
}

export interface Device {
  id: string;
  wellId: string;
  serialNumber: string;
  model: string;
  firmwareVersion: string;
  publicKey: string; // For ed25519 signature verification
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: Date;
  batteryLevel: number;
  signalStrength: number;
  flowRate: number; // Current flow rate in L/min
  totalVolume: number; // Total volume dispensed
  calibrationDate: Date;
  nextMaintenanceDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueDistribution {
  id: string;
  wellId: string;
  sessionId: string;
  totalRevenue: number;
  operatorShare: number;
  platformShare: number;
  investorShares: {
    userId: string;
    investmentId: string;
    amount: number;
    percentage: number;
  }[];
  distributionDate: Date;
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'investment' | 'revenue' | 'maintenance' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface SystemMetrics {
  id: string;
  timestamp: Date;
  totalWells: number;
  activeWells: number;
  totalUsers: number;
  totalInvestors: number;
  totalVolume: number; // Total liters dispensed
  totalRevenue: number;
  averagePrice: number;
  onlineDevices: number;
  totalDevices: number;
  networkHealth: {
    hcsLatency: number;
    mirrorNodeLatency: number;
    smartContractGas: number;
  };
}

// Database Indexes for Performance
export const DatabaseIndexes = {
  users: [
    { fields: ['walletAddress'], unique: true },
    { fields: ['email'], unique: true, sparse: true },
    { fields: ['role'] }
  ],
  wells: [
    { fields: ['nftTokenId'], unique: true },
    { fields: ['operatorId'] },
    { fields: ['status'] },
    { fields: ['location.country'] }
  ],
  investments: [
    { fields: ['userId'] },
    { fields: ['wellId'] },
    { fields: ['fractionalTokenId'], unique: true },
    { fields: ['userId', 'wellId'] },
    { fields: ['status'] }
  ],
  waterSessions: [
    { fields: ['userId'] },
    { fields: ['wellId'] },
    { fields: ['deviceId'] },
    { fields: ['startTime'] },
    { fields: ['status'] },
    { fields: ['hcsTopicId'] }
  ],
  devices: [
    { fields: ['wellId'] },
    { fields: ['serialNumber'], unique: true },
    { fields: ['status'] },
    { fields: ['lastSeen'] }
  ],
  revenueDistributions: [
    { fields: ['wellId'] },
    { fields: ['sessionId'] },
    { fields: ['distributionDate'] },
    { fields: ['status'] }
  ],
  notifications: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['read'] },
    { fields: ['createdAt'] }
  ],
  systemMetrics: [
    { fields: ['timestamp'] }
  ]
};

// Data Validation Schemas
export const ValidationSchemas = {
  user: {
    walletAddress: { required: true, pattern: /^0\.0\.[0-9]+$/ }, // Hedera account format
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    role: { enum: ['investor', 'user', 'operator'] }
  },
  well: {
    nftTokenId: { required: true, pattern: /^0\.0\.[0-9]+$/ },
    name: { required: true, minLength: 3, maxLength: 100 },
    capacity: { required: true, min: 100, max: 100000 }, // 100L to 100,000L per day
    pricePerLiter: { required: true, min: 0.01, max: 10 } // $0.01 to $10 per liter
  },
  device: {
    serialNumber: { required: true, pattern: /^WTR-[A-Z0-9]{8}$/ },
    publicKey: { required: true, length: 64 }, // ed25519 public key hex
    batteryLevel: { min: 0, max: 100 },
    signalStrength: { min: 0, max: 100 }
  }
};

// Database Migration Scripts
export const Migrations = {
  '001_initial_schema': {
    up: `
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(100),
        role VARCHAR(20) NOT NULL CHECK (role IN ('investor', 'user', 'operator')),
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE wells (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nft_token_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        location JSONB NOT NULL,
        operator_id UUID REFERENCES users(id),
        capacity INTEGER NOT NULL,
        price_per_liter DECIMAL(10,4) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE investments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        well_id UUID REFERENCES wells(id),
        fractional_token_id VARCHAR(20) UNIQUE NOT NULL,
        shares INTEGER NOT NULL,
        total_shares INTEGER NOT NULL,
        ownership_percentage DECIMAL(5,4) NOT NULL,
        investment_amount DECIMAL(12,2) NOT NULL,
        transaction_hash VARCHAR(128),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE water_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        well_id UUID REFERENCES wells(id),
        device_id UUID REFERENCES devices(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        volume_dispensed DECIMAL(10,3) DEFAULT 0,
        price_per_liter DECIMAL(10,4) NOT NULL,
        total_cost DECIMAL(10,4) DEFAULT 0,
        payment_method VARCHAR(20) DEFAULT 'prepaid',
        status VARCHAR(20) DEFAULT 'active',
        hcs_topic_id VARCHAR(20),
        hcs_sequence_numbers INTEGER[],
        transaction_hash VARCHAR(128),
        error_message TEXT
      );
      
      CREATE TABLE devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        well_id UUID REFERENCES wells(id),
        serial_number VARCHAR(20) UNIQUE NOT NULL,
        model VARCHAR(50),
        firmware_version VARCHAR(20),
        public_key VARCHAR(64) NOT NULL,
        location JSONB,
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP,
        battery_level INTEGER DEFAULT 100,
        signal_strength INTEGER DEFAULT 0,
        flow_rate DECIMAL(8,3) DEFAULT 0,
        total_volume DECIMAL(12,3) DEFAULT 0,
        calibration_date TIMESTAMP,
        next_maintenance_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `,
    down: `
      DROP TABLE IF EXISTS devices;
      DROP TABLE IF EXISTS water_sessions;
      DROP TABLE IF EXISTS investments;
      DROP TABLE IF EXISTS wells;
      DROP TABLE IF EXISTS users;
    `
  }
};