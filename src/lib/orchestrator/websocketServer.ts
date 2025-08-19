// WebSocket Server for Real-time Waternity Updates

import { WaterSession, DeviceStatus } from './sessionManager';
import { ProcessedMessage } from './mirrorNodeClient';

export interface WebSocketMessage {
  type: 'session_update' | 'device_status' | 'hcs_message' | 'statistics' | 'error' | 'ping' | 'pong';
  timestamp: number;
  data?: any;
  error?: string;
}

export interface ClientSubscription {
  sessionUpdates: boolean;
  deviceStatus: boolean;
  hcsMessages: boolean;
  statistics: boolean;
  wellIds?: string[]; // Filter by specific wells
  deviceIds?: string[]; // Filter by specific devices
  userIds?: string[]; // Filter by specific users
}

export interface ConnectedClient {
  id: string;
  ws: WebSocket;
  subscription: ClientSubscription;
  lastPing: number;
  isAlive: boolean;
}

export interface WebSocketServerConfig {
  port: number;
  pingInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
  maxConnections: number;
  enableCors: boolean;
  allowedOrigins?: string[];
}

// Note: This is a client-side WebSocket implementation
// In a real application, you would use a Node.js WebSocket server
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageCallbacks: Map<string, ((data: any) => void)[]> = new Map();
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private subscription: ClientSubscription;

  constructor(
    url: string,
    subscription: ClientSubscription = {
      sessionUpdates: true,
      deviceStatus: true,
      hcsMessages: true,
      statistics: true
    }
  ) {
    this.url = url;
    this.subscription = subscription;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startPing();
          this.sendSubscription();
          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.stopPing();
          this.notifyConnectionChange(false);
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopPing();
  }

  /**
   * Send subscription preferences to server
   */
  private sendSubscription(): void {
    this.sendMessage({
      type: 'subscription',
      timestamp: Date.now(),
      data: this.subscription
    });
  }

  /**
   * Update subscription preferences
   */
  updateSubscription(subscription: Partial<ClientSubscription>): void {
    this.subscription = { ...this.subscription, ...subscription };
    if (this.isConnected()) {
      this.sendSubscription();
    }
  }

  /**
   * Send message to server
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Handle ping/pong
      if (message.type === 'ping') {
        this.sendMessage({ type: 'pong', timestamp: Date.now() });
        return;
      }
      
      // Emit to callbacks
      const callbacks = this.messageCallbacks.get(message.type);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message.data);
          } catch (error) {
            console.error('Error in message callback:', error);
          }
        });
      }
      
      // Emit to 'all' callbacks
      const allCallbacks = this.messageCallbacks.get('all');
      if (allCallbacks) {
        allCallbacks.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error('Error in all message callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Subscribe to specific message types
   */
  on(messageType: string, callback: (data: any) => void): void {
    if (!this.messageCallbacks.has(messageType)) {
      this.messageCallbacks.set(messageType, []);
    }
    this.messageCallbacks.get(messageType)!.push(callback);
  }

  /**
   * Unsubscribe from message types
   */
  off(messageType: string, callback: (data: any) => void): void {
    const callbacks = this.messageCallbacks.get(messageType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onConnection(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Start ping timer
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop ping timer
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    subscription: ClientSubscription;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      subscription: this.subscription
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.messageCallbacks.clear();
    this.connectionCallbacks = [];
  }
}

// Mock WebSocket Server for development/testing
export class MockWebSocketServer {
  private clients: Map<string, any> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isRunning: boolean = false;
  private broadcastInterval: NodeJS.Timeout | null = null;

  /**
   * Start mock server
   */
  start(): void {
    this.isRunning = true;
    console.log('Mock WebSocket server started');
    
    // Simulate periodic broadcasts
    this.broadcastInterval = setInterval(() => {
      this.broadcastMockData();
    }, 5000);
  }

  /**
   * Stop mock server
   */
  stop(): void {
    this.isRunning = false;
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    console.log('Mock WebSocket server stopped');
  }

  /**
   * Simulate client connection
   */
  addClient(clientId: string, subscription: ClientSubscription): void {
    this.clients.set(clientId, {
      id: clientId,
      subscription,
      connected: true,
      lastSeen: Date.now()
    });
    console.log(`Mock client ${clientId} connected`);
  }

  /**
   * Simulate client disconnection
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`Mock client ${clientId} disconnected`);
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message: WebSocketMessage): void {
    if (!this.isRunning) return;
    
    this.messageQueue.push(message);
    
    // Keep only last 100 messages
    if (this.messageQueue.length > 100) {
      this.messageQueue = this.messageQueue.slice(-100);
    }
    
    console.log(`Broadcasting ${message.type} to ${this.clients.size} clients`);
  }

  /**
   * Broadcast session update
   */
  broadcastSessionUpdate(session: WaterSession): void {
    this.broadcast({
      type: 'session_update',
      timestamp: Date.now(),
      data: session
    });
  }

  /**
   * Broadcast device status
   */
  broadcastDeviceStatus(deviceId: string, status: DeviceStatus): void {
    this.broadcast({
      type: 'device_status',
      timestamp: Date.now(),
      data: { deviceId, status }
    });
  }

  /**
   * Broadcast HCS message
   */
  broadcastHCSMessage(message: ProcessedMessage): void {
    this.broadcast({
      type: 'hcs_message',
      timestamp: Date.now(),
      data: message
    });
  }

  /**
   * Broadcast statistics
   */
  broadcastStatistics(stats: any): void {
    this.broadcast({
      type: 'statistics',
      timestamp: Date.now(),
      data: stats
    });
  }

  /**
   * Simulate mock data broadcasts
   */
  private broadcastMockData(): void {
    // Mock session update
    this.broadcastSessionUpdate({
      sessionId: `session_${Date.now()}`,
      userId: 'user_demo_001',
      deviceId: 'device_001',
      wellId: 'well_001',
      startTime: Date.now() - 60000,
      maxVolume: 5,
      pricePerLiter: 0.1,
      totalVolume: Math.random() * 3,
      totalCost: 0,
      status: 'active',
      lastActivity: Date.now(),
      flowEvents: []
    });

    // Mock device status
    this.broadcastDeviceStatus('device_001', {
      deviceId: 'device_001',
      wellId: 'well_001',
      lastSeen: Date.now(),
      status: 'ONLINE',
      batteryLevel: 85 + Math.random() * 15,
      signalStrength: -60 - Math.random() * 20,
      lastMaintenance: Date.now() - 86400000,
      diagnostics: {
        pumpStatus: 'OK',
        sensorStatus: 'OK',
        networkStatus: 'OK',
        memoryUsage: 40 + Math.random() * 30,
        uptime: 86400
      }
    });

    // Mock statistics
    this.broadcastStatistics({
      totalSessions: 150,
      activeSessions: 3,
      completedSessions: 145,
      cancelledSessions: 2,
      errorSessions: 0,
      totalVolume: 1250.5,
      totalRevenue: 125.05,
      onlineDevices: 8,
      totalDevices: 10
    });
  }

  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    clientCount: number;
    messageQueueSize: number;
  } {
    return {
      isRunning: this.isRunning,
      clientCount: this.clients.size,
      messageQueueSize: this.messageQueue.length
    };
  }

  /**
   * Get message history
   */
  getMessageHistory(limit: number = 50): WebSocketMessage[] {
    return this.messageQueue.slice(-limit);
  }
}

// Export singleton instances for development
export const mockWebSocketServer = new MockWebSocketServer();

// Helper function to create WebSocket client
export const createWebSocketClient = (
  url: string = 'ws://localhost:8080/ws',
  subscription?: ClientSubscription
): WebSocketClient => {
  return new WebSocketClient(url, subscription);
};