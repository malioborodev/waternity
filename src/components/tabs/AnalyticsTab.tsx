'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Droplets, 
  DollarSign,
  MapPin,
  Calendar,
  Globe,
  Activity,
  Target,
  Award,
  Zap
} from 'lucide-react';

// Mock data
const globalStats = {
  totalWells: 247,
  activeUsers: 12847,
  totalVolume: 1247892, // liters
  totalRevenue: 24957.84,
  carbonOffset: 15.7, // tons CO2
  communitiesServed: 89
};

const regionData = [
  { region: 'Indonesia', wells: 156, users: 8934, volume: 789234 },
  { region: 'Philippines', wells: 43, users: 2156, volume: 234567 },
  { region: 'Vietnam', wells: 28, users: 1234, volume: 156789 },
  { region: 'Thailand', wells: 20, users: 523, volume: 67302 }
];

const impactMetrics = [
  {
    title: 'Clean Water Access',
    value: '12,847',
    unit: 'people served',
    change: '+23%',
    icon: Users,
    color: 'blue'
  },
  {
    title: 'Water Distributed',
    value: '1.25M',
    unit: 'liters',
    change: '+18%',
    icon: Droplets,
    color: 'cyan'
  },
  {
    title: 'Carbon Offset',
    value: '15.7',
    unit: 'tons CO2',
    change: '+31%',
    icon: Globe,
    color: 'green'
  },
  {
    title: 'Economic Impact',
    value: '$24.9K',
    unit: 'revenue generated',
    change: '+15%',
    icon: DollarSign,
    color: 'yellow'
  }
];

const usagePatterns = [
  { hour: '00', usage: 12 },
  { hour: '04', usage: 8 },
  { hour: '08', usage: 45 },
  { hour: '12', usage: 78 },
  { hour: '16', usage: 92 },
  { hour: '20', usage: 67 }
];

const wellPerformance = [
  { name: 'Well Bandung #001', efficiency: 94, uptime: 99.2, revenue: 1247 },
  { name: 'Well Jakarta #003', efficiency: 87, uptime: 97.8, revenue: 1089 },
  { name: 'Well Surabaya #002', efficiency: 91, uptime: 98.5, revenue: 1156 },
  { name: 'Well Medan #001', efficiency: 83, uptime: 95.1, revenue: 892 },
  { name: 'Well Yogya #004', efficiency: 96, uptime: 99.7, revenue: 1334 }
];

export default function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
            { key: '1y', label: '1 Year' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Global Impact Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {impactMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            cyan: 'bg-cyan-100 text-cyan-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600'
          };
          
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.unit}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Regional Distribution
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {regionData.map((region, index) => (
                <div key={region.region} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{region.region}</p>
                      <p className="text-sm text-gray-600">{region.wells} wells • {region.users.toLocaleString()} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{(region.volume / 1000).toFixed(0)}K L</p>
                    <p className="text-sm text-gray-600">volume</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Patterns */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Daily Usage Patterns
            </h3>
          </div>
          <div className="p-6">
            <div className="h-48 flex items-end space-x-3">
              {usagePatterns.map((pattern, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all hover:from-blue-700 hover:to-cyan-500"
                    style={{ height: `${(pattern.usage / Math.max(...usagePatterns.map(p => p.usage))) * 160}px` }}
                  ></div>
                  <p className="text-xs text-gray-600 mt-2">{pattern.hour}:00</p>
                  <p className="text-xs font-medium">{pattern.usage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Well Performance Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Top Performing Wells
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {wellPerformance.map((well, index) => (
              <div key={well.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100' :
                    index === 1 ? 'bg-gray-100' :
                    index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    {index < 3 ? (
                      <Award className={`h-5 w-5 ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        'text-orange-600'
                      }`} />
                    ) : (
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{well.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Efficiency: {well.efficiency}%</span>
                      <span>Uptime: {well.uptime}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${well.revenue}</p>
                  <p className="text-sm text-gray-600">monthly revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">System Efficiency</h3>
            <Zap className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall</span>
              <span className="text-sm font-medium">91.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '91.2%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">User Satisfaction</h3>
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rating</span>
              <span className="text-sm font-medium">4.8/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Growth Rate</h3>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly</span>
              <span className="text-sm font-medium">+23.5%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}