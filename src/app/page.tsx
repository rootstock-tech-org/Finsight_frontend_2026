'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/header';
import { ArrowRight, TrendingUp, Shield, Zap, Users, BarChart3, Clock } from 'lucide-react';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:pt-28 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Transform Your
              <span className="text-blue-600 dark:text-blue-400"> Financial Future</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Your AI-powered financial document analysis platform that turns complexity into confidence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="w-full sm:w-auto">
                <Button 
                  className="w-full sm:w-auto h-10 px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button 
                  className="w-full sm:w-auto h-10 px-6 text-sm bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose FinSight?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Advanced AI technology meets financial expertise to deliver insights that matter
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-5">
                <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Real-time Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant insights on stocks and mutual funds with our advanced AI algorithms
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-5">
                <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Bank-grade security with multiple communication channels for updates
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-5">
                <Zap className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Smart Notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Personalized alerts via WhatsApp, Telegram, SMS, or Email
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-5">
                <BarChart3 className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Deep market insights and portfolio optimization recommendations
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Community Driven
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join thousands of investors making informed decisions
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-5">
                <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Market Hours Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Active during market hours (8 AM - 8 PM) for real-time updates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8">
            Join FinSight today and transform the way you analyze financial markets
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                className="w-full sm:w-auto h-10 px-6 text-sm bg-white text-blue-600 hover:bg-gray-50 font-medium rounded-lg"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/subscription" className="w-full sm:w-auto">
              <Button 
                className="w-full sm:w-auto h-10 px-6 text-sm border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium rounded-lg"
              >
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              © 2024 FinSight. All rights reserved.
            </p>
            <div className="mt-2 flex justify-center space-x-4">
              <Link href="/terms" className="text-sm text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-blue-400 hover:text-blue-300">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-sm text-blue-400 hover:text-blue-300">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}