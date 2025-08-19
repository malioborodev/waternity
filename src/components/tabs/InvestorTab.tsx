'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  DollarSign,
  Award,
  ExternalLink,
  Plus
} from 'lucide-react';

// Mock data
const wells = [
  {
    id: 1,
    name: 'Well Bandung #001',
    location: 'Bandung, Indonesia',
    operator: 'Water4All NGO',
    totalShares: 100000,
    availableShares: 25000,
    pricePerLiter: 0.02,
    dailyVolume: 1247,
    monthlyRevenue: 748.2,
    apr: 12.5,
    image: '/api/placeholder/300/200'
  },
  {
    id: 2,
    name: 'Well Jakarta #003',
    location: 'Jakarta, Indonesia',
    operator: 'AquaTech Solutions',
    totalShares: 100000,
    availableShares: 45000,
    pricePerLiter: 0.025,
    dailyVolume: 892,
    monthlyRevenue: 668.5,
    apr: 15.2,
    image: '/api/placeholder/300/200'
  }
];

const portfolio = [
  {
    wellId: 1,
    wellName: 'Well Bandung #001',
    shares: 5000,
    percentage: 5,
    invested: 250,
    currentValue: 287.5,
    unclaimedYield: 12.75,
    totalEarned: 37.5
  }
];

export default function InvestorTab() {
  const [activeView, setActiveView] = useState<'marketplace' | 'portfolio'>('marketplace');

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveView('marketplace')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'marketplace'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveView('portfolio')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'portfolio'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          My Portfolio
        </button>
      </div>

      {activeView === 'marketplace' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Wells</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Investors</p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg APR</p>
                  <p className="text-2xl font-bold text-gray-900">13.8%</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total TVL</p>
                  <p className="text-2xl font-bold text-gray-900">$2.4M</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Wells Marketplace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wells.map((well) => (
              <div key={well.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-500 relative">
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-gray-900">{well.apr}% APR</span>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{well.name}</h3>
                    <p className="text-blue-100 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {well.location}
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Operator</p>
                      <p className="font-medium">{well.operator}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Price per Liter</p>
                      <p className="font-medium">${well.pricePerLiter}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Daily Volume</p>
                      <p className="font-semibold">{well.dailyVolume}L</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="font-semibold">${well.monthlyRevenue}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Available Shares</span>
                      <span>{well.availableShares.toLocaleString()} / {well.totalShares.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${((well.totalShares - well.availableShares) / well.totalShares) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Invest
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeView === 'portfolio' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Total Invested</h3>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$250.00</p>
              <p className="text-sm text-green-600 mt-1">+15% from last month</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Current Value</h3>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$287.50</p>
              <p className="text-sm text-blue-600 mt-1">+$37.50 total gain</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Unclaimed Yield</h3>
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$12.75</p>
              <button className="mt-2 bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                Claim Now
              </button>
            </div>
          </div>

          {/* Portfolio Holdings */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">My Holdings</h3>
            </div>
            <div className="p-6">
              {portfolio.map((holding) => (
                <div key={holding.wellId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{holding.wellName}</h4>
                      <p className="text-sm text-gray-600">{holding.shares.toLocaleString()} shares ({holding.percentage}%)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${holding.currentValue}</p>
                    <p className="text-sm text-green-600">+${holding.totalEarned} earned</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}