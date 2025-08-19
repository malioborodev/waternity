'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Orchestrator, OrchestratorStats, WaterSession, DeviceStatus } from '../../lib/orchestrator';
import { WebSocketClient } from '../../lib/orchestrator/websocketServer';

interface OrchestratorDemoProps {
  className?: string;
}

export const OrchestratorDemo: React.FC<OrchestratorDemoProps> = ({ className = '' }) => {
  const [orchestrator] = useState(() => new Orchestrator({
    enableWebSocket: true,
    enableMockData: true
  }));
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [sessions, setSessions] = useState<WaterSession[]>([]);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Setup WebSocket client
    const client = new WebSocketClient('ws://localhost:8080');
    setWsClient(client);

    client.onConnectionChange((status) => {
      setConnectionStatus(status);
    });

    client.onMessage((message) => {
      setMessages(prev => [...prev.slice(-49), { // Keep last 50 messages
        ...message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    client.subscribe('session_update', (session: WaterSession) => {
      setSessions(prev => {
        const index = prev.findIndex(s => s.sessionId === session.sessionId);
        if (index >= 0) {
          const newSessions = [...prev];
          newSessions[index] = session;
          return newSessions;
        } else {
          return [...prev, session].slice(-20); // Keep last 20 sessions
        }
      });
    });

    client.subscribe('device_status', (data: { deviceId: string; status: DeviceStatus }) => {
      setDevices(prev => {
        const index = prev.findIndex(d => d.deviceId === data.deviceId);
        if (index >= 0) {
          const newDevices = [...prev];
          newDevices[index] = data.status;
          return newDevices;
        } else {
          return [...prev, data.status];
        }
      });
    });

    client.subscribe('statistics', (newStats: OrchestratorStats) => {
      setStats(newStats);
    });

    return () => {
      client.disconnect();
      orchestrator.destroy();
    };
  }, [orchestrator]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = async () => {
    try {
      await orchestrator.start();
      setIsRunning(true);
      wsClient?.connect();
    } catch (error) {
      console.error('Failed to start orchestrator:', error);
    }
  };

  const handleStop = async () => {
    try {
      await orchestrator.stop();
      setIsRunning(false);
      wsClient?.disconnect();
    } catch (error) {
      console.error('Failed to stop orchestrator:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!isRunning) return;

    try {
      const sessionId = `demo_session_${Date.now()}`;
      const userId = `user_${Math.floor(Math.random() * 100)}`;
      const deviceId = `device_${Math.floor(Math.random() * 5) + 1}`;
      const wellId = `well_${Math.floor(Math.random() * 3) + 1}`;
      
      await orchestrator.createSession({
        sessionId,
        userId,
        deviceId,
        wellId,
        maxVolume: 1 + Math.random() * 4, // 1-5L
        pricePerLiter: 0.05 + Math.random() * 0.10 // $0.05-$0.15
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await orchestrator.completeSession(sessionId, 'Manual completion');
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await orchestrator.cancelSession(sessionId, 'Manual cancellation');
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      case 'cancelled': return 'text-red-600';
      case 'error': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Orchestrator Demo</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                WebSocket: {connectionStatus}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${isRunning ? 'text-green-600' : 'text-gray-600'}`}>
                Orchestrator: {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Orchestrator
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Stop Orchestrator
          </button>
          <button
            onClick={handleCreateSession}
            disabled={!isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Test Session
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.sessionManager.activeSessions}</div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sessionManager.completedSessions}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.sessionManager.onlineDevices}</div>
              <div className="text-sm text-gray-600">Online Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.sessionManager.totalVolume.toFixed(1)}L</div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold text-gray-700">
              Uptime: {Math.floor(stats.uptime / 1000)}s | 
              Messages: {stats.mirrorNode.messagesProcessed} | 
              Revenue: ${stats.sessionManager.totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sessions yet</p>
            ) : (
              sessions.slice(-10).reverse().map((session) => (
                <div key={session.sessionId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{session.sessionId}</span>
                    <span className={`text-sm font-medium ${getStatusColor(session.status)}`}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Device: {session.deviceId} | Well: {session.wellId}</div>
                    <div>Volume: {session.totalVolume.toFixed(2)}L / {session.maxVolume.toFixed(2)}L</div>
                    <div>Cost: ${session.totalCost.toFixed(3)} (${session.pricePerLiter.toFixed(3)}/L)</div>
                  </div>
                  {session.status === 'active' && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleCompleteSession(session.sessionId)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleCancelSession(session.sessionId)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {devices.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No devices online</p>
            ) : (
              devices.map((device) => (
                <div key={device.deviceId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{device.deviceId}</span>
                    <span className={`text-sm font-medium ${
                      device.isOnline ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {device.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Well: {device.wellId}</div>
                    <div>Battery: {device.batteryLevel}% | Signal: {device.signalStrength}%</div>
                    <div>Flow Rate: {device.flowRate.toFixed(2)}L/min</div>
                    <div>Last Update: {new Date(device.lastUpdate).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Real-time Messages */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Messages</h3>
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages yet</p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="mb-2">
                <span className="text-gray-500">[{message.timestamp}]</span>
                <span className="ml-2 text-blue-600">{message.type}:</span>
                <span className="ml-2">{JSON.stringify(message.data || message, null, 0)}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default OrchestratorDemo;