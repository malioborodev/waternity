// Main Orchestrator for Waternity System

import { MirrorNodeClient, MirrorNodeConfig, ProcessedMessage, defaultMirrorNodeConfig } from './mirrorNodeClient';
import { SessionManager, SessionManagerConfig, WaterSession, DeviceStatus, defaultSessionManagerConfig } from './sessionManager';
import { MockWebSocketServer, mockWebSocketServer } from './websocketServer';
import { HCSClient } from '../hcs/hcsClient';

export interface OrchestratorConfig {
  mirrorNode: MirrorNodeConfig;
  sessionManager: SessionManagerConfig;
  hcsClient?: {
    operatorId: string;
    operatorKey: string;
    network: 'testnet' | 'mainnet';
  };
  enableWebSocket: boolean;
  enableMockData: boolean;
}

export interface OrchestratorStats {
  mirrorNode: {
    isPolling: boolean;
    lastSequenceNumber: number;
    retryCount: number;
    messagesProcessed: number;
  };
  sessionManager: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    errorSessions: number;
    totalVolume: number;
    totalRevenue: number;
    onlineDevices: number;
    totalDevices: number;
  };
  webSocket: {
    isRunning: boolean;
    clientCount: number;
    messageQueueSize: number;
  };
  uptime: number;
}

export class Orchestrator {
  private config: OrchestratorConfig;
  private mirrorNodeClient: MirrorNodeClient;
  private sessionManager: SessionManager;
  private hcsClient: HCSClient | null = null;
  private webSocketServer: MockWebSocketServer;
  private startTime: number;
  private messagesProcessed: number = 0;
  private isRunning: boolean = false;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      mirrorNode: defaultMirrorNodeConfig,
      sessionManager: defaultSessionManagerConfig,
      enableWebSocket: true,
      enableMockData: false,
      ...config
    };

    this.startTime = Date.now();
    this.mirrorNodeClient = new MirrorNodeClient(this.config.mirrorNode);
    this.sessionManager = new SessionManager(this.config.sessionManager);
    this.webSocketServer = mockWebSocketServer;

    this.setupEventHandlers();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Orchestrator is already running');
      return;
    }

    console.log('Starting Waternity Orchestrator...');
    this.isRunning = true;

    try {
      // Initialize HCS client if configured
      if (this.config.hcsClient) {
        this.hcsClient = HCSClient.fromConfig({
          operatorId: this.config.hcsClient.operatorId,
          operatorKey: this.config.hcsClient.operatorKey,
          network: this.config.hcsClient.network
        });
        console.log('HCS client initialized');
      }

      // Start WebSocket server if enabled
      if (this.config.enableWebSocket) {
        this.webSocketServer.start();
        console.log('WebSocket server started');
      }

      // Start Mirror Node polling
      this.mirrorNodeClient.startPolling();
      console.log('Mirror Node polling started');

      // Start statistics reporting
      this.startStatsReporting();

      // Start mock data if enabled
      if (this.config.enableMockData) {
        this.startMockDataGeneration();
      }

      console.log('Orchestrator started successfully');
    } catch (error) {
      console.error('Error starting orchestrator:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('Orchestrator is not running');
      return;
    }

    console.log('Stopping Waternity Orchestrator...');
    this.isRunning = false;

    // Stop statistics reporting
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Stop Mirror Node polling
    this.mirrorNodeClient.stopPolling();

    // Stop WebSocket server
    this.webSocketServer.stop();

    // Close HCS client
    if (this.hcsClient) {
      // Note: HCS client doesn't have a close method in our implementation
      this.hcsClient = null;
    }

    console.log('Orchestrator stopped');
  }

  /**
   * Create a new water session
   */
  async createSession(sessionData: {
    sessionId: string;
    userId: string;
    deviceId: string;
    wellId: string;
    maxVolume: number;
    pricePerLiter: number;
  }): Promise<WaterSession> {
    const session = this.sessionManager.createSession(sessionData);
    
    // Broadcast session creation
    if (this.config.enableWebSocket) {
      this.webSocketServer.broadcastSessionUpdate(session);
    }
    
    return session;
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string, reason?: string): Promise<boolean> {
    const success = this.sessionManager.completeSession(sessionId, reason);
    
    if (success) {
      const session = this.sessionManager.getSession(sessionId);
      if (session && this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    }
    
    return success;
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, reason?: string): Promise<boolean> {
    const success = this.sessionManager.cancelSession(sessionId, reason);
    
    if (success) {
      const session = this.sessionManager.getSession(sessionId);
      if (session && this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    }
    
    return success;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): WaterSession | undefined {
    return this.sessionManager.getSession(sessionId);
  }

  /**
   * Get sessions for user
   */
  getSessionsForUser(userId: string): WaterSession[] {
    return this.sessionManager.getSessionsForUser(userId);
  }

  /**
   * Get sessions for well
   */
  getSessionsForWell(wellId: string): WaterSession[] {
    return this.sessionManager.getSessionsForWell(wellId);
  }

  /**
   * Get device status
   */
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    return this.sessionManager.getDeviceStatus(deviceId);
  }

  /**
   * Get all device statuses
   */
  getAllDeviceStatuses(): DeviceStatus[] {
    return this.sessionManager.getAllDeviceStatuses();
  }

  /**
   * Get orchestrator statistics
   */
  getStatistics(): OrchestratorStats {
    const sessionStats = this.sessionManager.getStatistics();
    const mirrorNodeStatus = this.mirrorNodeClient.getStatus();
    const webSocketStatus = this.webSocketServer.getStatus();

    return {
      mirrorNode: {
        isPolling: mirrorNodeStatus.isPolling,
        lastSequenceNumber: mirrorNodeStatus.lastSequenceNumber,
        retryCount: mirrorNodeStatus.retryCount,
        messagesProcessed: this.messagesProcessed
      },
      sessionManager: sessionStats,
      webSocket: webSocketStatus,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Subscribe to session events
   */
  onSessionEvent(
    event: 'created' | 'updated' | 'completed' | 'cancelled' | 'error',
    callback: (session: WaterSession) => void
  ): void {
    this.sessionManager.onSessionEvent(event, callback);
  }

  /**
   * Subscribe to device status updates
   */
  onDeviceStatus(callback: (deviceId: string, status: DeviceStatus) => void): void {
    this.sessionManager.onDeviceStatus(callback);
  }

  /**
   * Subscribe to HCS messages
   */
  onHCSMessage(callback: (message: ProcessedMessage) => void): void {
    this.mirrorNodeClient.onMessage(callback);
  }

  /**
   * Get WebSocket server for client connections
   */
  getWebSocketServer(): MockWebSocketServer {
    return this.webSocketServer;
  }

  /**
   * Check if orchestrator is running
   */
  isOrchestratorRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Setup event handlers between components
   */
  private setupEventHandlers(): void {
    // Handle Mirror Node messages
    this.mirrorNodeClient.onMessage((message: ProcessedMessage) => {
      this.messagesProcessed++;
      
      // Process message in session manager
      this.sessionManager.processMessage(message);
      
      // Broadcast to WebSocket clients
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastHCSMessage(message);
      }
    });

    // Handle Mirror Node errors
    this.mirrorNodeClient.onError((error: Error) => {
      console.error('Mirror Node error:', error);
      
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcast({
          type: 'error',
          timestamp: Date.now(),
          error: error.message
        });
      }
    });

    // Handle session events
    this.sessionManager.onSessionEvent('created', (session) => {
      console.log(`Session created: ${session.sessionId}`);
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    });

    this.sessionManager.onSessionEvent('updated', (session) => {
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    });

    this.sessionManager.onSessionEvent('completed', (session) => {
      console.log(`Session completed: ${session.sessionId}, Volume: ${session.totalVolume}L, Cost: $${session.totalCost}`);
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    });

    this.sessionManager.onSessionEvent('cancelled', (session) => {
      console.log(`Session cancelled: ${session.sessionId}, Reason: ${session.errorMessage}`);
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    });

    this.sessionManager.onSessionEvent('error', (session) => {
      console.error(`Session error: ${session.sessionId}, Error: ${session.errorMessage}`);
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastSessionUpdate(session);
      }
    });

    // Handle device status updates
    this.sessionManager.onDeviceStatus((deviceId, status) => {
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastDeviceStatus(deviceId, status);
      }
    });
  }

  /**
   * Start periodic statistics reporting
   */
  private startStatsReporting(): void {
    this.statsInterval = setInterval(() => {
      const stats = this.getStatistics();
      
      if (this.config.enableWebSocket) {
        this.webSocketServer.broadcastStatistics(stats);
      }
      
      // Log summary every 5 minutes
      if (stats.uptime % (5 * 60 * 1000) < 10000) {
        console.log('Orchestrator Stats:', {
          uptime: Math.floor(stats.uptime / 1000) + 's',
          messagesProcessed: stats.mirrorNode.messagesProcessed,
          activeSessions: stats.sessionManager.activeSessions,
          onlineDevices: stats.sessionManager.onlineDevices,
          totalVolume: stats.sessionManager.totalVolume.toFixed(2) + 'L',
          totalRevenue: '$' + stats.sessionManager.totalRevenue.toFixed(2)
        });
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Start mock data generation for development
   */
  private startMockDataGeneration(): void {
    console.log('Starting mock data generation...');
    
    // Generate mock sessions periodically
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every interval
        this.createMockSession();
      }
    }, 30000); // Every 30 seconds
    
    // Generate mock device status updates
    setInterval(() => {
      this.generateMockDeviceStatus();
    }, 15000); // Every 15 seconds
  }

  /**
   * Create a mock session for testing
   */
  private async createMockSession(): Promise<void> {
    try {
      const sessionId = `mock_session_${Date.now()}`;
      const userId = `user_${Math.floor(Math.random() * 100)}`;
      const deviceId = `device_${Math.floor(Math.random() * 10) + 1}`;
      const wellId = `well_${Math.floor(Math.random() * 5) + 1}`;
      
      await this.createSession({
        sessionId,
        userId,
        deviceId,
        wellId,
        maxVolume: 1 + Math.random() * 9, // 1-10L
        pricePerLiter: 0.05 + Math.random() * 0.15 // $0.05-$0.20
      });
      
      // Auto-complete session after random time
      setTimeout(() => {
        this.completeSession(sessionId, 'Mock session auto-completed');
      }, 10000 + Math.random() * 20000); // 10-30 seconds
    } catch (error) {
      console.error('Error creating mock session:', error);
    }
  }

  /**
   * Generate mock device status
   */
  private generateMockDeviceStatus(): void {
    // This would normally come from HCS messages
    // For now, we'll simulate it directly in the session manager
    console.log('Mock device status generation not implemented yet');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.mirrorNodeClient.destroy();
    this.sessionManager.destroy();
  }
}

// Export default configuration
export const defaultOrchestratorConfig: OrchestratorConfig = {
  mirrorNode: defaultMirrorNodeConfig,
  sessionManager: defaultSessionManagerConfig,
  enableWebSocket: true,
  enableMockData: false
};

// Export singleton instance for development
export const orchestrator = new Orchestrator(defaultOrchestratorConfig);