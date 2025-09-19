import React from 'react';
import { X, Check, Crown, Zap, Star } from 'lucide-react';

interface SubscriptionPlansProps {
  darkMode: boolean;
  onClose: () => void;
  onSubscribe: (plan: string) => void;
  currentPlan: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  darkMode,
  onClose,
  onSubscribe,
  currentPlan
}) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: '₹',
      interval: 'month',
      features: [
        '5 stocks in watchlist',
        '10 analyses per month',
        'Basic insights',
        'Email support'
      ],
      icon: Star,
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 999,
      currency: '₹',
      interval: 'month',
      features: [
        '50 stocks in watchlist',
        '100 analyses per month',
        'Advanced insights',
        'Priority support',
        'Export reports'
      ],
      icon: Zap,
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 1999,
      currency: '₹',
      interval: 'month',
      features: [
        'Unlimited stocks',
        'Unlimited analyses',
        'AI-powered insights',
        '24/7 support',
        'Custom reports',
        'API access'
      ],
      icon: Crown,
      popular: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Choose Your Plan
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    plan.popular
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : darkMode
                      ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                      plan.popular
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        plan.popular
                          ? 'text-blue-600 dark:text-blue-400'
                          : darkMode
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center">
                      <span className={`text-3xl font-bold ${
                        plan.popular
                          ? 'text-blue-600 dark:text-blue-400'
                          : darkMode
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}>
                        {plan.currency}{plan.price}
                      </span>
                      <span className={`ml-1 text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        /{plan.interval}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className={`w-5 h-5 mr-3 ${
                          plan.popular
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-500'
                        }`} />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => onSubscribe(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      isCurrentPlan
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              All plans include a 15-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
