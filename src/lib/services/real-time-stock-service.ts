/**
 * real-time-stock-service.ts
 *
 * Supabase imports fully removed.
 * Real-time subscriptions replaced with polling (call startPolling / stopPolling).
 * All REST fetch methods now point to FastAPI or existing /api/ Next.js routes.
 *
 * Backend endpoints used:
 *   GET /stocks/           → list/search stocks
 *   GET /stocks/{id}       → single stock
 *   GET /stocks/symbol/{s} → by symbol
 */

import { WatchlistItem } from '@/lib/store/stock-store';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ── Types (unchanged from original) ──────────────────────────────────────────

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

// Callback type for polling updates (replaces Supabase RealtimeCallback)
export type StockUpdateCallback = (stocks: StockData[]) => void;

// ── Helper ────────────────────────────────────────────────────────────────────

async function backendFetch(path: string): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`);
}

// ── Service ───────────────────────────────────────────────────────────────────

export class RealTimeStockService {
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  // ── Fetch stocks from FastAPI ─────────────────────────────────────────────

  async fetchStocks(params: {
    symbol?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ stocks: StockData[]; total: number }> {
    try {
      const qs = new URLSearchParams();
      if (params.symbol) qs.set('symbol', params.symbol);
      if (params.search) qs.set('name', params.search); // FastAPI uses `name` for search
      if (params.limit)  qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));

      const res = await backendFetch(`/stocks/?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawStocks = await res.json();

      // Normalize FastAPI shape → StockData shape
      const stocks: StockData[] = rawStocks.map((s: any) => ({
        id: s.id,
        symbol: s.symbol,
        company_name: s.name,
        sector: s.sector,
        current_price: s.current_price || 0,
        price_change: 0,
        price_change_percent: 0,
        volume: 0,
        last_updated: s.last_updated || new Date().toISOString(),
      }));

      return { stocks, total: stocks.length };
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }
  }

  // ── Fetch single stock by symbol ──────────────────────────────────────────

  async fetchStockBySymbol(symbol: string): Promise<StockData | null> {
    try {
      const res = await backendFetch(`/stocks/symbol/${encodeURIComponent(symbol)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const s = await res.json();
      return {
        id: s.id,
        symbol: s.symbol,
        company_name: s.name,
        sector: s.sector,
        current_price: s.current_price || 0,
        price_change: 0,
        price_change_percent: 0,
        volume: 0,
        last_updated: s.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching stock ${symbol}:`, error);
      return null;
    }
  }

  // ── Fetch stock details (falls back to /api/ Next.js routes for market/news) ──

  async fetchStockDetails(symbol: string): Promise<{
    stock: StockData | null;
    marketData: MarketData[];
    news: NewsItem[];
  }> {
    try {
      const [stock, marketRes, newsRes] = await Promise.allSettled([
        this.fetchStockBySymbol(symbol),
        fetch(`/api/market-data?symbol=${symbol}`),
        fetch(`/api/news?symbol=${symbol}&limit=10`),
      ]);

      return {
        stock: stock.status === 'fulfilled' ? stock.value : null,
        marketData:
          marketRes.status === 'fulfilled' && marketRes.value.ok
            ? (await marketRes.value.json()).marketData || []
            : [],
        news:
          newsRes.status === 'fulfilled' && newsRes.value.ok
            ? (await newsRes.value.json()).news || []
            : [],
      };
    } catch (error) {
      console.error('Error fetching stock details:', error);
      throw error;
    }
  }

  // ── Polling-based "real-time" updates (replaces Supabase subscriptions) ───
  // Call startPolling to get periodic updates; call stopPolling to cancel.

  startPolling(
    key: string,
    fetchFn: () => Promise<StockData[]>,
    callback: StockUpdateCallback,
    intervalMs = 30_000
  ): void {
    this.stopPolling(key); // clear existing
    const id = setInterval(async () => {
      try {
        const data = await fetchFn();
        callback(data);
      } catch (e) {
        console.warn(`Polling error [${key}]:`, e);
      }
    }, intervalMs);
    this.pollingIntervals.set(key, id);
  }

  stopPolling(key: string): void {
    const id = this.pollingIntervals.get(key);
    if (id !== undefined) {
      clearInterval(id);
      this.pollingIntervals.delete(key);
    }
  }

  stopAllPolling(): void {
    this.pollingIntervals.forEach((id) => clearInterval(id));
    this.pollingIntervals.clear();
  }

  // ── Convert FastAPI stock → WatchlistItem ─────────────────────────────────

  stockDataToWatchlistItem(stock: StockData): WatchlistItem {
    return {
      symbol: stock.symbol,
      name: stock.company_name,
      type: 'stock',
      sector: stock.sector,
      last_price: stock.current_price,
      change_percent: stock.price_change_percent,
    };
  }
}

// Export singleton
export const realTimeStockService = new RealTimeStockService();