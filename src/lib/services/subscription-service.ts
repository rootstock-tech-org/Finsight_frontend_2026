import { useAuthStore } from '@/lib/store/auth-store';
import { useStockStore } from '@/lib/store/stock-store';

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'PRO';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    stocks: number;
    analyses: number;
    history: number;
  };
  popular?: boolean;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: Date;
  autoRenew: boolean;
  paymentMethod?: string;
}

export interface UsageStats {
  stocksAdded: number;
  analysesThisMonth: number;
  historyItems: number;
  lastAnalysis?: Date;
}

class SubscriptionService {
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      currency: 'INR',
      interval: 'month',
      features: [
        '10 stocks in watchlist',
        '10 monthly analyses',
        'Basic insights',
        'Email support',
        'Mobile app access'
      ],
      limits: {
        stocks: 10,
        analyses: 10,
        history: 10
      }
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: 299,
      currency: 'INR',
      interval: 'month',
      features: [
        '50 stocks in watchlist',
        '100 monthly analyses',
        'Advanced insights',
        'WhatsApp notifications',
        'Priority email support',
        'Sector analysis',
        'Export to PDF'
      ],
      limits: {
        stocks: 50,
        analyses: 100,
        history: 100
      },
      popular: true
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 799,
      currency: 'INR',
      interval: 'month',
      features: [
        '100 stocks in watchlist',
        'Unlimited analyses',
        'Premium insights',
        'WhatsApp + Telegram notifications',
        'Priority phone support',
        'Custom alerts',
        'API access',
        'Portfolio tracking',
        'Advanced charts'
      ],
      limits: {
        stocks: 100,
        analyses: -1, // unlimited
        history: 500
      }
    }
  ];

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.plans;
  }

  async getCurrentSubscription(): Promise<SubscriptionStatus> {
    try {
      const { userTier } = useStockStore.getState();
      
      // Mock subscription status - in production, fetch from backend
      return {
        tier: userTier as SubscriptionTier,
        isActive: true,
        expiresAt: userTier !== 'FREE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
        autoRenew: userTier !== 'FREE',
        paymentMethod: userTier !== 'FREE' ? 'UPI' : undefined
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return {
        tier: 'FREE',
        isActive: false,
        autoRenew: false
      };
    }
  }

  async getUsageStats(): Promise<UsageStats> {
    try {
      const { watchlist } = useStockStore.getState();
      const stored = localStorage.getItem('usage_stats');
      
      if (stored) {
        const stats = JSON.parse(stored);
        return {
          ...stats,
          stocksAdded: watchlist.length,
          lastAnalysis: stats.lastAnalysis ? new Date(stats.lastAnalysis) : undefined
        };
      }

      return {
        stocksAdded: watchlist.length,
        analysesThisMonth: 0,
        historyItems: 0
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        stocksAdded: 0,
        analysesThisMonth: 0,
        historyItems: 0
      };
    }
  }

  async updateUsageStats(type: 'analysis' | 'history', increment: number = 1): Promise<void> {
    try {
      const currentStats = await this.getUsageStats();
      const updatedStats = { ...currentStats };

      if (type === 'analysis') {
        updatedStats.analysesThisMonth += increment;
        updatedStats.lastAnalysis = new Date();
      } else if (type === 'history') {
        updatedStats.historyItems += increment;
      }

      localStorage.setItem('usage_stats', JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Failed to update usage stats:', error);
    }
  }

  async canPerformAction(action: 'add_stock' | 'analyze' | 'save_history'): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription();
      const plan = this.plans.find(p => p.id === subscription.tier);
      const usage = await this.getUsageStats();

      if (!plan) return false;

      switch (action) {
        case 'add_stock':
          return usage.stocksAdded < plan.limits.stocks;
        
        case 'analyze':
          return plan.limits.analyses === -1 || usage.analysesThisMonth < plan.limits.analyses;
        
        case 'save_history':
          return usage.historyItems < plan.limits.history;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to check action permission:', error);
      return false;
    }
  }

  async upgradeToPlan(planId: SubscriptionTier): Promise<{ success: boolean; paymentUrl?: string }> {
    try {
      if (planId === 'FREE') {
        const { setUserTier } = useStockStore.getState();
        setUserTier('FREE');
        return { success: true };
      }

      // In production, this would integrate with payment gateway
      const paymentUrl = this.generatePaymentUrl(planId);
      
      return {
        success: true,
        paymentUrl
      };
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
      return { success: false };
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      // In production, this would call the backend API
      const { setUserTier } = useStockStore.getState();
      setUserTier('FREE');
      
      // Clear usage stats
      localStorage.removeItem('usage_stats');
      
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  async processPaymentSuccess(planId: SubscriptionTier, paymentId: string): Promise<boolean> {
    try {
      // In production, verify payment with backend
      const { setUserTier } = useStockStore.getState();
      setUserTier(planId);
      
      // Reset usage stats for new billing cycle
      const currentMonth = new Date().getMonth();
      const usage = await this.getUsageStats();
      
      const resetStats = {
        ...usage,
        analysesThisMonth: 0
      };
      
      localStorage.setItem('usage_stats', JSON.stringify(resetStats));
      localStorage.setItem('last_payment', JSON.stringify({
        planId,
        paymentId,
        timestamp: new Date(),
        amount: this.plans.find(p => p.id === planId)?.price || 0
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to process payment success:', error);
      return false;
    }
  }

  private generatePaymentUrl(planId: SubscriptionTier): string {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan');

    // In production, this would generate actual payment gateway URL
    const params = new URLSearchParams({
      amount: (plan.price * 100).toString(), // Convert to paise
      currency: plan.currency,
      plan: planId,
      return_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`
    });

    return `https://payments.finsight.com/checkout?${params.toString()}`;
  }

  getPlanById(planId: SubscriptionTier): SubscriptionPlan | undefined {
    return this.plans.find(plan => plan.id === planId);
  }

  async getPaymentHistory(): Promise<unknown[]> {
    try {
      const stored = localStorage.getItem('payment_history');
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  // Utility method to check if user needs upgrade prompt
  shouldShowUpgradePrompt(action: 'add_stock' | 'analyze'): boolean {
    const { userTier } = useStockStore.getState();
    
    if (userTier === 'PRO') return false;
    
    // Show upgrade prompts for free users more frequently
    if (userTier === 'FREE') {
      return Math.random() < 0.3; // 30% chance
    }
    
    // Premium users see less frequent prompts
    return Math.random() < 0.1; // 10% chance
  }

  getUpgradeMessage(currentTier: SubscriptionTier, action: string): string {
    const messages: Record<SubscriptionTier, Record<string, string>> = {
      FREE: {
        add_stock: "Upgrade to Premium to track up to 50 stocks!",
        analyze: "Upgrade to Premium for 100 monthly analyses!",
        default: "Unlock more features with Premium!"
      },
      PREMIUM: {
        add_stock: "Upgrade to Pro to track up to 100 stocks!",
        analyze: "Upgrade to Pro for unlimited analyses!",
        default: "Get the most out of FinSight with Pro!"
      },
      PRO: {
        add_stock: "You have unlimited stock tracking!",
        analyze: "You have unlimited analyses!",
        default: "You have access to all features!"
      }
    };

    return messages[currentTier]?.[action] || messages[currentTier]?.default || "Upgrade for more features!";
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
