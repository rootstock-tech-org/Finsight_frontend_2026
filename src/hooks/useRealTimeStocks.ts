import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeStockService, StockData, MarketData, NewsItem } from '@/lib/services/real-time-stock-service';
import { WatchlistItem } from '@/lib/store/stock-store';

export interface UseRealTimeStocksOptions {
  symbol?: string;
  search?: string;
  limit?: number;
  offset?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ── useRealTimeStocks ─────────────────────────────────────────────────────
export function useRealTimeStocks(options: UseRealTimeStocksOptions = {}) {
  const {
    symbol, search,
    limit = 50, offset = 0,
    autoRefresh = true,
    refreshInterval = 30_000,
  } = options;

  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await realTimeStockService.fetchStocks({ symbol, search, limit, offset });
      setStocks(data.stocks);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, search, limit, offset]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchStocks, refreshInterval);
    return () => clearInterval(id);
  }, [fetchStocks, autoRefresh, refreshInterval]);

  return { stocks, loading, error, total, refetch: fetchStocks };
}

// ── useRealTimeStockDetails ───────────────────────────────────────────────
export function useRealTimeStockDetails(symbol: string) {
  const [stock, setStock] = useState<StockData | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    fetchDetails();
    pollRef.current = setInterval(fetchDetails, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchDetails]);

  return { stock, marketData, news, loading, error, refetch: fetchDetails };
}

// ── useRealTimeNews ───────────────────────────────────────────────────────
export function useRealTimeNews(options: { symbol?: string; limit?: number } = {}) {
  const { symbol, limit = 20 } = options;

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: Use existing API
      const data = await realTimeStockService.fetchStockDetails(symbol || '');

      setNews(data.news?.slice(0, limit) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, limit]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  useEffect(() => {
    const id = setInterval(fetchNews, 60_000);
    return () => clearInterval(id);
  }, [fetchNews]);

  return { news, loading, error, total: news.length, refetch: fetchNews };
}

// ── useStockDataToWatchlistItem ───────────────────────────────────────────
export function useStockDataToWatchlistItem() {
  return useCallback((stock: StockData): WatchlistItem => {
    return realTimeStockService.stockDataToWatchlistItem(stock);
  }, []);
}