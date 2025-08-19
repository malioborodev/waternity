// Session Manager for Waternity Orchestrator

import { ProcessedMessage } from './mirrorNodeClient';
import { WaterFlowMessage, DeviceStatusMessage } from '../hcs/messageFormats';

export interface WaterSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  wellId: string;
  startTime: number;
  endTime?: number;
  maxVolume: number; // Liters
  pricePerLiter: number; // USDC
  totalVolume: number; // Actual liters dispensed
  totalCost: number; // Total USDC charged
  status: 'active' | 'completed' | 'cancelled' | 'error';
  lastActivity: number;
  flowEvents: WaterFlowEvent[];
  paymentTxHash?: string;
  revenueSplitTxHash?: string;
  errorMessage?: string;
}

export interface WaterFlowEvent {
  timestamp: number;
  consensusTimestamp: string;
  sequenceNumber: number;
  pulseCount: number;
  flowRate: number; // L/min
  totalVolume: number; // Cumulative liters
  valveStatus: 'OPEN' | 'CLOSED';
  pressure: number; // PSI
  temperature: number; // Celsius
  isValid: boolean;
}

export interface DeviceStatus {
  deviceId: string;
  wellId: string;
  lastSeen: number;
  status: 'ONLINE' | 'OFFLINE';
  batteryLevel: number;
  signalStrength: number;
  lastMaintenance: number;
  errorCode?: string;
  diagnostics?: {
    pumpStatus: 'OK' | 'WARNING' | 'ERROR';
    sensorStatus: 'OK' | 'WARNING' | 'ERROR';
    networkStatus: 'OK' | 'WARNING' | 'ERROR';
    memoryUsage: number;
    uptime: number;
  };
}

export interface SessionManagerConfig {
  sessionTimeout: number; // milliseconds
  maxSessionDuration: number; // milliseconds
  volumeTolerancePercent: number; // Tolerance for volume calculations
  cleanupInterval: number; // milliseconds
}

export class SessionManager {
  private config: SessionManagerConfig;
  private activeSessions: Map<string, WaterSession> = new Map();
  private deviceStatuses: Map<string, DeviceStatus> = new Map();
  private sessionCallbacks: Map<string, ((session: WaterSession) => void)[]> = new Map();
  private deviceCallbacks: ((deviceId: string, status: DeviceStatus) => void)[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: SessionManagerConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * Create a new water dispensing session
   */
  createSession(sessionData: {
    sessionId: string;
    userId: string;
    deviceId: string;
    wellId: string;
    maxVolume: number;
    pricePerLiter: number;
  }): WaterSession {
    // Check if device is online
    const deviceStatus = this.deviceStatuses.get(sessionData.deviceId);
    if (!deviceStatus || deviceStatus.status !== 'ONLINE') {
      throw new Error(`Device ${sessionData.deviceId} is not online`);
    }

    // Check if device already has an active session
    const existingSession = this.getActiveSessionForDevice(sessionData.deviceId);
    if (existingSession) {
      throw new Error(`Device ${sessionData.deviceId} already has an active session: ${existingSession.sessionId}`);
    }

    const session: WaterSession = {
      ...sessionData,
      startTime: Date.now(),
      totalVolume: 0,
      totalCost: 0,
      status: 'active',
      lastActivity: Date.now(),
      flowEvents: []
    };

    this.activeSessions.set(session.sessionId, session);
    
    console.log(`Created session ${session.sessionId} for device ${session.deviceId}`);
    this.emitSessionEvent('created', session);
    
    return session;
  }

  /**
   * Process HCS message and update relevant sessions
   */
  processMessage(processedMessage: ProcessedMessage): void {
    if (!processedMessage.isValid) {
      console.warn('Ignoring invalid message:', processedMessage.validationErrors);
      return;
    }

    const message = processedMessage.message;

    switch (message.messageType) {
      case 'WATER_FLOW':
        this.processWaterFlowMessage(processedMessage, message as WaterFlowMessage);
        break;
      case 'DEVICE_STATUS':
        this.processDeviceStatusMessage(processedMessage, message as DeviceStatusMessage);
        break;
      default:
        console.warn('Unknown message type:', message.messageType);
    }
  }

  /**
   * Process water flow message
   */
  private processWaterFlowMessage(
    processedMessage: ProcessedMessage,
    flowMessage: WaterFlowMessage
  ): void {
    const session = this.activeSessions.get(flowMessage.sessionId);
    if (!session) {
      console.warn(`No active session found for sessionId: ${flowMessage.sessionId}`);
      return;
    }

    // Verify message belongs to the correct device and user
    if (session.deviceId !== flowMessage.deviceId || session.userId !== flowMessage.userId) {
      console.error('Session mismatch in flow message:', {
        sessionDeviceId: session.deviceId,
        messageDeviceId: flowMessage.deviceId,
        sessionUserId: session.userId,
        messageUserId: flowMessage.userId
      });
      return;
    }

    // Create flow event
    const flowEvent: WaterFlowEvent = {
      timestamp: flowMessage.timestamp,
      consensusTimestamp: processedMessage.consensusTimestamp,
      sequenceNumber: processedMessage.sequenceNumber,
      pulseCount: flowMessage.pulseCount,
      flowRate: flowMessage.flowRate,
      totalVolume: flowMessage.totalVolume,
      valveStatus: flowMessage.valveStatus,
      pressure: flowMessage.pressure,
      temperature: flowMessage.temperature,
      isValid: true
    };

    // Add to session
    session.flowEvents.push(flowEvent);
    session.totalVolume = flowMessage.totalVolume;
    session.totalCost = session.totalVolume * session.pricePerLiter;
    session.lastActivity = Date.now();

    // Check if session should be completed
    if (flowMessage.valveStatus === 'CLOSED' || 
        session.totalVolume >= session.maxVolume) {
      this.completeSession(session.sessionId, 'Volume limit reached or valve closed');
    }

    this.emitSessionEvent('updated', session);
  }

  /**
   * Process device status message
   */
  private processDeviceStatusMessage(
    processedMessage: ProcessedMessage,
    statusMessage: DeviceStatusMessage
  ): void {
    const deviceStatus: DeviceStatus = {
      deviceId: statusMessage.deviceId,
      wellId: statusMessage.wellId,
      lastSeen: statusMessage.timestamp,
      status: statusMessage.status,
      batteryLevel: statusMessage.batteryLevel,
      signalStrength: statusMessage.signalStrength,
      lastMaintenance: statusMessage.lastMaintenance,
      errorCode: statusMessage.errorCode,
      diagnostics: statusMessage.diagnostics
    };

    this.deviceStatuses.set(statusMessage.deviceId, deviceStatus);

    // If device goes offline, cancel any active sessions
    if (statusMessage.status === 'OFFLINE') {
      const activeSession = this.getActiveSessionForDevice(statusMessage.deviceId);
      if (activeSession) {
        this.cancelSession(activeSession.sessionId, 'Device went offline');
      }
    }

    // Emit device status update
    this.deviceCallbacks.forEach(callback => {
      try {
        callback(statusMessage.deviceId, deviceStatus);
      } catch (error) {
        console.error('Error in device status callback:', error);
      }
    });
  }

  /**
   * Complete a session
   */
  completeSession(sessionId: string, reason?: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    session.status = 'completed';
    session.endTime = Date.now();
    
    console.log(`Completed session ${sessionId}: ${reason || 'Manual completion'}`);
    this.emitSessionEvent('completed', session);
    
    return true;
  }

  /**
   * Cancel a session
   */
  cancelSession(sessionId: string, reason?: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    session.status = 'cancelled';
    session.endTime = Date.now();
    session.errorMessage = reason;
    
    console.log(`Cancelled session ${sessionId}: ${reason || 'Manual cancellation'}`);
    this.emitSessionEvent('cancelled', session);
    
    return true;
  }

  /**
   * Mark session as error
   */
  errorSession(sessionId: string, errorMessage: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'error';
    session.endTime = Date.now();
    session.errorMessage = errorMessage;
    
    console.error(`Session ${sessionId} error: ${errorMessage}`);
    this.emitSessionEvent('error', session);
    
    return true;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WaterSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get active session for a device
   */
  getActiveSessionForDevice(deviceId: string): WaterSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.deviceId === deviceId && session.status === 'active') {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Get all sessions for a user
   */
  getSessionsForUser(userId: string): WaterSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Get all sessions for a well
   */
  getSessionsForWell(wellId: string): WaterSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.wellId === wellId);
  }

  /**
   * Get device status
   */
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    return this.deviceStatuses.get(deviceId);
  }

  /**
   * Get all device statuses
   */
  getAllDeviceStatuses(): DeviceStatus[] {
    return Array.from(this.deviceStatuses.values());
  }

  /**
   * Get session statistics
   */
  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    errorSessions: number;
    totalVolume: number;
    totalRevenue: number;
    onlineDevices: number;
    totalDevices: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const devices = Array.from(this.deviceStatuses.values());
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      errorSessions: sessions.filter(s => s.status === 'error').length,
      totalVolume: sessions.reduce((sum, s) => sum + s.totalVolume, 0),
      totalRevenue: sessions.reduce((sum, s) => sum + s.totalCost, 0),
      onlineDevices: devices.filter(d => d.status === 'ONLINE').length,
      totalDevices: devices.length
    };
  }

  /**
   * Subscribe to session events
   */
  onSessionEvent(
    event: 'created' | 'updated' | 'completed' | 'cancelled' | 'error',
    callback: (session: WaterSession) => void
  ): void {
    if (!this.sessionCallbacks.has(event)) {
      this.sessionCallbacks.set(event, []);
    }
    this.sessionCallbacks.get(event)!.push(callback);
  }

  /**
   * Subscribe to device status updates
   */
  onDeviceStatus(callback: (deviceId: string, status: DeviceStatus) => void): void {
    this.deviceCallbacks.push(callback);
  }

  /**
   * Emit session event
   */
  private emitSessionEvent(event: string, session: WaterSession): void {
    const callbacks = this.sessionCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(session);
        } catch (error) {
          console.error(`Error in session ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Start cleanup timer for old sessions
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup old and timed-out sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const sessionsToRemove: string[] = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      // Check for session timeout
      if (session.status === 'active') {
        const timeSinceLastActivity = now - session.lastActivity;
        const sessionDuration = now - session.startTime;
        
        if (timeSinceLastActivity > this.config.sessionTimeout) {
          this.cancelSession(sessionId, 'Session timeout due to inactivity');
        } else if (sessionDuration > this.config.maxSessionDuration) {
          this.completeSession(sessionId, 'Maximum session duration reached');
        }
      }
      
      // Remove completed sessions older than 24 hours
      if (session.status !== 'active' && session.endTime) {
        const timeSinceEnd = now - session.endTime;
        if (timeSinceEnd > 24 * 60 * 60 * 1000) { // 24 hours
          sessionsToRemove.push(sessionId);
        }
      }
    }
    
    // Remove old sessions
    sessionsToRemove.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });
    
    if (sessionsToRemove.length > 0) {
      console.log(`Cleaned up ${sessionsToRemove.length} old sessions`);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.activeSessions.clear();
    this.deviceStatuses.clear();
    this.sessionCallbacks.clear();
    this.deviceCallbacks = [];
  }
}

// Default configuration
export const defaultSessionManagerConfig: SessionManagerConfig = {
  sessionTimeout: 5 * 60 * 1000, // 5 minutes
  maxSessionDuration: 30 * 60 * 1000, // 30 minutes
  volumeTolerancePercent: 5, // 5% tolerance
  cleanupInterval: 60 * 1000 // 1 minute
};