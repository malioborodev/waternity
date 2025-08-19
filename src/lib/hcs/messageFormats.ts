// HCS Message Formats for Waternity IoT Events

export interface BaseHCSMessage {
  timestamp: number;
  deviceId: string;
  wellId: string;
  signature: string; // ed25519 signature
  messageType: 'WATER_FLOW' | 'DEVICE_STATUS';
}

export interface WaterFlowMessage extends BaseHCSMessage {
  messageType: 'WATER_FLOW';
  sessionId: string;
  userId: string;
  pulseCount: number;
  flowRate: number; // liters per minute
  totalVolume: number; // total liters dispensed in session
  valveStatus: 'OPEN' | 'CLOSED';
  pressure: number; // PSI
  temperature: number; // Celsius
}

export interface DeviceStatusMessage extends BaseHCSMessage {
  messageType: 'DEVICE_STATUS';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  batteryLevel: number; // percentage
  signalStrength: number; // dBm
  lastMaintenance: number; // timestamp
  errorCode?: string;
  diagnostics: {
    pumpStatus: 'OK' | 'WARNING' | 'ERROR';
    sensorStatus: 'OK' | 'WARNING' | 'ERROR';
    networkStatus: 'OK' | 'WARNING' | 'ERROR';
    memoryUsage: number; // percentage
    uptime: number; // seconds
  };
}

export type HCSMessage = WaterFlowMessage | DeviceStatusMessage;

// Message validation schemas
export const validateWaterFlowMessage = (message: any): message is WaterFlowMessage => {
  return (
    message.messageType === 'WATER_FLOW' &&
    typeof message.timestamp === 'number' &&
    typeof message.deviceId === 'string' &&
    typeof message.wellId === 'string' &&
    typeof message.signature === 'string' &&
    typeof message.sessionId === 'string' &&
    typeof message.userId === 'string' &&
    typeof message.pulseCount === 'number' &&
    typeof message.flowRate === 'number' &&
    typeof message.totalVolume === 'number' &&
    ['OPEN', 'CLOSED'].includes(message.valveStatus) &&
    typeof message.pressure === 'number' &&
    typeof message.temperature === 'number'
  );
};

export const validateDeviceStatusMessage = (message: any): message is DeviceStatusMessage => {
  return (
    message.messageType === 'DEVICE_STATUS' &&
    typeof message.timestamp === 'number' &&
    typeof message.deviceId === 'string' &&
    typeof message.wellId === 'string' &&
    typeof message.signature === 'string' &&
    ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'].includes(message.status) &&
    typeof message.batteryLevel === 'number' &&
    typeof message.signalStrength === 'number' &&
    typeof message.lastMaintenance === 'number' &&
    message.diagnostics &&
    typeof message.diagnostics === 'object'
  );
};

export const validateHCSMessage = (message: any): message is HCSMessage => {
  if (message.messageType === 'WATER_FLOW') {
    return validateWaterFlowMessage(message);
  } else if (message.messageType === 'DEVICE_STATUS') {
    return validateDeviceStatusMessage(message);
  }
  return false;
};

// Message serialization utilities
export const serializeMessage = (message: HCSMessage): string => {
  return JSON.stringify(message);
};

export const deserializeMessage = (data: string): HCSMessage | null => {
  try {
    const parsed = JSON.parse(data);
    if (validateHCSMessage(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};