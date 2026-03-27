/**
 * watchlist-service.ts
 *
 * All calls now go to FastAPI backend.
 * Supabase import removed entirely.
 *
 * Backend endpoints used:
 *   GET    /watchlist/{user_id}           → enriched list with PnL
 *   POST   /watchlist/?user_id=           → add stock (body: WatchlistCreate)
 *   DELETE /watchlist/{id}?user_id=       → remove entry
 *   PATCH  /watchlist/{id}?user_id=       → update notes/added_price
 *   GET    /watchlist/{user_id}/stats     → stats
 *   POST   /watchlist/bulk?user_id=       → bulk add
 */

import { WatchlistItem } from '@/lib/store/stock-store';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WatchlistApiItem {
  id: string;
  user_id: string;
  stock_id: string;
  symbol: string;
  name: string;
  sector?: string;
  exchange?: string;
  added_price?: number;
  current_price?: number;
  pnl?: number;
  pnl_percentage?: number;
  added_at: string;
  notes?: string;
}

export interface WatchlistStats {
  total_stocks: number;
  positive_pnl_count: number;
  negative_pnl_count: number;
  no_price_data_count: number;
  total_pnl: number;
  average_pnl_percentage: number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true",  // ← mandatory
      ...(options?.headers || {}),
    },
  });
}

// ── Service ───────────────────────────────────────────────────────────────────

export class WatchlistService {

  // ── Fetch enriched watchlist ──────────────────────────────────────────────

  async fetchWatchlist(userId: string): Promise<WatchlistApiItem[]> {
    try {
      const res = await apiFetch(`/watchlist/${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WatchlistApiItem[] = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  // ── Add stock ─────────────────────────────────────────────────────────────

  async addToWatchlist(
    userId: string,
    symbol: string,
    addedPrice?: number,
    notes?: string
  ): Promise<WatchlistApiItem> {
    try {
      const res = await apiFetch(`/watchlist/?user_id=${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          ...(addedPrice != null && { added_price: addedPrice }),
          ...(notes != null && { notes }),
        }),
      });

      // 400 with "already exists" → fetch existing item and return it
      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        const msg: string = err.detail || '';
        if (msg.toLowerCase().includes('already')) {
          const existing = await this.fetchWatchlist(userId);
          const found = existing.find((w) => w.symbol === symbol.toUpperCase());
          if (found) return found;
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.detail)
  ? err.detail.map((d: any) => d.msg).join(', ')
  : err.detail;
throw new Error(detail || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  // ── Remove stock ──────────────────────────────────────────────────────────

  async removeFromWatchlist(userId: string, watchlistId: string): Promise<void> {
    try {
      const res = await apiFetch(
        `/watchlist/${watchlistId}?user_id=${userId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.detail)
  ? err.detail.map((d: any) => d.msg).join(', ')
  : err.detail;
throw new Error(detail || `HTTP ${res.status}`);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  // ── Remove by symbol (convenience — fetches ID first) ────────────────────

  async removeBySymbol(userId: string, symbol: string): Promise<void> {
    const watchlist = await this.fetchWatchlist(userId);
    const entry = watchlist.find((w) => w.symbol === symbol.toUpperCase());
    if (!entry) return; // already gone
    await this.removeFromWatchlist(userId, entry.id);
  }

  // ── Update entry (notes / added_price) ───────────────────────────────────

  async updateWatchlistEntry(
    userId: string,
    watchlistId: string,
    updates: { added_price?: number; notes?: string }
  ): Promise<WatchlistApiItem> {
    try {
      const res = await apiFetch(
        `/watchlist/${watchlistId}?user_id=${userId}`,
        { method: 'PATCH', body: JSON.stringify(updates) }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.detail)
  ? err.detail.map((d: any) => d.msg).join(', ')
  : err.detail;
throw new Error(detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error('Error updating watchlist entry:', error);
      throw error;
    }
  }

  // ── Bulk add ──────────────────────────────────────────────────────────────

  async bulkAdd(
    userId: string,
    symbols: string[],
    notes?: string
  ): Promise<WatchlistApiItem[]> {
    try {
      const res = await apiFetch(`/watchlist/bulk?user_id=${userId}`, {
        method: 'POST',
        body: JSON.stringify({ symbols: symbols.map((s) => s.toUpperCase()), notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = Array.isArray(err.detail)
  ? err.detail.map((d: any) => d.msg).join(', ')
  : err.detail;
throw new Error(detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error('Error bulk adding to watchlist:', error);
      throw error;
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<WatchlistStats> {
    try {
      const res = await apiFetch(`/watchlist/${userId}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching watchlist stats:', error);
      throw error;
    }
  }

  // ── Converters ────────────────────────────────────────────────────────────

  /** Backend enriched item → Zustand WatchlistItem */
  apiItemToWatchlistItem(item: WatchlistApiItem): WatchlistItem {
    return {
      symbol: item.symbol,
      name: item.name || item.symbol,
      type: 'stock',
      sector: item.sector,
      last_price: item.current_price ?? undefined,
      change_percent: item.pnl_percentage ?? 0,
    };
  }
}

// Export singleton
export const watchlistService = new WatchlistService();
export default watchlistService;