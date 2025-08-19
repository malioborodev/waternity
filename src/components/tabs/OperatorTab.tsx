'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Activity, 
  DollarSign, 
  Users, 
  Droplets, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Wrench,
  Bell,
  MapPin,
  Calendar,
  BarChart3
} from 'lucide-react';

// Mock data
const wells = [
  {
    id: 1,
    name: 'Well Bandung #001',
    location: 'Jl. Sudirman No. 123',
    status: 'active',
    dailyVolume: 1247,
    revenue: 24.94,
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-02-10',
    waterLevel: 85,
    flowRate: 2.5,
    temperature: 24.5,
    ph: 7.2
  },
  {
    id: 2,
    name: 'Well Bandung #005',
    location: 'Jl. Asia Afrika No. 456',
    status: 'maintenance',
    dailyVolume: 0,
    revenue: 0,
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-01-16',
    waterLevel: 45,
    flowRate: 0,
    temperature: 25.1,
    ph: 7.0
  }
];

const alerts = [
  {
    id: 1,
    type: 'warning',
    message: 'Well #005 water level below 50%',
    timestamp: '2024-01-15 10:30',
    wellId: 2
  },
  {
    id: 2,
    type: 'info',
    message: 'Scheduled maintenance for Well #001 in 7 days',
    timestamp: '2024-01-15 08:00',
    wellId: 1
  },
  {
    id: 3,
    type: 'success',
    message: 'Well #001 daily target achieved (1000L)',
    timestamp: '2024-01-14 18:00',
    wellId: 1
  }
];

const revenueData = [
  { date: '2024-01-08', amount: 18.50 },
  { date: '2024-01-09', amount: 22.30 },
  { date: '2024-01-10', amount: 19.80 },
  { date: '2024-01-11', amount: 25.60 },
  { date: '2024-01-12', amount: 21.40 },
  { date: '2024-01-13', amount: 28.90 },
  { date: '2024-01-14', amount: 24.20 },
  { date: '2024-01-15', amount: 24.94 }
];

export default function OperatorTab() {
  const [activeView, setActiveView] = useState<'overview' | 'wells' | 'revenue' | 'maintenance'>('overview');

  const totalRevenue = revenueData.reduce((sum, day) => sum + day.amount, 0);
  const activeWells = wells.filter(well => well.status === 'active').length;
  const totalVolume = wells.reduce((sum, well) => sum + well.dailyVolume, 0);

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex space-x-4 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'wells', label: 'Wells Management', icon: Droplets },
          { key: 'revenue', label: 'Revenue', icon: DollarSign },
          { key: 'maintenance', label: 'Maintenance', icon: Wrench }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${
              activeView === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Wells</p>
                  <p className="text-2xl font-bold text-gray-900">{activeWells}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Daily Volume</p>
                  <p className="text-2xl font-bold text-gray-900">{totalVolume}L</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Droplets className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${revenueData[revenueData.length - 1]?.amount.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">127</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Recent Alerts
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    alert.type === 'warning' ? 'bg-yellow-100' :
                    alert.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : alert.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Bell className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeView === 'wells' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Wells Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wells.map((well) => (
              <div key={well.id} className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{well.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {well.location}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      well.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {well.status === 'active' ? 'Active' : 'Maintenance'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Daily Volume</p>
                      <p className="text-xl font-bold text-gray-900">{well.dailyVolume}L</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-xl font-bold text-gray-900">${well.revenue}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Water Level</span>
                      <span className="text-sm font-medium">{well.waterLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          well.waterLevel > 70 ? 'bg-green-500' :
                          well.waterLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${well.waterLevel}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600">Flow Rate</p>
                      <p className="font-medium">{well.flowRate} L/min</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Temperature</p>
                      <p className="font-medium">{well.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">pH Level</p>
                      <p className="font-medium">{well.ph}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Activity className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeView === 'revenue' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Weekly Revenue</h3>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-green-600 mt-1">+12.5% from last week</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Avg. Daily</h3>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">${(totalRevenue / 8).toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">Per day average</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Revenue Share</h3>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">${(totalRevenue * 0.7).toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">70% operator share</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Revenue Trend</h3>
            <div className="h-64 flex items-end space-x-2">
              {revenueData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                    style={{ height: `${(day.amount / Math.max(...revenueData.map(d => d.amount))) * 200}px` }}
                  ></div>
                  <p className="text-xs text-gray-600 mt-2">{day.date.slice(-2)}</p>
                  <p className="text-xs font-medium">${day.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeView === 'maintenance' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Maintenance Schedule */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Maintenance Schedule
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {wells.map((well) => (
                  <div key={well.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        well.status === 'maintenance' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <Wrench className={`h-6 w-6 ${
                          well.status === 'maintenance' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{well.name}</h4>
                        <p className="text-sm text-gray-600">Last: {well.lastMaintenance}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">Next: {well.nextMaintenance}</p>
                      <p className={`text-sm ${
                        well.status === 'maintenance' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {well.status === 'maintenance' ? 'In Progress' : 'Scheduled'}
                      </p>
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