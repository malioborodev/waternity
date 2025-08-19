// HCS Client for Waternity - Hedera Consensus Service Integration

import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TopicId,
  AccountId,
  PrivateKey,
  Hbar
} from '@hashgraph/sdk';
import { HCSMessage, serializeMessage, deserializeMessage } from './messageFormats';

export interface HCSConfig {
  network: 'testnet' | 'mainnet';
  operatorId: string;
  operatorKey: string;
  topicId?: string;
}

export class HCSClient {
  private client: Client;
  private topicId: TopicId | null = null;
  private config: HCSConfig;

  constructor(config: HCSConfig) {
    this.config = config;
    
    // Initialize Hedera client
    if (config.network === 'testnet') {
      this.client = Client.forTestnet();
    } else {
      this.client = Client.forMainnet();
    }

    // Set operator
    this.client.setOperator(
      AccountId.fromString(config.operatorId),
      PrivateKey.fromString(config.operatorKey)
    );

    // Set topic ID if provided
    if (config.topicId) {
      this.topicId = TopicId.fromString(config.topicId);
    }
  }

  /**
   * Create a new HCS topic for Waternity messages
   */
  async createTopic(memo: string = 'Waternity IoT Events'): Promise<string> {
    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.topicId) {
        this.topicId = receipt.topicId;
        return receipt.topicId.toString();
      }
      
      throw new Error('Failed to create topic');
    } catch (error) {
      console.error('Error creating HCS topic:', error);
      throw error;
    }
  }

  /**
   * Submit a message to the HCS topic
   */
  async submitMessage(message: HCSMessage): Promise<string> {
    if (!this.topicId) {
      throw new Error('Topic ID not set. Create or set a topic first.');
    }

    try {
      const serializedMessage = serializeMessage(message);
      
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(serializedMessage)
        .setMaxTransactionFee(new Hbar(1));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error submitting message to HCS:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages from the HCS topic
   */
  subscribeToMessages(
    onMessage: (message: HCSMessage, consensusTimestamp: Date) => void,
    onError?: (error: Error) => void,
    startTime?: Date
  ): void {
    if (!this.topicId) {
      throw new Error('Topic ID not set. Create or set a topic first.');
    }

    const query = new TopicMessageQuery()
      .setTopicId(this.topicId)
      .setErrorHandler((error) => {
        console.error('HCS subscription error:', error);
        if (onError) onError(error);
      });

    if (startTime) {
      query.setStartTime(startTime);
    }

    query.subscribe(this.client, (message) => {
      try {
        const messageString = Buffer.from(message.contents).toString();
        const parsedMessage = deserializeMessage(messageString);
        
        if (parsedMessage) {
          onMessage(parsedMessage, message.consensusTimestamp.toDate());
        } else {
          console.warn('Invalid message format received:', messageString);
        }
      } catch (error) {
        console.error('Error processing HCS message:', error);
        if (onError) onError(error as Error);
      }
    });
  }

  /**
   * Set the topic ID for an existing topic
   */
  setTopicId(topicId: string): void {
    this.topicId = TopicId.fromString(topicId);
  }

  /**
   * Get the current topic ID
   */
  getTopicId(): string | null {
    return this.topicId?.toString() || null;
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

// Utility function to create HCS client from environment variables
export const createHCSClientFromEnv = (): HCSClient => {
  const config: HCSConfig = {
    network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    operatorId: process.env.HEDERA_ACCOUNT_ID || '',
    operatorKey: process.env.HEDERA_PRIVATE_KEY || '',
    topicId: process.env.HCS_TOPIC_ID
  };

  if (!config.operatorId || !config.operatorKey) {
    throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in environment variables');
  }

  return new HCSClient(config);
};