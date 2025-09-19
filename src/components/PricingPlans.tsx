import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Crown, ArrowRight, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStockStore } from '@/lib/store/stock-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { subscriptionService, SubscriptionPlan, SubscriptionStatus } from '@/lib/services/subscription-service';

interface PricingPlansProps {
  darkMode: boolean;
  onClose?: () => void;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ darkMode, onClose }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [whatsappAddon, setWhatsappAddon] = useState(false);
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  
  const { userTier } = useStockStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, subscriptionData] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.getCurrentSubscription()
        ]);
        setPlans(plansData);
        setCurrentSubscription(subscriptionData);
      } catch (error) {
        console.error('Failed to load pricing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      alert('Please log in to upgrade your plan');
      return;
    }

    setUpgrading(planId);
    try {
      const result = await subscriptionService.upgradeToPlan(planId as 'FREE' | 'PREMIUM' | 'PRO');
      
      if (result.success && result.paymentUrl) {
        // Redirect to payment
        window.open(result.paymentUrl, '_blank');
      } else if (result.success) {
        // Free plan or already upgraded
        alert('Plan updated successfully!');
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const getPremiumPrice = () => {
    const premiumPlan = plans.find(p => p.id === 'PREMIUM');
    if (!premiumPlan) return 300;
    
    let basePrice = premiumPlan.price;
    if (whatsappAddon) {
      basePrice += 200; // WhatsApp addon price
    }
    return basePrice;
  };

  const features = [
    { feature: 'Price', free: '₹0', premium: `from ₹${getPremiumPrice()}/mo`, bespoke: 'Custom' },
    { feature: 'Stocks in Watchlist', free: '10', premium: '500', bespoke: 'Unlimited' },
    { feature: 'Monthly Analyses', free: '10', premium: 'Unlimited', bespoke: 'Unlimited' },
    { feature: 'Realtime Alerts', free: false, premium: true, bespoke: true },
    { feature: 'Price Alerts', free: false, premium: true, bespoke: true },
    { feature: 'News Insights', free: 'Basic', premium: 'Advanced', bespoke: 'Advanced' },
    { feature: 'AI Uploads (Finsight)', free: '0', premium: '100 / month', bespoke: 'Unlimited' },
    { feature: 'Telegram Notifications', free: false, premium: true, bespoke: true },
    { feature: 'WhatsApp Notifications', free: false, premium: whatsappAddon ? 'Included' : 'Add-on (+₹200)', bespoke: true },
    { feature: 'API Access', free: false, premium: true, bespoke: 'Custom Integrations' },
    { feature: 'Support', free: 'Email', premium: 'Priority Email', bespoke: 'Dedicated Manager' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header with Close Button */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Pricing Plans
            </h1>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        {/* Header Section */}
        <header className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tighter">
            The Right Plan for Your Ambition
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400">
            From casual tracking to AI-powered institutional strategies, find your perfect fit. All paid plans come with a 15-day free trial.
          </p>
        </header>

        {/* Pricing Sections */}
        <div className="space-y-10 max-w-4xl mx-auto">
          {/* Plan 1: Free */}
          <div className="plan-section bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 md:p-10 border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Free Plan</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Perfect for getting started on your investment journey.</p>
              </div>
              <div className="mt-6 md:mt-0 text-left md:text-right">
                <span className="text-5xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                <p className="text-slate-500 dark:text-slate-400">Forever free</p>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-8">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-slate-700 dark:text-slate-300">10 stocks in watchlist</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-slate-700 dark:text-slate-300">10 monthly analyses</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-slate-700 dark:text-slate-300">Basic insights</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-slate-700 dark:text-slate-300">Mobile app access</span>
                </li>
              </ul>
              <Button
                disabled
                className="mt-8 w-full md:w-auto bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
              >
                Your Current Plan
              </Button>
            </div>
          </div>

          {/* Plan 2: Premium */}
          <div className="plan-section bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-2xl p-8 md:p-12 relative transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
            <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white text-indigo-600 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
              Most Popular
            </span>
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h3 className="text-3xl font-bold">Premium Plan</h3>
                <p className="mt-2 text-indigo-200">For active traders who need a powerful, professional edge.</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  <span className="text-indigo-100">✨ 15-day free trial</span>
                </div>
              </div>
              <div className="mt-6 md:mt-0 text-left md:text-right">
                <span className="text-6xl font-extrabold ml-2">₹{getPremiumPrice()}</span>
                <p className="text-indigo-200">/month</p>
                <p className="text-indigo-100 text-sm mt-1">After 15-day trial</p>
              </div>
            </div>
            <div className="mt-10">
              <h4 className="font-semibold text-lg mb-4">Core Premium Features:</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>500 stocks in watchlist</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>Realtime & Price Alerts</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>100 AI uploads on Finsight</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>Advanced News Insights</span>
                </li>
                <li className="flex items-center font-semibold">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>Telegram Notifications</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 border-t border-indigo-400 border-opacity-50 pt-8">
              <h4 className="font-semibold text-lg mb-4">Upgrade your notifications:</h4>
              <div className="space-y-4">
                <label className="flex items-center p-4 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappAddon}
                    onChange={(e) => setWhatsappAddon(e.target.checked)}
                    className="h-5 w-5 text-indigo-400 bg-transparent border-white rounded focus:ring-indigo-500 focus:ring-offset-indigo-800"
                  />
                  <span className="ml-4 text-white font-medium">Upgrade to WhatsApp</span>
                  <span className="ml-auto font-semibold text-indigo-200">+ ₹200/mo</span>
                </label>
              </div>
            </div>
            <Button
              onClick={() => handleUpgrade('PREMIUM')}
              disabled={upgrading === 'PREMIUM'}
              className="mt-10 w-full bg-white text-indigo-600 font-bold py-4 px-6 rounded-lg hover:bg-indigo-50 transition-colors text-lg shadow-lg"
            >
              {upgrading === 'PREMIUM' ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                'Start 15-Day Free Trial'
              )}
            </Button>
          </div>

          {/* Plan 3: Bespoke */}
          <div className="plan-section bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-xl p-8 md:p-10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold">Bespoke Solutions</h3>
                <p className="mt-2 text-slate-300">For institutions that require tailored, enterprise-grade AI.</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  <span className="text-slate-200">✨ 15-day free trial</span>
                </div>
              </div>
              <div className="mt-6 md:mt-0 text-left md:text-right">
                <span className="text-5xl font-extrabold">Custom</span>
                <p className="text-slate-300 text-sm mt-1">After 15-day trial</p>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-600 pt-8">
              <p className="mb-4 text-slate-300">Includes everything in Premium, plus dedicated resources and custom development to meet your exact needs.</p>
              <Button
                onClick={() => handleUpgrade('PRO')}
                disabled={upgrading === 'PRO'}
                className="w-full md:w-auto bg-white text-slate-900 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {upgrading === 'PRO' ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  'Start 15-Day Free Trial'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Comparison Section */}
        <div className="text-center mt-16">
          <Button
            variant="ghost"
            onClick={() => setShowFeatureTable(!showFeatureTable)}
            className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <span>{showFeatureTable ? 'Hide features' : 'Compare all features'}</span>
            {showFeatureTable ? (
              <ChevronUp className="inline-block w-5 h-5 ml-1 transition-transform transform" />
            ) : (
              <ChevronDown className="inline-block w-5 h-5 ml-1 transition-transform transform" />
            )}
          </Button>
        </div>

        {/* Feature Comparison Table */}
        <div className={`max-w-6xl mx-auto mt-8 transition-all duration-700 ease-in-out ${
          showFeatureTable ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-4 text-lg font-bold text-slate-900 dark:text-white">Feature</th>
                  <th className="p-4 text-center font-semibold text-slate-900 dark:text-white">Free</th>
                  <th className="p-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">Premium</th>
                  <th className="p-4 text-center font-semibold text-slate-900 dark:text-white">Bespoke</th>
                </tr>
              </thead>
              <tbody>
                {features.map((item, index) => (
                  <tr key={index} className={`border-t ${index === 0 ? 'border-slate-300 dark:border-slate-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{item.feature}</td>
                    {['free', 'premium', 'bespoke'].map((plan) => {
                      const value = item[plan as keyof typeof item];
                      if (typeof value === 'boolean') {
                        return (
                          <td key={plan} className="p-4 text-center text-slate-700 dark:text-slate-300">
                            {value ? (
                              <Check className="mx-auto h-6 w-6 text-green-500" />
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 mx-auto block text-center">-</span>
                            )}
                          </td>
                        );
                      }
                      return (
                        <td key={plan} className="p-4 text-center text-slate-700 dark:text-slate-300">
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-slate-600 dark:text-slate-400">
          <p className="text-sm">
            All plans include a 15-day free trial. Cancel anytime. No hidden fees.
          </p>
          <p className="text-xs mt-2">
            Prices are in Indian Rupees (INR). Taxes may apply.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
