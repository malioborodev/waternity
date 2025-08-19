// IoT Module Exports for Waternity

export {
  IoTDeviceSimulator,
  generateDeviceKeyPair,
  type DeviceConfig,
  type SessionConfig,
  type DeviceState
} from './deviceSimulator';

export {
  DeviceManager,
  deviceManager,
  type DeviceManagerConfig,
  type DeviceInfo
} from './deviceManager';

// Re-export commonly used types
export type {
  HCSMessage,
  WaterFlowMessage,
  DeviceStatusMessage
} from '../hcs/messageFormats';