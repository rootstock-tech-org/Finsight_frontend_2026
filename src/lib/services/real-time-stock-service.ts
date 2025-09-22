import { supabase } from '@/lib/supabase';
import { supabaseRealtimeService, RealtimeCallback } from './supabase-realtime-service';
import { WatchlistItem } from '@/lib/store/stock-store';

export interface StockData {
  id: string;
  symbol: string;
  company_name: string;
  sector?: string;
  industry?: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  pe_ratio?: number;
  dividend_yield?: number;
  last_updated: string;
}

export interface MarketData {
  id: string;
  symbol: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  date: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  source?: string;
  url?: string;
  published_at: string;
  sentiment_score?: number;
  related_symbols: string[];
}

export class RealTimeStockService {
  private subscriptions: Map<string, any> = new Map();

  // Fetch stocks from API
  async fetchStocks(params: {
    symbol?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ stocks: StockData[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.symbol) searchParams.set('symbol', params.symbol);
      if (params.search) searchParams.set('search', params.search);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());

      const response = await fetch(`/api/stocks?${searchParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }
  }

  // Fetch single stock details
  async fetchStockDetails(symbol: string): Promise<{
    stock: StockData;
    marketData: MarketData[];
    news: NewsItem[];
  }> {
    try {
      const response = await fetch(`/api/stocks/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stock details:', error);
      throw error;
    }
  }

  // Fetch market data
  async fetchMarketData(params: {
    symbol?: string;
    date?: string;
    limit?: number;
  } = {}): Promise<{ marketData: MarketData[] }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.symbol) searchParams.set('symbol', params.symbol);
      if (params.date) searchParams.set('date', params.date);
      if (params.limit) searchParams.set('limit', params.limit.toString());

      const response = await fetch(`/api/market-data?${searchParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  // Fetch news
  async fetchNews(params: {
    symbol?: string;
    limit?: number;
    offset?: number;
    sentiment?: string;
  } = {}): Promise<{ news: NewsItem[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.symbol) searchParams.set('symbol', params.symbol);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      if (params.sentiment) searchParams.set('sentiment', params.sentiment);

      const response = await fetch(`/api/news?${searchParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  // Subscribe to real-time stock updates
  subscribeToStockUpdates(
    symbol: string,
    callback: RealtimeCallback<StockData>
  ) {
    const subscriptionKey = `stock-${symbol}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribeFromStockUpdates(symbol);
    }

    const channel = supabaseRealtimeService.subscribeToStockSymbol(symbol, callback);
    this.subscriptions.set(subscriptionKey, channel);
    
    return channel;
  }

  // Subscribe to market data updates
  subscribeToMarketDataUpdates(
    callback: RealtimeCallback<MarketData>
  ) {
    const subscriptionKey = 'market-data';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribeFromMarketDataUpdates();
    }

    const channel = supabaseRealtimeService.subscribeToMarketData(callback);
    this.subscriptions.set(subscriptionKey, channel);
    
    return channel;
  }

  // Subscribe to news updates
  subscribeToNewsUpdates(
    callback: RealtimeCallback<NewsItem>
  ) {
    const subscriptionKey = 'news';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribeFromNewsUpdates();
    }

    const channel = supabaseRealtimeService.subscribeToTable('news', 'INSERT', undefined, callback);
    this.subscriptions.set(subscriptionKey, channel);
    
    return channel;
  }

  // Unsubscribe from stock updates
  unsubscribeFromStockUpdates(symbol: string) {
    const subscriptionKey = `stock-${symbol}`;
    const channel = this.subscriptions.get(subscriptionKey);
    
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Unsubscribe from market data updates
  unsubscribeFromMarketDataUpdates() {
    const subscriptionKey = 'market-data';
    const channel = this.subscriptions.get(subscriptionKey);
    
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Unsubscribe from news updates
  unsubscribeFromNewsUpdates() {
    const subscriptionKey = 'news';
    const channel = this.subscriptions.get(subscriptionKey);
    
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Unsubscribe from all updates
  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // Convert StockData to WatchlistItem
  stockDataToWatchlistItem(stock: StockData): WatchlistItem {
    return {
      symbol: stock.symbol,
      name: stock.company_name,
      type: 'stock',
      sector: stock.sector,
      last_price: stock.current_price,
      change_percent: stock.price_change_percent
    };
  }
}

// Export singleton instance
export const realTimeStockService = new RealTimeStockService();
