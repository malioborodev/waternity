// Device Manager for Waternity IoT Simulation

import { IoTDeviceSimulator, DeviceConfig, SessionConfig, generateDeviceKeyPair } from './deviceSimulator';
import { HCSClient } from '../hcs/hcsClient';
import { HCSMessage } from '../hcs/messageFormats';

export interface DeviceManagerConfig {
  hcsClient?: HCSClient;
  autoStatusReporting?: boolean;
  statusReportInterval?: number; // milliseconds
}

export interface DeviceInfo {
  deviceId: string;
  wellId: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  batteryLevel: number;
  signalStrength: number;
  activeSession: string | null;
  totalVolumePumped: number;
  lastSeen: number;
}

export class DeviceManager {
  private devices: Map<string, IoTDeviceSimulator> = new Map();
  private config: DeviceManagerConfig;
  private messageHistory: HCSMessage[] = [];
  private eventCallbacks: Map<string, ((event: any) => void)[]> = new Map();

  constructor(config: DeviceManagerConfig = {}) {
    this.config = {
      autoStatusReporting: true,
      statusReportInterval: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Create and register a new IoT device
   */
  async createDevice(wellId: string, location: { latitude: number; longitude: number; address: string }): Promise<string> {
    const deviceId = `device_${wellId}_${Date.now()}`;
    const keyPair = await generateDeviceKeyPair();
    
    const deviceConfig: DeviceConfig = {
      deviceId,
      wellId,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      location,
      specifications: {
        maxFlowRate: 15 + Math.random() * 10, // 15-25 L/min
        maxPressure: 50 + Math.random() * 30, // 50-80 PSI
        tankCapacity: 500 + Math.random() * 1000 // 500-1500 L
      }
    };

    const device = new IoTDeviceSimulator(deviceConfig);
    
    // Connect to HCS if available
    if (this.config.hcsClient) {
      device.connectToHCS(this.config.hcsClient);
    }

    // Set up message handling
    device.onMessage((message) => {
      this.handleDeviceMessage(deviceId, message);
    });

    // Start status reporting if enabled
    if (this.config.autoStatusReporting) {
      device.startStatusReporting(this.config.statusReportInterval);
    }

    this.devices.set(deviceId, device);
    
    this.emit('deviceCreated', { deviceId, wellId, config: deviceConfig });
    
    return deviceId;
  }

  /**
   * Remove a device from management
   */
  removeDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.destroy();
    this.devices.delete(deviceId);
    
    this.emit('deviceRemoved', { deviceId });
    
    return true;
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): IoTDeviceSimulator | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get all devices for a specific well
   */
  getDevicesForWell(wellId: string): IoTDeviceSimulator[] {
    return Array.from(this.devices.values())
      .filter(device => device.getConfig().wellId === wellId);
  }

  /**
   * Get summary information for all devices
   */
  getDevicesSummary(): DeviceInfo[] {
    return Array.from(this.devices.entries()).map(([deviceId, device]) => {
      const config = device.getConfig();
      const state = device.getState();
      
      return {
        deviceId,
        wellId: config.wellId,
        location: config.location.address,
        status: state.isOnline ? 
          (state.errorCodes.includes('MAINTENANCE_MODE') ? 'maintenance' : 'online') : 
          'offline',
        batteryLevel: state.batteryLevel,
        signalStrength: state.signalStrength,
        activeSession: state.currentSession?.sessionId || null,
        totalVolumePumped: state.totalVolumePumped,
        lastSeen: Date.now() // In real implementation, this would track actual last message
      };
    });
  }

  /**
   * Start a water dispensing session on a specific device
   */
  async startSession(deviceId: string, sessionConfig: SessionConfig): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    await device.startSession(sessionConfig);
    
    this.emit('sessionStarted', {
      deviceId,
      sessionId: sessionConfig.sessionId,
      userId: sessionConfig.userId,
      maxVolume: sessionConfig.maxVolume
    });
  }

  /**
   * Stop the current session on a specific device
   */
  async stopSession(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const state = device.getState();
    const sessionId = state.currentSession?.sessionId;
    
    await device.stopSession();
    
    this.emit('sessionStopped', { deviceId, sessionId });
  }

  /**
   * Set device maintenance mode
   */
  setMaintenanceMode(deviceId: string, enabled: boolean): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    if (enabled) {
      device.enterMaintenanceMode();
    } else {
      device.exitMaintenanceMode();
    }

    this.emit('maintenanceMode', { deviceId, enabled });
    
    return true;
  }

  /**
   * Set device online/offline status
   */
  setDeviceStatus(deviceId: string, online: boolean): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    if (online) {
      device.goOnline();
    } else {
      device.goOffline();
    }

    this.emit('statusChanged', { deviceId, online });
    
    return true;
  }

  /**
   * Handle messages from devices
   */
  private handleDeviceMessage(deviceId: string, message: HCSMessage): void {
    // Store message in history
    this.messageHistory.push(message);
    
    // Keep only last 1000 messages
    if (this.messageHistory.length > 1000) {
      this.messageHistory = this.messageHistory.slice(-1000);
    }

    // Emit message event
    this.emit('message', { deviceId, message });
    
    // Emit specific message type events
    this.emit(`message:${message.messageType}`, { deviceId, message });
  }

  /**
   * Get message history
   */
  getMessageHistory(filter?: {
    deviceId?: string;
    wellId?: string;
    messageType?: string;
    since?: number;
    limit?: number;
  }): HCSMessage[] {
    let messages = [...this.messageHistory];

    if (filter) {
      if (filter.deviceId) {
        messages = messages.filter(msg => msg.deviceId === filter.deviceId);
      }
      if (filter.wellId) {
        messages = messages.filter(msg => msg.wellId === filter.wellId);
      }
      if (filter.messageType) {
        messages = messages.filter(msg => msg.messageType === filter.messageType);
      }
      if (filter.since) {
        messages = messages.filter(msg => msg.timestamp >= filter.since!);
      }
    }

    // Sort by timestamp (newest first)
    messages.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      messages = messages.slice(0, filter.limit);
    }

    return messages;
  }

  /**
   * Get real-time statistics
   */
  getStatistics(): {
    totalDevices: number;
    onlineDevices: number;
    activeSessions: number;
    totalVolumePumped: number;
    messagesLast24h: number;
    averageBatteryLevel: number;
  } {
    const devices = Array.from(this.devices.values());
    const deviceStates = devices.map(device => device.getState());
    
    const onlineDevices = deviceStates.filter(state => state.isOnline).length;
    const activeSessions = deviceStates.filter(state => state.currentSession !== null).length;
    const totalVolumePumped = deviceStates.reduce((sum, state) => sum + state.totalVolumePumped, 0);
    
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const messagesLast24h = this.messageHistory.filter(msg => msg.timestamp >= last24h).length;
    
    const averageBatteryLevel = deviceStates.length > 0 ?
      deviceStates.reduce((sum, state) => sum + state.batteryLevel, 0) / deviceStates.length :
      0;

    return {
      totalDevices: devices.length,
      onlineDevices,
      activeSessions,
      totalVolumePumped,
      messagesLast24h,
      averageBatteryLevel
    };
  }

  /**
   * Create demo scenario with multiple devices
   */
  async createDemoScenario(): Promise<{
    devices: string[];
    wells: string[];
  }> {
    const demoWells = [
      {
        wellId: 'well_001',
        location: {
          latitude: -6.2088,
          longitude: 106.8456,
          address: 'Jakarta Central, Indonesia'
        }
      },
      {
        wellId: 'well_002', 
        location: {
          latitude: -7.2575,
          longitude: 112.7521,
          address: 'Surabaya, East Java, Indonesia'
        }
      },
      {
        wellId: 'well_003',
        location: {
          latitude: -6.9175,
          longitude: 107.6191,
          address: 'Bandung, West Java, Indonesia'
        }
      }
    ];

    const deviceIds: string[] = [];
    
    for (const well of demoWells) {
      const deviceId = await this.createDevice(well.wellId, well.location);
      deviceIds.push(deviceId);
      
      // Add some random variation to device states
      const device = this.getDevice(deviceId)!;
      const state = device.getState();
      
      // Randomly set some devices offline or in maintenance
      const rand = Math.random();
      if (rand < 0.1) {
        device.goOffline();
      } else if (rand < 0.2) {
        device.enterMaintenanceMode();
      }
    }

    this.emit('demoScenarioCreated', {
      devices: deviceIds,
      wells: demoWells.map(w => w.wellId)
    });

    return {
      devices: deviceIds,
      wells: demoWells.map(w => w.wellId)
    };
  }

  /**
   * Event system
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup all devices and resources
   */
  destroy(): void {
    this.devices.forEach(device => device.destroy());
    this.devices.clear();
    this.eventCallbacks.clear();
    this.messageHistory = [];
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();