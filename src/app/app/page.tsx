'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Droplets, 
  Settings, 
  BarChart3,
  Wallet,
  QrCode,
  Monitor,
  Users
} from 'lucide-react';

// Tab Components
import InvestorTab from '@/components/tabs/InvestorTab';
import UserTab from '@/components/tabs/UserTab';
import OperatorTab from '@/components/tabs/OperatorTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';

type TabType = 'investor' | 'user' | 'operator' | 'analytics';

const tabs = [
  {
    id: 'investor' as TabType,
    label: 'Investor',
    icon: TrendingUp,
    description: 'Marketplace & Portfolio'
  },
  {
    id: 'user' as TabType,
    label: 'User',
    icon: QrCode,
    description: 'Top-up & Water Access'
  },
  {
    id: 'operator' as TabType,
    label: 'Operator',
    icon: Monitor,
    description: 'Device Management'
  },
  {
    id: 'analytics' as TabType,
    label: 'Analytics',
    icon: BarChart3,
    description: 'Global Metrics'
  }
];

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('investor');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'investor':
        return <InvestorTab />;
      case 'user':
        return <UserTab />;
      case 'operator':
        return <OperatorTab />;
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return <InvestorTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Droplets className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Waternity</h1>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Live</span>
              </div>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <a
              href="/demo"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="container mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </main>
    </div>
  );
}