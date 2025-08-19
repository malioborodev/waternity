// IoT Device Simulator for Waternity Water Wells

import { ed25519 } from '@noble/ed25519';
import { HCSMessage, WaterFlowMessage, DeviceStatusMessage } from '../hcs/messageFormats';
import { HCSClient } from '../hcs/hcsClient';

export interface DeviceConfig {
  deviceId: string;
  wellId: string;
  privateKey: string; // ed25519 private key in hex
  publicKey: string; // ed25519 public key in hex
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  specifications: {
    maxFlowRate: number; // L/min
    maxPressure: number; // PSI
    tankCapacity: number; // Liters
  };
}

export interface SessionConfig {
  sessionId: string;
  userId: string;
  maxVolume: number; // Maximum liters for this session
  pricePerLiter: number; // USDC per liter
  startTime: number;
}

export interface DeviceState {
  isOnline: boolean;
  batteryLevel: number; // 0-100%
  signalStrength: number; // dBm
  temperature: number; // Celsius
  pressure: number; // PSI
  tankLevel: number; // 0-100%
  lastMaintenance: number; // timestamp
  totalUptime: number; // seconds
  errorCodes: string[];
  currentSession: SessionConfig | null;
  totalVolumePumped: number; // Total liters since last reset
  pumpCycles: number; // Number of pump activations
}

export class IoTDeviceSimulator {
  private config: DeviceConfig;
  private state: DeviceState;
  private hcsClient: HCSClient | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;
  private statusInterval: NodeJS.Timeout | null = null;
  private messageCallbacks: ((message: HCSMessage) => void)[] = [];

  constructor(config: DeviceConfig) {
    this.config = config;
    this.state = {
      isOnline: true,
      batteryLevel: 85 + Math.random() * 15, // 85-100%
      signalStrength: -60 - Math.random() * 30, // -60 to -90 dBm
      temperature: 20 + Math.random() * 15, // 20-35°C
      pressure: 40 + Math.random() * 20, // 40-60 PSI
      tankLevel: 80 + Math.random() * 20, // 80-100%
      lastMaintenance: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      totalUptime: Math.random() * 365 * 24 * 60 * 60, // Up to 1 year
      errorCodes: [],
      currentSession: null,
      totalVolumePumped: Math.random() * 10000, // 0-10,000L
      pumpCycles: Math.floor(Math.random() * 5000) // 0-5,000 cycles
    };
  }

  /**
   * Connect to HCS for message submission
   */
  connectToHCS(hcsClient: HCSClient): void {
    this.hcsClient = hcsClient;
  }

  /**
   * Add callback for message events
   */
  onMessage(callback: (message: HCSMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * Sign a message using the device's private key
   */
  private async signMessage(messagePayload: any): Promise<string> {
    try {
      const messageString = JSON.stringify(messagePayload);
      const messageBytes = new TextEncoder().encode(messageString);
      
      // Convert hex private key to Uint8Array
      const privateKeyBytes = new Uint8Array(
        this.config.privateKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      
      const signature = await ed25519.sign(messageBytes, privateKeyBytes);
      
      // Convert signature to hex string
      return Array.from(signature)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Submit message to HCS and trigger callbacks
   */
  private async submitMessage(message: HCSMessage): Promise<void> {
    // Submit to HCS if connected
    if (this.hcsClient) {
      try {
        await this.hcsClient.submitMessage(message);
      } catch (error) {
        console.error('Error submitting to HCS:', error);
      }
    }

    // Trigger local callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  /**
   * Start a water dispensing session
   */
  async startSession(sessionConfig: SessionConfig): Promise<void> {
    if (this.state.currentSession) {
      throw new Error('Session already active');
    }

    if (!this.state.isOnline) {
      throw new Error('Device is offline');
    }

    this.state.currentSession = {
      ...sessionConfig,
      startTime: Date.now()
    };

    // Start simulation
    this.simulationInterval = setInterval(() => {
      this.simulateWaterFlow();
    }, 2000); // Every 2 seconds

    console.log(`Session ${sessionConfig.sessionId} started on device ${this.config.deviceId}`);
  }

  /**
   * Stop the current session
   */
  async stopSession(): Promise<void> {
    if (!this.state.currentSession) {
      throw new Error('No active session');
    }

    // Stop simulation
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    // Send final flow message with valve closed
    await this.sendWaterFlowMessage(0, 'CLOSED');

    console.log(`Session ${this.state.currentSession.sessionId} stopped`);
    this.state.currentSession = null;
  }

  /**
   * Simulate realistic water flow
   */
  private async simulateWaterFlow(): Promise<void> {
    if (!this.state.currentSession || !this.state.isOnline) return;

    const session = this.state.currentSession;
    const sessionDuration = (Date.now() - session.startTime) / 1000; // seconds
    
    // Simulate variable flow rate (realistic water usage pattern)
    let baseFlowRate = this.config.specifications.maxFlowRate * 0.6; // 60% of max
    
    // Add some variation based on session duration
    if (sessionDuration < 10) {
      baseFlowRate *= 0.8; // Slower start
    } else if (sessionDuration > 60) {
      baseFlowRate *= 0.9; // Slightly slower for long sessions
    }
    
    // Add random variation (±20%)
    const flowRate = baseFlowRate * (0.8 + Math.random() * 0.4);
    
    // Calculate volume for this interval (2 seconds)
    const volumeThisInterval = (flowRate / 60) * 2; // L/min to L per 2 seconds
    
    // Update state
    this.state.totalVolumePumped += volumeThisInterval;
    this.state.pumpCycles += 1;
    
    // Simulate pressure variations
    this.state.pressure = this.config.specifications.maxPressure * 0.7 + 
                         Math.random() * this.config.specifications.maxPressure * 0.3;
    
    // Simulate temperature changes (pump heating)
    this.state.temperature += Math.random() * 2 - 1; // ±1°C variation
    this.state.temperature = Math.max(15, Math.min(45, this.state.temperature));
    
    // Simulate battery drain
    this.state.batteryLevel -= 0.01; // 0.01% per 2 seconds
    
    // Send flow message
    await this.sendWaterFlowMessage(flowRate, 'OPEN');
    
    // Check session limits
    const totalSessionVolume = this.calculateSessionVolume();
    if (totalSessionVolume >= session.maxVolume) {
      await this.stopSession();
    }
  }

  /**
   * Calculate total volume for current session
   */
  private calculateSessionVolume(): number {
    if (!this.state.currentSession) return 0;
    
    const sessionDuration = (Date.now() - this.state.currentSession.startTime) / 1000 / 60; // minutes
    const avgFlowRate = this.config.specifications.maxFlowRate * 0.6;
    return sessionDuration * avgFlowRate;
  }

  /**
   * Send water flow message
   */
  private async sendWaterFlowMessage(flowRate: number, valveStatus: 'OPEN' | 'CLOSED'): Promise<void> {
    if (!this.state.currentSession) return;

    const session = this.state.currentSession;
    const totalVolume = this.calculateSessionVolume();
    const pulseCount = Math.floor(totalVolume * 10); // 10 pulses per liter

    const messagePayload = {
      timestamp: Date.now(),
      deviceId: this.config.deviceId,
      wellId: this.config.wellId,
      messageType: 'WATER_FLOW' as const,
      sessionId: session.sessionId,
      userId: session.userId,
      pulseCount,
      flowRate,
      totalVolume,
      valveStatus,
      pressure: this.state.pressure,
      temperature: this.state.temperature
    };

    const signature = await this.signMessage(messagePayload);
    
    const message: WaterFlowMessage = {
      ...messagePayload,
      signature
    };

    await this.submitMessage(message);
  }

  /**
   * Send device status message
   */
  private async sendDeviceStatusMessage(): Promise<void> {
    if (!this.state.isOnline) return;

    const messagePayload = {
      timestamp: Date.now(),
      deviceId: this.config.deviceId,
      wellId: this.config.wellId,
      messageType: 'DEVICE_STATUS' as const,
      status: this.state.isOnline ? 'ONLINE' as const : 'OFFLINE' as const,
      batteryLevel: this.state.batteryLevel,
      signalStrength: this.state.signalStrength,
      lastMaintenance: this.state.lastMaintenance,
      errorCode: this.state.errorCodes.length > 0 ? this.state.errorCodes[0] : undefined,
      diagnostics: {
        pumpStatus: this.state.errorCodes.includes('PUMP_ERROR') ? 'ERROR' as const : 'OK' as const,
        sensorStatus: this.state.errorCodes.includes('SENSOR_ERROR') ? 'ERROR' as const : 'OK' as const,
        networkStatus: this.state.signalStrength > -80 ? 'OK' as const : 'WARNING' as const,
        memoryUsage: 40 + Math.random() * 30, // 40-70%
        uptime: this.state.totalUptime
      }
    };

    const signature = await this.signMessage(messagePayload);
    
    const message: DeviceStatusMessage = {
      ...messagePayload,
      signature
    };

    await this.submitMessage(message);
  }

  /**
   * Start periodic status reporting
   */
  startStatusReporting(intervalMs: number = 30000): void {
    this.statusInterval = setInterval(() => {
      this.sendDeviceStatusMessage();
    }, intervalMs);
  }

  /**
   * Stop status reporting
   */
  stopStatusReporting(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  /**
   * Simulate device going offline
   */
  goOffline(): void {
    this.state.isOnline = false;
    if (this.state.currentSession) {
      this.stopSession();
    }
    this.stopStatusReporting();
  }

  /**
   * Simulate device coming online
   */
  goOnline(): void {
    this.state.isOnline = true;
    this.startStatusReporting();
  }

  /**
   * Simulate maintenance mode
   */
  enterMaintenanceMode(): void {
    this.state.errorCodes = ['MAINTENANCE_MODE'];
    if (this.state.currentSession) {
      this.stopSession();
    }
  }

  /**
   * Exit maintenance mode
   */
  exitMaintenanceMode(): void {
    this.state.errorCodes = [];
    this.state.lastMaintenance = Date.now();
    this.state.batteryLevel = 100; // Assume battery replaced/charged
  }

  /**
   * Get current device state
   */
  getState(): DeviceState {
    return { ...this.state };
  }

  /**
   * Get device configuration
   */
  getConfig(): DeviceConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    this.messageCallbacks = [];
  }
}

// Utility function to generate device key pair
export const generateDeviceKeyPair = async (): Promise<{ privateKey: string; publicKey: string }> => {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKey(privateKey);
  
  return {
    privateKey: Array.from(privateKey).map(byte => byte.toString(16).padStart(2, '0')).join(''),
    publicKey: Array.from(publicKey).map(byte => byte.toString(16).padStart(2, '0')).join('')
  };
};