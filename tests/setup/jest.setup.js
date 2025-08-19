// Jest Setup for Waternity Testing
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useInView: () => true,
}));

// Mock Hedera SDK
jest.mock('@hashgraph/sdk', () => ({
  Client: {
    forTestnet: jest.fn(() => ({
      setOperator: jest.fn(),
      close: jest.fn(),
    })),
    forMainnet: jest.fn(() => ({
      setOperator: jest.fn(),
      close: jest.fn(),
    })),
  },
  AccountId: {
    fromString: jest.fn((id) => ({ toString: () => id })),
  },
  PrivateKey: {
    fromString: jest.fn(() => ({
      publicKey: { toString: () => 'mock_public_key' },
      sign: jest.fn(() => new Uint8Array(64)),
    })),
    generate: jest.fn(() => ({
      toString: () => 'mock_private_key',
      publicKey: { toString: () => 'mock_public_key' },
    })),
  },
  TopicId: {
    fromString: jest.fn((id) => ({ toString: () => id })),
  },
  TokenId: {
    fromString: jest.fn((id) => ({ toString: () => id })),
  },
  TopicMessageSubmitTransaction: jest.fn(() => ({
    setTopicId: jest.fn().mockReturnThis(),
    setMessage: jest.fn().mockReturnThis(),
    execute: jest.fn(() => Promise.resolve({
      getReceipt: jest.fn(() => Promise.resolve({
        topicSequenceNumber: 1,
      })),
    })),
  })),
  TopicMessageQuery: jest.fn(() => ({
    setTopicId: jest.fn().mockReturnThis(),
    setStartTime: jest.fn().mockReturnThis(),
    setEndTime: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  })),
}));

// Mock Socket.IO
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  
  return {
    io: jest.fn(() => mockSocket),
    Socket: jest.fn(() => mockSocket),
  };
});

// Mock ed25519 crypto
jest.mock('@noble/ed25519', () => ({
  sign: jest.fn(() => Promise.resolve(new Uint8Array(64))),
  verify: jest.fn(() => Promise.resolve(true)),
  getPublicKey: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  utils: {
    randomPrivateKey: jest.fn(() => new Uint8Array(32)),
    bytesToHex: jest.fn((bytes) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')),
    hexToBytes: jest.fn((hex) => new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)))),
  },
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock console methods for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  // Mock Hedera account
  mockAccount: {
    accountId: '0.0.1234',
    privateKey: 'mock_private_key',
    publicKey: 'mock_public_key',
  },
  
  // Mock well data
  mockWell: {
    id: 1,
    name: 'Test Well',
    location: 'Test Location',
    capacity: 1000,
    pricePerLiter: '0.05',
    nftTokenId: '0.0.1001',
    fractionalTokenId: '0.0.1002',
    hcsTopicId: '0.0.1003',
    operator: '0.0.1234',
    isActive: true,
  },
  
  // Mock session data
  mockSession: {
    id: 'session-1',
    userId: '0.0.1236',
    wellId: 1,
    deviceId: 'device-1',
    volumeDispensed: 10.5,
    totalCost: 0.525,
    status: 'completed',
  },
  
  // Mock device data
  mockDevice: {
    id: 'device-1',
    wellId: 1,
    serialNumber: 'WTR-TEST001',
    status: 'online',
    batteryLevel: 85,
    signalStrength: 95,
    flowRate: 2.5,
  },
  
  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock events
  createMockEvent: (type, data) => ({
    type,
    timestamp: new Date().toISOString(),
    data,
  }),
};

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});