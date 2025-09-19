import { useState, useEffect, useCallback } from 'react';
import { realTimeStockService, StockData, MarketData, NewsItem } from '@/lib/services/real-time-stock-service';
import { supabaseRealtimeService } from '@/lib/services/supabase-realtime-service';
import { WatchlistItem } from '@/lib/store/stock-store';

export interface UseRealTimeStocksOptions {
  symbol?: string;
  search?: string;
  limit?: number;
  offset?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useRealTimeStocks(options: UseRealTimeStocksOptions = {}) {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const {
    symbol,
    search,
    limit = 50,
    offset = 0,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // Fetch stocks
  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await realTimeStockService.fetchStocks({
        symbol,
        search,
        limit,
        offset
      });
      
      setStocks(data.stocks);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, search, limit, offset]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    // Subscribe to all stock updates
    const channel = supabaseRealtimeService.subscribeToTable('stocks', 'UPDATE', undefined, (payload) => {
      setStocks(prevStocks => {
        const updatedStocks = [...prevStocks];
        const index = updatedStocks.findIndex(stock => stock.symbol === payload.new.symbol);
        
        if (index !== -1) {
          updatedStocks[index] = payload.new;
        } else if (payload.new.symbol === symbol) {
          // If this is the specific symbol we're watching, add it
          updatedStocks.unshift(payload.new);
        }
        
        return updatedStocks;
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [autoRefresh, symbol]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStocks, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStocks, autoRefresh, refreshInterval]);

  // Initial fetch
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return {
    stocks,
    loading,
    error,
    total,
    refetch: fetchStocks
  };
}

export function useRealTimeStockDetails(symbol: string) {
  const [stock, setStock] = useState<StockData | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock details
  const fetchDetails = useCallback(async () => {
    if (!symbol) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await realTimeStockService.fetchStockDetails(symbol);
      
      setStock(data.stock);
      setMarketData(data.marketData);
      setNews(data.news);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock details');
      console.error('Error fetching stock details:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Subscribe to real-time updates for this specific stock
  useEffect(() => {
    if (!symbol) return;

    const channel = realTimeStockService.subscribeToStockUpdates(symbol, (payload) => {
      setStock(payload.new);
    });

    return () => {
      realTimeStockService.unsubscribeFromStockUpdates(symbol);
    };
  }, [symbol]);

  // Initial fetch
  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    stock,
    marketData,
    news,
    loading,
    error,
    refetch: fetchDetails
  };
}

export function useRealTimeNews(options: { symbol?: string; limit?: number } = {}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { symbol, limit = 20 } = options;

  // Fetch news
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await realTimeStockService.fetchNews({
        symbol,
        limit
      });
      
      setNews(data.news);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, limit]);

  // Subscribe to real-time news updates
  useEffect(() => {
    const channel = supabaseRealtimeService.subscribeToTable('news', 'INSERT', undefined, (payload) => {
      setNews(prevNews => {
        // Add new news to the beginning
        return [payload.new, ...prevNews];
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    news,
    loading,
    error,
    total,
    refetch: fetchNews
  };
}

// Hook to convert StockData to WatchlistItem
export function useStockDataToWatchlistItem() {
  return useCallback((stock: StockData): WatchlistItem => {
    return realTimeStockService.stockDataToWatchlistItem(stock);
  }, []);
}
