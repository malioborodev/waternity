'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Droplets, TrendingUp, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Droplets className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Waternity</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/demo" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Demo
            </Link>
            <Link 
              href="/app" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Tokenized Safe Water Access
            <span className="text-blue-600"> on Hedera</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Every liter of water = one on-chain event. Real yield for investors, 
            fraud-free access for communities, and transparent impact — powered 100% by Hedera.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/app" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Investing
            </Link>
            <Link 
              href="/demo" 
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Live Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How Waternity Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Invest</h3>
            <p className="text-gray-600">
              Buy fractional NFT shares of water wells. Each well is tokenized as an HTS NFT 
              that generates real yield from water sales.
            </p>
          </motion.div>

          <motion.div 
            className="text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Deploy</h3>
            <p className="text-gray-600">
              IoT devices with tamper-proof sensors measure every liter dispensed. 
              All data is signed and recorded on Hedera HCS for immutable transparency.
            </p>
          </motion.div>

          <motion.div 
            className="text-center p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Earn</h3>
            <p className="text-gray-600">
              Revenue from water sales is automatically split between operators, investors, 
              and platform. Claim your yield anytime through smart contracts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Built on Hedera
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">HTS</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Token Service</h3>
              <p className="text-gray-600 text-sm">
                Native tokenization for well NFTs and stablecoin payments
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">HCS</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Consensus Service</h3>
              <p className="text-gray-600 text-sm">
                Immutable logging of IoT water flow events
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">SC</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Contracts</h3>
              <p className="text-gray-600 text-sm">
                Automated revenue splitting and governance
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">IoT</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">IoT Devices</h3>
              <p className="text-gray-600 text-sm">
                Real-time monitoring and flow measurement
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Interactive Demo Available
          </h2>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-8 max-w-4xl mx-auto text-white">
            <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
              <div>
                <div className="text-3xl font-bold mb-2">1,247</div>
                <div className="text-blue-100">Liters Dispensed Today</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">$24.94</div>
                <div className="text-blue-100">Revenue Generated</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">156</div>
                <div className="text-blue-100">Active Investors</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-blue-100 mb-6">
                Experience the complete Waternity ecosystem with guided demos, live IoT simulation, and real-time orchestrator monitoring.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/demo" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Try Interactive Demo
                </Link>
                <Link 
                  href="/app" 
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Launch Full App
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Droplets className="h-6 w-6" />
            <span className="text-xl font-bold">Waternity</span>
          </div>
          <p className="text-gray-400 mb-4">
            Tokenized Safe Water Access on Hedera
          </p>
          <div className="flex justify-center space-x-8 mb-4">
            <Link href="/app" className="text-gray-400 hover:text-white">Dashboard</Link>
            <Link href="/demo" className="text-gray-400 hover:text-white">Demo</Link>
            <span className="text-gray-400 cursor-not-allowed">Documentation</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for Hedera Hackathon 2024 • Powered by HTS + HCS + Smart Contracts
          </p>
        </div>
      </footer>
    </div>
  );
}
