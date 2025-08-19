// HCS (Hedera Consensus Service) Integration for Waternity

export * from './messageFormats';
export * from './hcsClient';
export * from './verificationPipeline';

// Re-export commonly used types and functions
export type {
  HCSMessage,
  WaterFlowMessage,
  DeviceStatusMessage,
  BaseHCSMessage
} from './messageFormats';

export type {
  HCSConfig,
  DeviceRegistry,
  VerificationResult
} from './hcsClient';

export {
  HCSClient,
  createHCSClientFromEnv
} from './hcsClient';

export {
  MessageVerificationPipeline,
  verificationPipeline
} from './verificationPipeline';

export {
  validateHCSMessage,
  serializeMessage,
  deserializeMessage
} from './messageFormats';