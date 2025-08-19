// Mirror Node Client for Waternity Orchestrator

import { HCSMessage, WaterFlowMessage, DeviceStatusMessage } from '../hcs/messageFormats';
import { verifyHCSMessage } from '../hcs/verificationPipeline';

export interface MirrorNodeConfig {
  baseUrl: string;
  topicId: string;
  pollInterval: number; // milliseconds
  maxRetries: number;
  timeout: number; // milliseconds
}

export interface TopicMessage {
  consensus_timestamp: string;
  message: string; // base64 encoded
  payer_account_id: string;
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  topic_id: string;
  valid_start_timestamp: string;
}

export interface MirrorNodeResponse {
  messages: TopicMessage[];
  links: {
    next: string | null;
  };
}

export interface ProcessedMessage {
  sequenceNumber: number;
  timestamp: string;
  consensusTimestamp: string;
  message: HCSMessage;
  isValid: boolean;
  validationErrors?: string[];
  payerAccountId: string;
}

export class MirrorNodeClient {
  private config: MirrorNodeConfig;
  private lastSequenceNumber: number = 0;
  private isPolling: boolean = false;
  private pollTimeout: NodeJS.Timeout | null = null;
  private messageCallbacks: ((message: ProcessedMessage) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private retryCount: number = 0;

  constructor(config: MirrorNodeConfig) {
    this.config = config;
  }

  /**
   * Start polling for new messages
   */
  startPolling(fromSequenceNumber?: number): void {
    if (this.isPolling) {
      console.warn('Mirror Node client is already polling');
      return;
    }

    this.isPolling = true;
    this.lastSequenceNumber = fromSequenceNumber || 0;
    this.retryCount = 0;
    
    console.log(`Starting Mirror Node polling from sequence ${this.lastSequenceNumber}`);
    this.poll();
  }

  /**
   * Stop polling for messages
   */
  stopPolling(): void {
    this.isPolling = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log('Stopped Mirror Node polling');
  }

  /**
   * Add callback for processed messages
   */
  onMessage(callback: (message: ProcessedMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  /**
   * Add callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove message callback
   */
  offMessage(callback: (message: ProcessedMessage) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove error callback
   */
  offError(callback: (error: Error) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Get messages from a specific sequence number
   */
  async getMessages(fromSequenceNumber?: number, limit: number = 100): Promise<ProcessedMessage[]> {
    try {
      const url = this.buildUrl(fromSequenceNumber, limit);
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
      }

      const data: MirrorNodeResponse = await response.json();
      return this.processMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages from Mirror Node:', error);
      throw error;
    }
  }

  /**
   * Get the latest sequence number from the topic
   */
  async getLatestSequenceNumber(): Promise<number> {
    try {
      const url = `${this.config.baseUrl}/api/v1/topics/${this.config.topicId}/messages?limit=1&order=desc`;
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
      }

      const data: MirrorNodeResponse = await response.json();
      
      if (data.messages.length > 0) {
        return data.messages[0].sequence_number;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting latest sequence number:', error);
      throw error;
    }
  }

  /**
   * Internal polling method
   */
  private async poll(): Promise<void> {
    if (!this.isPolling) return;

    try {
      const messages = await this.getMessages(this.lastSequenceNumber + 1);
      
      if (messages.length > 0) {
        // Update last sequence number
        this.lastSequenceNumber = Math.max(
          ...messages.map(msg => msg.sequenceNumber)
        );

        // Process messages
        messages.forEach(message => {
          this.messageCallbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('Error in message callback:', error);
            }
          });
        });
      }

      // Reset retry count on successful poll
      this.retryCount = 0;
      
      // Schedule next poll
      this.scheduleNextPoll();
    } catch (error) {
      this.handlePollError(error as Error);
    }
  }

  /**
   * Handle polling errors with exponential backoff
   */
  private handlePollError(error: Error): void {
    console.error('Mirror Node polling error:', error);
    
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    this.retryCount++;
    
    if (this.retryCount >= this.config.maxRetries) {
      console.error('Max retries reached, stopping polling');
      this.stopPolling();
      return;
    }

    // Exponential backoff: 2^retryCount * pollInterval
    const backoffDelay = Math.pow(2, this.retryCount) * this.config.pollInterval;
    const maxDelay = 60000; // Max 1 minute
    const delay = Math.min(backoffDelay, maxDelay);
    
    console.log(`Retrying in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);
    
    this.pollTimeout = setTimeout(() => {
      this.poll();
    }, delay);
  }

  /**
   * Schedule next poll
   */
  private scheduleNextPoll(): void {
    if (!this.isPolling) return;
    
    this.pollTimeout = setTimeout(() => {
      this.poll();
    }, this.config.pollInterval);
  }

  /**
   * Build URL for Mirror Node API
   */
  private buildUrl(fromSequenceNumber?: number, limit: number = 100): string {
    let url = `${this.config.baseUrl}/api/v1/topics/${this.config.topicId}/messages?limit=${limit}&order=asc`;
    
    if (fromSequenceNumber) {
      url += `&sequencenumber=gte:${fromSequenceNumber}`;
    }
    
    return url;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Waternity-Orchestrator/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Process raw Mirror Node messages
   */
  private processMessages(rawMessages: TopicMessage[]): ProcessedMessage[] {
    return rawMessages.map(rawMessage => {
      try {
        // Decode base64 message
        const messageBytes = Buffer.from(rawMessage.message, 'base64');
        const messageString = messageBytes.toString('utf-8');
        const hcsMessage: HCSMessage = JSON.parse(messageString);

        // Verify message
        const verification = verifyHCSMessage(hcsMessage);

        return {
          sequenceNumber: rawMessage.sequence_number,
          timestamp: rawMessage.valid_start_timestamp,
          consensusTimestamp: rawMessage.consensus_timestamp,
          message: hcsMessage,
          isValid: verification.isValid,
          validationErrors: verification.isValid ? undefined : verification.errors,
          payerAccountId: rawMessage.payer_account_id
        };
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Return invalid message with error
        return {
          sequenceNumber: rawMessage.sequence_number,
          timestamp: rawMessage.valid_start_timestamp,
          consensusTimestamp: rawMessage.consensus_timestamp,
          message: {} as HCSMessage, // Empty message
          isValid: false,
          validationErrors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          payerAccountId: rawMessage.payer_account_id
        };
      }
    });
  }

  /**
   * Get current polling status
   */
  getStatus(): {
    isPolling: boolean;
    lastSequenceNumber: number;
    retryCount: number;
    messageCallbacks: number;
    errorCallbacks: number;
  } {
    return {
      isPolling: this.isPolling,
      lastSequenceNumber: this.lastSequenceNumber,
      retryCount: this.retryCount,
      messageCallbacks: this.messageCallbacks.length,
      errorCallbacks: this.errorCallbacks.length
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPolling();
    this.messageCallbacks = [];
    this.errorCallbacks = [];
  }
}

// Default configuration for Hedera Testnet
export const defaultMirrorNodeConfig: MirrorNodeConfig = {
  baseUrl: 'https://testnet.mirrornode.hedera.com',
  topicId: '0.0.123456', // Replace with actual topic ID
  pollInterval: 5000, // 5 seconds
  maxRetries: 5,
  timeout: 10000 // 10 seconds
};