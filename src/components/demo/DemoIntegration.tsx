'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  Coins,
  Users,
  QrCode,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Wifi,
  Battery,
  Thermometer,
  Gauge
} from 'lucide-react';

// Simulated contract interactions
interface ContractState {
  wellRegistry: {
    totalWells: number;
    activeWells: number;
  };
  depositManager: {
    totalDeposits: string;
    activeUsers: number;
  };
  revenueSplitter: {
    totalRevenue: string;
    operatorShare: string;
    investorShare: string;
  };
  fractionalVault: {
    totalShares: number;
    availableShares: number;
    sharePrice: string;
  };
}

// Simulated HCS messages
interface LiveHCSMessage {
  id: string;
  timestamp: number;
  messageType: 'WATER_FLOW' | 'DEVICE_STATUS';
  deviceId: string;
  wellId: string;
  data: any;
}

// Simulated IoT device status
interface IoTDeviceStatus {
  deviceId: string;
  wellId: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  batteryLevel: number;
  signalStrength: number;
  temperature: number;
  pressure: number;
  lastSeen: number;
}

export default function DemoIntegration() {
  const [contractState, setContractState] = useState<ContractState>({
    wellRegistry: { totalWells: 1, activeWells: 1 },
    depositManager: { totalDeposits: '50.00 USDC', activeUsers: 1 },
    revenueSplitter: { totalRevenue: '0.00 USDC', operatorShare: '0.00 USDC', investorShare: '0.00 USDC' },
    fractionalVault: { totalShares: 1000, availableShares: 750, sharePrice: '10.00 USDC' }
  });

  const [hcsMessages, setHcsMessages] = useState<LiveHCSMessage[]>([]);
  const [iotDevices, setIotDevices] = useState<IoTDeviceStatus[]>([
    {
      deviceId: 'IOT-WELL-001',
      wellId: 'WELL-001',
      status: 'ONLINE',
      batteryLevel: 85,
      signalStrength: -65,
      temperature: 24.5,
      pressure: 45.2,
      lastSeen: Date.now()
    }
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSession, setCurrentSession] = useState<{
    sessionId: string;
    userId: string;
    startTime: number;
    litersDispensed: number;
    totalCost: number;
  } | null>(null);

  // Simulate water dispensing session
  const startWaterSession = () => {
    if (currentSession) return;

    const sessionId = `SES-${Date.now()}`;
    const userId = '0.0.345678';
    
    setCurrentSession({
      sessionId,
      userId,
      startTime: Date.now(),
      litersDispensed: 0,
      totalCost: 0
    });

    setIsSimulating(true);
  };

  const stopWaterSession = () => {
    if (!currentSession) return;

    // Final revenue distribution
    const totalRevenue = currentSession.totalCost;
    const operatorShare = totalRevenue * 0.75;
    const investorShare = totalRevenue * 0.25;

    setContractState(prev => ({
      ...prev,
      revenueSplitter: {
        totalRevenue: (parseFloat(prev.revenueSplitter.totalRevenue) + totalRevenue).toFixed(2) + ' USDC',
        operatorShare: (parseFloat(prev.revenueSplitter.operatorShare) + operatorShare).toFixed(2) + ' USDC',
        investorShare: (parseFloat(prev.revenueSplitter.investorShare) + investorShare).toFixed(2) + ' USDC'
      }
    }));

    setCurrentSession(null);
    setIsSimulating(false);
  };

  // Simulate real-time water flow
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSimulating && currentSession) {
      interval = setInterval(() => {
        const flowRate = 2.5 + Math.random() * 2; // 2.5-4.5 L/min
        const litersThisInterval = flowRate / 60 * 2; // 2 second intervals
        const costPerLiter = 0.1;
        const costThisInterval = litersThisInterval * costPerLiter;

        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            litersDispensed: prev.litersDispensed + litersThisInterval,
            totalCost: prev.totalCost + costThisInterval
          };
        });

        // Generate HCS message
        const hcsMessage: LiveHCSMessage = {
          id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          messageType: 'WATER_FLOW',
          deviceId: 'IOT-WELL-001',
          wellId: 'WELL-001',
          data: {
            sessionId: currentSession.sessionId,
            userId: currentSession.userId,
            pulseCount: Math.floor(currentSession.litersDispensed * 10),
            flowRate: flowRate,
            totalVolume: currentSession.litersDispensed + litersThisInterval,
            valveStatus: 'OPEN',
            pressure: 45.2 + Math.random() * 5,
            temperature: 24.5 + Math.random() * 2
          }
        };

        setHcsMessages(prev => [hcsMessage, ...prev.slice(0, 9)]);

        // Update IoT device status
        setIotDevices(prev => prev.map(device => 
          device.deviceId === 'IOT-WELL-001'
            ? {
                ...device,
                temperature: 24.5 + Math.random() * 2,
                pressure: 45.2 + Math.random() * 5,
                lastSeen: Date.now()
              }
            : device
        ));
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isSimulating, currentSession]);

  // Simulate device status messages
  useEffect(() => {
    const interval = setInterval(() => {
      const statusMessage: LiveHCSMessage = {
        id: `STATUS-${Date.now()}`,
        timestamp: Date.now(),
        messageType: 'DEVICE_STATUS',
        deviceId: 'IOT-WELL-001',
        wellId: 'WELL-001',
        data: {
          status: 'ONLINE',
          batteryLevel: 85 - Math.random() * 2,
          signalStrength: -65 + Math.random() * 10,
          lastMaintenance: Date.now() - 7 * 24 * 60 * 60 * 1000,
          diagnostics: {
            pumpStatus: 'OK',
            sensorStatus: 'OK',
            networkStatus: 'OK',
            memoryUsage: 45 + Math.random() * 10,
            uptime: 86400
          }
        }
      };

      setHcsMessages(prev => [statusMessage, ...prev.slice(0, 9)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Live Demo Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Live Demo Controls</h2>
        <div className="flex gap-4">
          <button
            onClick={startWaterSession}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <QrCode className="w-5 h-5" />
            {isSimulating ? 'Session Active' : 'Start Water Session'}
          </button>
          <button
            onClick={stopWaterSession}
            disabled={!isSimulating}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Stop Session
          </button>
        </div>
      </div>

      {/* Current Session */}
      {currentSession && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Active Water Session</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-100">Session ID</p>
              <p className="font-semibold">{currentSession.sessionId}</p>
            </div>
            <div>
              <p className="text-blue-100">Liters Dispensed</p>
              <p className="font-semibold">{currentSession.litersDispensed.toFixed(2)}L</p>
            </div>
            <div>
              <p className="text-blue-100">Total Cost</p>
              <p className="font-semibold">{currentSession.totalCost.toFixed(2)} USDC</p>
            </div>
            <div>
              <p className="text-blue-100">Duration</p>
              <p className="font-semibold">
                {Math.floor((Date.now() - currentSession.startTime) / 1000)}s
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Contract State */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Contract State</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Well Registry
              </h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Total Wells: {contractState.wellRegistry.totalWells}</p>
                <p className="text-sm text-gray-600">Active Wells: {contractState.wellRegistry.activeWells}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-green-500" />
                Deposit Manager
              </h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Total Deposits: {contractState.depositManager.totalDeposits}</p>
                <p className="text-sm text-gray-600">Active Users: {contractState.depositManager.activeUsers}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Revenue Splitter
              </h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Total Revenue: {contractState.revenueSplitter.totalRevenue}</p>
                <p className="text-sm text-gray-600">Operator Share: {contractState.revenueSplitter.operatorShare}</p>
                <p className="text-sm text-gray-600">Investor Share: {contractState.revenueSplitter.investorShare}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Fractional Vault
              </h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Total Shares: {contractState.fractionalVault.totalShares}</p>
                <p className="text-sm text-gray-600">Available: {contractState.fractionalVault.availableShares}</p>
                <p className="text-sm text-gray-600">Price: {contractState.fractionalVault.sharePrice}</p>
              </div>
            </div>
          </div>
        </div>

        {/* IoT Device Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">IoT Device Status</h3>
          {iotDevices.map(device => (
            <div key={device.deviceId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{device.deviceId}</h4>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  device.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                  device.status === 'OFFLINE' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  <Wifi className="w-3 h-3" />
                  {device.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">{device.batteryLevel.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">{device.signalStrength.toFixed(0)} dBm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">{device.temperature.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">{device.pressure.toFixed(1)} PSI</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live HCS Messages */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Live HCS Messages</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hcsMessages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages yet. Start a water session to see live data.</p>
          ) : (
            hcsMessages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border-l-4 ${
                  message.messageType === 'WATER_FLOW'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    message.messageType === 'WATER_FLOW'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {message.messageType}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Device:</strong> {message.deviceId}</p>
                  <p><strong>Well:</strong> {message.wellId}</p>
                  {message.messageType === 'WATER_FLOW' && (
                    <p><strong>Flow Rate:</strong> {message.data.flowRate?.toFixed(2)} L/min</p>
                  )}
                  {message.messageType === 'DEVICE_STATUS' && (
                    <p><strong>Battery:</strong> {message.data.batteryLevel?.toFixed(0)}%</p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}