'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Droplets, 
  MapPin, 
  Clock, 
  CreditCard,
  History,
  Wallet,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Mock data
const nearbyWells = [
  {
    id: 1,
    name: 'Well Bandung #001',
    distance: '0.2 km',
    pricePerLiter: 0.02,
    status: 'active',
    coordinates: { lat: -6.9175, lng: 107.6191 }
  },
  {
    id: 2,
    name: 'Well Bandung #005',
    distance: '0.8 km',
    pricePerLiter: 0.025,
    status: 'active',
    coordinates: { lat: -6.9147, lng: 107.6098 }
  },
  {
    id: 3,
    name: 'Well Bandung #012',
    distance: '1.2 km',
    pricePerLiter: 0.02,
    status: 'maintenance',
    coordinates: { lat: -6.9208, lng: 107.6044 }
  }
];

const transactions = [
  {
    id: 1,
    wellName: 'Well Bandung #001',
    amount: 5.0,
    cost: 0.10,
    timestamp: '2024-01-15 14:30',
    status: 'completed'
  },
  {
    id: 2,
    wellName: 'Well Bandung #001',
    amount: 3.5,
    cost: 0.07,
    timestamp: '2024-01-14 09:15',
    status: 'completed'
  },
  {
    id: 3,
    wellName: 'Well Bandung #005',
    amount: 10.0,
    cost: 0.25,
    timestamp: '2024-01-12 16:45',
    status: 'completed'
  }
];

export default function UserTab() {
  const [activeView, setActiveView] = useState<'access' | 'history'>('access');
  const [balance, setBalance] = useState(5.75);
  const [isScanning, setIsScanning] = useState(false);

  const handleQRScan = () => {
    setIsScanning(true);
    // Simulate QR scan process
    setTimeout(() => {
      setIsScanning(false);
      // Simulate successful scan
      alert('QR Code scanned successfully! Dispensing 2L of water...');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveView('access')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'access'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Water Access
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Transaction History
        </button>
      </div>

      {activeView === 'access' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Wallet Balance */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
                <p className="text-blue-100 text-sm mt-1">≈ {(balance / 0.02).toFixed(0)} liters available</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
            <button className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Top Up Balance
            </button>
          </div>

          {/* QR Scanner */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Water</h3>
            <div className="text-center">
              <div className="mx-auto w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                {isScanning ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-blue-600/10 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
                    />
                  </motion.div>
                ) : (
                  <QrCode className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 mb-4">
                {isScanning ? 'Scanning QR code...' : 'Scan QR code on the water dispenser to access clean water'}
              </p>
              <button
                onClick={handleQRScan}
                disabled={isScanning}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
              >
                <QrCode className="h-5 w-5 mr-2" />
                {isScanning ? 'Scanning...' : 'Start QR Scan'}
              </button>
            </div>
          </div>

          {/* Nearby Wells */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Nearby Water Wells</h3>
            </div>
            <div className="p-6 space-y-4">
              {nearbyWells.map((well) => (
                <div key={well.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      well.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <Droplets className={`h-6 w-6 ${
                        well.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{well.name}</h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{well.distance}</span>
                        <span className="mx-2">•</span>
                        <span>${well.pricePerLiter}/L</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {well.status === 'active' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      well.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {well.status === 'active' ? 'Active' : 'Maintenance'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeView === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Usage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Total Water Accessed</h3>
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">18.5L</p>
              <p className="text-sm text-gray-600 mt-1">This month</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Total Spent</h3>
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$0.42</p>
              <p className="text-sm text-gray-600 mt-1">This month</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Avg. Daily Usage</h3>
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">1.2L</p>
              <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Droplets className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{transaction.wellName}</h4>
                        <p className="text-sm text-gray-600">{transaction.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{transaction.amount}L</p>
                      <p className="text-sm text-gray-600">${transaction.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}