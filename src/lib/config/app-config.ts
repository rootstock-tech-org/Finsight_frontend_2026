// Application Configuration and Business Rules
export const APP_CONFIG = {
  // Runtime Settings
  RUNTIME: {
    START_TIME: '08:00', // 8 AM
    END_TIME: '20:00',   // 8 PM
    TIMEZONE: 'Asia/Kolkata', // Indian Standard Time
  },

  // Historical Records Display
  HISTORICAL_RECORDS: {
    PORTAL_DISPLAY_LIMIT: 10, // Last 10 entries on portal
    TELEGRAM_DISPLAY_LIMIT: 50, // More entries on Telegram
    WHATSAPP_DISPLAY_LIMIT: 50, // More entries on WhatsApp
  },

  // Stock Limits
  STOCK_LIMITS: {
    FREE_TIER: 10, // Free users can add 10 stocks
    PREMIUM_TIER: 500, // Premium users can add 500 stocks
    ENTERPRISE_TIER: 100, // Enterprise users can add 100 stocks
    DEFAULT_LIMIT: 10, // Default limit
  },

  // Subscription Plans
  SUBSCRIPTION_PLANS: {
    FREE: {
      name: 'Free',
      price: 0,
      stockLimit: 10,
      features: ['Basic stock tracking', 'Daily updates', 'Email notifications']
    },
    BASIC: {
      name: 'Basic',
      price: 99, // ₹99/month - Least possible
      stockLimit: 10,
      features: ['Enhanced tracking', 'Real-time updates', 'WhatsApp notifications']
    },
    PREMIUM: {
      name: 'Premium',
      price: 199, // ₹199/month
      stockLimit: 500,
      features: ['Advanced analytics', 'Priority support', 'All communication channels']
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 499, // ₹499/month
      stockLimit: 100,
      features: ['Custom solutions', 'Dedicated support', 'API access']
    }
  },

  // Communication Channels (Most cost-effective without lag)
  COMMUNICATION_CHANNELS: {
    EMAIL: {
      name: 'Email',
      cost: 'Low',
      lag: 'Low',
      reliability: 'High',
      enabled: true
    },
    SMS: {
      name: 'SMS',
      cost: 'Medium',
      lag: 'Low',
      reliability: 'High',
      enabled: true
    },
    WHATSAPP: {
      name: 'WhatsApp',
      cost: 'Low',
      lag: 'Low',
      reliability: 'High',
      enabled: true
    },
    TELEGRAM: {
      name: 'Telegram',
      cost: 'Very Low',
      lag: 'Low',
      reliability: 'High',
      enabled: true
    }
  },

  // Communication Frequency
  COMMUNICATION_FREQUENCY: {
    DAILY: {
      name: 'Daily',
      value: 'daily',
      description: 'Updates every day at 8 AM'
    },
    WEEKLY: {
      name: 'Weekly',
      value: 'weekly',
      description: 'Weekly summary every Monday'
    },
    MONTHLY: {
      name: 'Monthly',
      value: 'monthly',
      description: 'Monthly report on 1st of month'
    }
  },

  // Bandwidth and Performance
  PERFORMANCE: {
    PORTAL_BANDWIDTH_LIMIT: 10, // Show last 10 records on portal
    MOBILE_BANDWIDTH_LIMIT: 50, // Show more on mobile apps
    API_RATE_LIMIT: 100, // API calls per hour
    CACHE_DURATION: 300000, // 5 minutes cache
  },

  // Feature Flags
  FEATURES: {
    NEWS_UPDATES: true,
    STOCK_TRACKING: true,
    TECHNICAL_ANALYSIS: true,
    PORTFOLIO_MANAGEMENT: true,
    REAL_TIME_ALERTS: true,
    HISTORICAL_DATA: true,
  }
};

// Helper functions
export const isWithinRuntime = (): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = 8 * 60; // 8 AM
  const endTime = 20 * 60; // 8 PM
  
  return currentTime >= startTime && currentTime <= endTime;
};

export const getStockLimit = (userTier: string = 'FREE'): number => {
  return APP_CONFIG.STOCK_LIMITS[userTier as keyof typeof APP_CONFIG.STOCK_LIMITS] || APP_CONFIG.STOCK_LIMITS.DEFAULT_LIMIT;
};

export const getHistoricalRecordsLimit = (channel: string): number => {
  switch (channel) {
    case 'portal':
      return APP_CONFIG.HISTORICAL_RECORDS.PORTAL_DISPLAY_LIMIT;
    case 'telegram':
      return APP_CONFIG.HISTORICAL_RECORDS.TELEGRAM_DISPLAY_LIMIT;
    case 'whatsapp':
      return APP_CONFIG.HISTORICAL_RECORDS.WHATSAPP_DISPLAY_LIMIT;
    default:
      return APP_CONFIG.HISTORICAL_RECORDS.PORTAL_DISPLAY_LIMIT;
  }
};

export const getSubscriptionPlan = (planName: string) => {
  return APP_CONFIG.SUBSCRIPTION_PLANS[planName as keyof typeof APP_CONFIG.SUBSCRIPTION_PLANS];
};

export const getCommunicationChannels = () => {
  return Object.entries(APP_CONFIG.COMMUNICATION_CHANNELS)
    .filter(([_, config]) => config.enabled)
    .map(([key, config]) => ({ key, ...config }));
}; 