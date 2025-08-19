// Verification Pipeline for HCS Messages

import { ed25519 } from '@noble/ed25519';
import { HCSMessage, WaterFlowMessage, DeviceStatusMessage } from './messageFormats';

export interface DeviceRegistry {
  deviceId: string;
  wellId: string;
  publicKey: string; // ed25519 public key in hex
  isActive: boolean;
  lastSeen: number;
  owner: string; // Hedera account ID
}

export interface VerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  deviceInfo?: DeviceRegistry;
}

export class MessageVerificationPipeline {
  private deviceRegistry: Map<string, DeviceRegistry> = new Map();
  private maxTimestampDrift = 5 * 60 * 1000; // 5 minutes in milliseconds
  private maxSessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
  private activeSessions: Map<string, { startTime: number; totalVolume: number }> = new Map();

  /**
   * Register a new IoT device
   */
  registerDevice(device: DeviceRegistry): void {
    this.deviceRegistry.set(device.deviceId, device);
  }

  /**
   * Get device information
   */
  getDevice(deviceId: string): DeviceRegistry | undefined {
    return this.deviceRegistry.get(deviceId);
  }

  /**
   * Verify message signature using ed25519
   */
  private async verifySignature(
    message: HCSMessage,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Create message payload for signature verification (exclude signature field)
      const { signature, ...messagePayload } = message;
      const messageString = JSON.stringify(messagePayload);
      const messageBytes = new TextEncoder().encode(messageString);
      
      // Convert hex strings to Uint8Array
      const signatureBytes = new Uint8Array(
        signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const publicKeyBytes = new Uint8Array(
        publicKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Validate timestamp is within acceptable range
   */
  private validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);
    return timeDiff <= this.maxTimestampDrift;
  }

  /**
   * Validate water flow message specific rules
   */
  private validateWaterFlowMessage(message: WaterFlowMessage): string[] {
    const errors: string[] = [];

    // Check session consistency
    const sessionKey = `${message.deviceId}-${message.sessionId}`;
    const existingSession = this.activeSessions.get(sessionKey);

    if (existingSession) {
      // Validate session duration
      const sessionDuration = message.timestamp - existingSession.startTime;
      if (sessionDuration > this.maxSessionDuration) {
        errors.push('Session duration exceeds maximum allowed time');
      }

      // Validate volume consistency (should only increase)
      if (message.totalVolume < existingSession.totalVolume) {
        errors.push('Total volume cannot decrease during session');
      }
    } else {
      // New session - register it
      this.activeSessions.set(sessionKey, {
        startTime: message.timestamp,
        totalVolume: message.totalVolume
      });
    }

    // Validate flow rate and volume relationship
    if (message.flowRate < 0) {
      errors.push('Flow rate cannot be negative');
    }

    if (message.totalVolume < 0) {
      errors.push('Total volume cannot be negative');
    }

    if (message.pulseCount < 0) {
      errors.push('Pulse count cannot be negative');
    }

    // Validate pressure and temperature ranges
    if (message.pressure < 0 || message.pressure > 200) {
      errors.push('Pressure reading out of valid range (0-200 PSI)');
    }

    if (message.temperature < -10 || message.temperature > 60) {
      errors.push('Temperature reading out of valid range (-10 to 60°C)');
    }

    // Update session tracking
    if (existingSession) {
      existingSession.totalVolume = message.totalVolume;
    }

    return errors;
  }

  /**
   * Validate device status message specific rules
   */
  private validateDeviceStatusMessage(message: DeviceStatusMessage): string[] {
    const errors: string[] = [];

    // Validate battery level
    if (message.batteryLevel < 0 || message.batteryLevel > 100) {
      errors.push('Battery level must be between 0 and 100');
    }

    // Validate signal strength
    if (message.signalStrength < -120 || message.signalStrength > 0) {
      errors.push('Signal strength out of valid range (-120 to 0 dBm)');
    }

    // Validate diagnostics
    if (message.diagnostics.memoryUsage < 0 || message.diagnostics.memoryUsage > 100) {
      errors.push('Memory usage must be between 0 and 100');
    }

    if (message.diagnostics.uptime < 0) {
      errors.push('Uptime cannot be negative');
    }

    return errors;
  }

  /**
   * Comprehensive message verification
   */
  async verifyMessage(message: HCSMessage): Promise<VerificationResult> {
    const result: VerificationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if device is registered
    const device = this.getDevice(message.deviceId);
    if (!device) {
      result.errors.push('Device not registered in the system');
      result.isValid = false;
      return result;
    }

    result.deviceInfo = device;

    // Check if device is active
    if (!device.isActive) {
      result.errors.push('Device is not active');
      result.isValid = false;
    }

    // Verify device is associated with the correct well
    if (device.wellId !== message.wellId) {
      result.errors.push('Device is not associated with the specified well');
      result.isValid = false;
    }

    // Verify timestamp
    if (!this.validateTimestamp(message.timestamp)) {
      result.errors.push('Message timestamp is outside acceptable range');
      result.isValid = false;
    }

    // Verify signature
    const signatureValid = await this.verifySignature(message, device.publicKey);
    if (!signatureValid) {
      result.errors.push('Message signature verification failed');
      result.isValid = false;
    }

    // Message type specific validation
    if (message.messageType === 'WATER_FLOW') {
      const flowErrors = this.validateWaterFlowMessage(message);
      result.errors.push(...flowErrors);
    } else if (message.messageType === 'DEVICE_STATUS') {
      const statusErrors = this.validateDeviceStatusMessage(message);
      result.errors.push(...statusErrors);
    }

    // Update device last seen
    device.lastSeen = message.timestamp;

    // Add warnings for concerning values
    if (message.messageType === 'DEVICE_STATUS') {
      const statusMsg = message as DeviceStatusMessage;
      if (statusMsg.batteryLevel < 20) {
        result.warnings.push('Device battery level is low');
      }
      if (statusMsg.signalStrength < -90) {
        result.warnings.push('Device signal strength is weak');
      }
    }

    // Final validation result
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionKey, session] of this.activeSessions.entries()) {
      if (now - session.startTime > this.maxSessionDuration) {
        this.activeSessions.delete(sessionKey);
      }
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Get registered devices count
   */
  getRegisteredDevicesCount(): number {
    return this.deviceRegistry.size;
  }
}

// Export singleton instance
export const verificationPipeline = new MessageVerificationPipeline();