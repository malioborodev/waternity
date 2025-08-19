'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Droplets,
  Coins,
  Users,
  QrCode,
  Zap,
  TrendingUp,
  CheckCircle,
  Clock,
  Wallet,
  Activity,
  Settings
} from 'lucide-react';
import { DemoIntegration } from '../../components/demo/DemoIntegration';
import { IoTSimulator } from '../../components/iot/IoTSimulator';
import { DeviceManager } from '../../lib/iot';
import { OrchestratorDemo } from '../../components/orchestrator/OrchestratorDemo';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  data?: any;
}

const demoSteps: DemoStep[] = [
  {
    id: 'well-registration',
    title: 'Well Registration',
    description: 'Operator registers a new water well as NFT on Hedera',
    icon: <Droplets className="w-6 h-6" />,
    duration: 3000,
    data: {
      wellId: 'WELL-001',
      location: 'Jakarta, Indonesia',
      capacity: '10,000L/day',
      operator: '0.0.123456'
    }
  },
  {
    id: 'fractional-shares',
    title: 'Issue Fractional Shares',
    description: 'Create 1000 shares for investors to purchase',
    icon: <Users className="w-6 h-6" />,
    duration: 2500,
    data: {
      totalShares: 1000,
      pricePerShare: '10 USDC',
      availableShares: 750,
      soldShares: 250
    }
  },
  {
    id: 'investor-purchase',
    title: 'Investor Purchase',
    description: 'Investors buy fractional shares of the well',
    icon: <Wallet className="w-6 h-6" />,
    duration: 2000,
    data: {
      investor: '0.0.789012',
      sharesPurchased: 50,
      totalInvestment: '500 USDC',
      ownershipPercentage: '5%'
    }
  },
  {
    id: 'user-deposit',
    title: 'User Deposit',
    description: 'User tops up their account with HTS stablecoin',
    icon: <Coins className="w-6 h-6" />,
    duration: 2000,
    data: {
      userId: '0.0.345678',
      depositAmount: '50 USDC',
      accountBalance: '50 USDC'
    }
  },
  {
    id: 'qr-scan',
    title: 'QR Code Scan',
    description: 'User scans QR code at water well to start session',
    icon: <QrCode className="w-6 h-6" />,
    duration: 1500,
    data: {
      sessionId: 'SES-001',
      wellId: 'WELL-001',
      userId: '0.0.345678',
      pricePerLiter: '0.1 USDC'
    }
  },
  {
    id: 'water-flow',
    title: 'Water Dispensing',
    description: 'IoT device dispenses water and sends real-time events to HCS',
    icon: <Zap className="w-6 h-6" />,
    duration: 4000,
    data: {
      litersDispensed: 25,
      flowRate: '5 L/min',
      totalCost: '2.5 USDC',
      remainingBalance: '47.5 USDC'
    }
  },
  {
    id: 'revenue-split',
    title: 'Revenue Distribution',
    description: 'Revenue automatically split between operator and investors',
    icon: <TrendingUp className="w-6 h-6" />,
    duration: 2500,
    data: {
      totalRevenue: '2.5 USDC',
      operatorShare: '1.875 USDC (75%)',
      investorPool: '0.625 USDC (25%)',
      investorReturn: '0.03125 USDC (5% ownership)'
    }
  },
  {
    id: 'investor-claim',
    title: 'Investor Claim',
    description: 'Investors claim their revenue share',
    icon: <CheckCircle className="w-6 h-6" />,
    duration: 2000,
    data: {
      claimableAmount: '0.03125 USDC',
      totalEarned: '1.25 USDC',
      roi: '0.25%'
    }
  }
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'guided' | 'live' | 'iot' | 'orchestrator'>('guided');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [deviceManager] = useState(() => new DeviceManager());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentStep < demoSteps.length) {
      const stepDuration = demoSteps[currentStep].duration;
      const progressIncrement = 100 / (stepDuration / 100);
      
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            setCurrentStep(prev => prev + 1);
            return 0;
          }
          return prev + progressIncrement;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  useEffect(() => {
    if (currentStep >= demoSteps.length) {
      setIsPlaying(false);
    }
  }, [currentStep]);

  const handlePlay = () => {
    if (currentStep >= demoSteps.length) {
      // Reset demo
      setCurrentStep(0);
      setProgress(0);
      setCompletedSteps(new Set());
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setCompletedSteps(new Set());
  };

  const handleStepClick = (stepIndex: number) => {
    setIsPlaying(false);
    setCurrentStep(stepIndex);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Waternity MVP Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Experience the complete water access and investment flow
          </p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('guided')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === 'guided'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Guided Demo
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === 'live'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Live Integration
              </button>
              <button
                onClick={() => setActiveTab('iot')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === 'iot'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                IoT Simulator
              </button>
              <button
                onClick={() => setActiveTab('orchestrator')}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === 'orchestrator'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Orchestrator
              </button>
            </div>
          </div>
          
          {/* Controls - only show for guided demo */}
          {activeTab === 'guided' && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : currentStep >= demoSteps.length ? 'Restart' : 'Play'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
          )}
        </div>

        {/* Conditional Content */}
        {activeTab === 'guided' ? (
        <>
        {/* Demo Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Steps Timeline */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Demo Flow</h2>
            {demoSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isUpcoming = index > currentStep;
              
              return (
                <motion.div
                  key={step.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : isUpcoming
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 bg-white'
                  }`}
                  onClick={() => handleStepClick(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      {isActive && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Current Step Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step Details</h2>
            
            <AnimatePresence mode="wait">
              {currentStep < demoSteps.length && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500 text-white rounded-full">
                      {demoSteps[currentStep].icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {demoSteps[currentStep].title}
                      </h3>
                      <p className="text-gray-600">
                        {demoSteps[currentStep].description}
                      </p>
                    </div>
                  </div>

                  {demoSteps[currentStep].data && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Data:</h4>
                      <div className="space-y-2">
                        {Object.entries(demoSteps[currentStep].data!).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="font-medium text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {currentStep >= demoSteps.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Demo Complete!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You've experienced the complete Waternity ecosystem flow.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Run Demo Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Wells Registered</h3>
            <p className="text-2xl font-bold text-blue-600">1</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Active Investors</h3>
            <p className="text-2xl font-bold text-green-600">1</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Water Dispensed</h3>
            <p className="text-2xl font-bold text-purple-600">25L</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Revenue Generated</h3>
            <p className="text-2xl font-bold text-orange-600">2.5 USDC</p>
          </div>
        </div>
        </>
        ) : activeTab === 'live' ? (
        <>
        {/* Live Integration Demo */}
        <DemoIntegration />
        </>
        ) : activeTab === 'iot' ? (
        <>
        {/* IoT Simulator */}
        <IoTSimulator deviceManager={deviceManager} />
        </>
        ) : (
        <>
        {/* Orchestrator Demo */}
        <OrchestratorDemo />
        </>
        )}
      </div>
    </div>
  );
}