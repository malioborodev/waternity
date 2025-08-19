'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Battery,
  Droplets,
  Gauge,
  Thermometer,
  Settings,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Activity
} from 'lucide-react';
import { DeviceManager, DeviceInfo, SessionConfig } from '../../lib/iot';

interface IoTSimulatorProps {
  deviceManager: DeviceManager;
  className?: string;
}

interface SessionForm {
  userId: string;
  maxVolume: number;
  pricePerLiter: number;
}

export const IoTSimulator: React.FC<IoTSimulatorProps> = ({
  deviceManager,
  className = ''
}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    userId: 'user_demo_001',
    maxVolume: 5,
    pricePerLiter: 0.1
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);

  // Update devices list
  const updateDevices = useCallback(() => {
    const devicesSummary = deviceManager.getDevicesSummary();
    setDevices(devicesSummary);
  }, [deviceManager]);

  // Update statistics
  const updateStatistics = useCallback(() => {
    const stats = deviceManager.getStatistics();
    setStatistics(stats);
  }, [deviceManager]);

  // Update messages
  const updateMessages = useCallback(() => {
    const recentMessages = deviceManager.getMessageHistory({ limit: 10 });
    setMessages(recentMessages);
  }, [deviceManager]);

  useEffect(() => {
    // Initial load
    updateDevices();
    updateStatistics();
    updateMessages();

    // Set up event listeners
    const handleDeviceEvent = () => {
      updateDevices();
      updateStatistics();
    };

    const handleMessage = () => {
      updateMessages();
      updateStatistics();
    };

    deviceManager.on('deviceCreated', handleDeviceEvent);
    deviceManager.on('deviceRemoved', handleDeviceEvent);
    deviceManager.on('statusChanged', handleDeviceEvent);
    deviceManager.on('maintenanceMode', handleDeviceEvent);
    deviceManager.on('sessionStarted', handleDeviceEvent);
    deviceManager.on('sessionStopped', handleDeviceEvent);
    deviceManager.on('message', handleMessage);

    // Periodic updates
    const interval = setInterval(() => {
      updateDevices();
      updateStatistics();
    }, 5000);

    return () => {
      clearInterval(interval);
      deviceManager.off('deviceCreated', handleDeviceEvent);
      deviceManager.off('deviceRemoved', handleDeviceEvent);
      deviceManager.off('statusChanged', handleDeviceEvent);
      deviceManager.off('maintenanceMode', handleDeviceEvent);
      deviceManager.off('sessionStarted', handleDeviceEvent);
      deviceManager.off('sessionStopped', handleDeviceEvent);
      deviceManager.off('message', handleMessage);
    };
  }, [deviceManager, updateDevices, updateStatistics, updateMessages]);

  const createDemoDevices = async () => {
    setIsCreatingDevice(true);
    try {
      await deviceManager.createDemoScenario();
      updateDevices();
    } catch (error) {
      console.error('Error creating demo devices:', error);
    } finally {
      setIsCreatingDevice(false);
    }
  };

  const startSession = async (deviceId: string) => {
    try {
      const sessionConfig: SessionConfig = {
        sessionId: `session_${Date.now()}`,
        userId: sessionForm.userId,
        maxVolume: sessionForm.maxVolume,
        pricePerLiter: sessionForm.pricePerLiter,
        startTime: Date.now()
      };

      await deviceManager.startSession(deviceId, sessionConfig);
      updateDevices();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const stopSession = async (deviceId: string) => {
    try {
      await deviceManager.stopSession(deviceId);
      updateDevices();
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const toggleDeviceStatus = (deviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online';
    deviceManager.setDeviceStatus(deviceId, !newStatus);
    updateDevices();
  };

  const toggleMaintenanceMode = (deviceId: string, currentStatus: string) => {
    const inMaintenance = currentStatus === 'maintenance';
    deviceManager.setMaintenanceMode(deviceId, !inMaintenance);
    updateDevices();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSignalStrength = (strength: number) => {
    if (strength > -60) return 'Excellent';
    if (strength > -70) return 'Good';
    if (strength > -80) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IoT Device Simulator</h2>
          <p className="text-gray-600">Manage and monitor water well IoT devices</p>
        </div>
        <button
          onClick={createDemoDevices}
          disabled={isCreatingDevice}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isCreatingDevice ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Create Demo Devices
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Total Devices</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalDevices}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Online</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.onlineDevices}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Active Sessions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.activeSessions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">Total Volume (L)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalVolumePumped.toFixed(1)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600">Messages 24h</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.messagesLast24h}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Avg Battery</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.averageBatteryLevel.toFixed(0)}%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device List */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Devices</h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No devices found</p>
                <p className="text-sm">Create demo devices to get started</p>
              </div>
            ) : (
              devices.map((device) => (
                <motion.div
                  key={device.deviceId}
                  layout
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDevice === device.deviceId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDevice(device.deviceId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(device.status)}
                      <span className="font-medium text-sm">{device.deviceId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
                      <span className="text-xs text-gray-600">{device.batteryLevel.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span>{device.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Well: {device.wellId}</span>
                    <span>Signal: {getSignalStrength(device.signalStrength)}</span>
                  </div>
                  {device.activeSession && (
                    <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Active Session: {device.activeSession}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Device Control Panel */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Device Control</h3>
          </div>
          <div className="p-4">
            {selectedDevice ? (
              <div className="space-y-4">
                {(() => {
                  const device = devices.find(d => d.deviceId === selectedDevice);
                  if (!device) return <p className="text-gray-500">Device not found</p>;

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{device.deviceId}</h4>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(device.status)}
                          <span className="text-sm capitalize">{device.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Battery:</span>
                          <span className={`ml-2 font-medium ${getBatteryColor(device.batteryLevel)}`}>
                            {device.batteryLevel.toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Signal:</span>
                          <span className="ml-2 font-medium">
                            {getSignalStrength(device.signalStrength)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Total Volume:</span>
                          <span className="ml-2 font-medium">
                            {device.totalVolumePumped.toFixed(1)}L
                          </span>
                        </div>
                      </div>

                      {/* Session Controls */}
                      {device.status === 'online' && (
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm">Session Control</h5>
                          
                          {!device.activeSession ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">User ID</label>
                                  <input
                                    type="text"
                                    value={sessionForm.userId}
                                    onChange={(e) => setSessionForm(prev => ({ ...prev, userId: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Max Volume (L)</label>
                                  <input
                                    type="number"
                                    value={sessionForm.maxVolume}
                                    onChange={(e) => setSessionForm(prev => ({ ...prev, maxVolume: Number(e.target.value) }))}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    min="0.1"
                                    step="0.1"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Price per Liter (USDC)</label>
                                <input
                                  type="number"
                                  value={sessionForm.pricePerLiter}
                                  onChange={(e) => setSessionForm(prev => ({ ...prev, pricePerLiter: Number(e.target.value) }))}
                                  className="w-full px-2 py-1 text-sm border rounded"
                                  min="0.01"
                                  step="0.01"
                                />
                              </div>
                              <button
                                onClick={() => startSession(device.deviceId)}
                                className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Start Session
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm text-green-800">Session Active</p>
                                <p className="text-xs text-green-600">ID: {device.activeSession}</p>
                              </div>
                              <button
                                onClick={() => stopSession(device.deviceId)}
                                className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center justify-center gap-2"
                              >
                                <Square className="w-4 h-4" />
                                Stop Session
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Device Controls */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Device Controls</h5>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleDeviceStatus(device.deviceId, device.status)}
                            className={`flex-1 px-3 py-2 text-sm rounded ${
                              device.status === 'online'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {device.status === 'online' ? 'Go Offline' : 'Go Online'}
                          </button>
                          <button
                            onClick={() => toggleMaintenanceMode(device.deviceId, device.status)}
                            className={`flex-1 px-3 py-2 text-sm rounded ${
                              device.status === 'maintenance'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            {device.status === 'maintenance' ? 'Exit Maintenance' : 'Maintenance'}
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a device to control</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
        </div>
        <div className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-gray-50 rounded border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{message.messageType}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Device: {message.deviceId} | Well: {message.wellId}
                  </div>
                  {message.messageType === 'WATER_FLOW' && (
                    <div className="text-xs text-gray-600 mt-1">
                      Flow: {message.flowRate?.toFixed(1)} L/min | 
                      Volume: {message.totalVolume?.toFixed(2)} L | 
                      Valve: {message.valveStatus}
                    </div>
                  )}
                  {message.messageType === 'DEVICE_STATUS' && (
                    <div className="text-xs text-gray-600 mt-1">
                      Status: {message.status} | 
                      Battery: {message.batteryLevel?.toFixed(0)}% | 
                      Signal: {message.signalStrength} dBm
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};