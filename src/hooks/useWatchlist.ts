import { useState, useEffect, useCallback } from 'react';
import { watchlistService, WatchlistApiItem } from '@/lib/services/watchlist-service';
import { WatchlistItem } from '@/lib/store/stock-store';
import { useAuthStore } from '@/lib/store/auth-store';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Fetch watchlist
  const fetchWatchlist = useCallback(async (background: boolean = false) => {
    if (!user?.id) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      if (!background) setLoading(true);
      setError(null);
      
      const apiItems = await watchlistService.fetchWatchlist(user.id);
      let watchlistItems = apiItems.map(item => watchlistService.apiItemToWatchlistItem(item));

      // Merge with local price cache for instant/consistent display
      try {
        const TTL_MS = 5 * 60 * 1000;
        watchlistItems = watchlistItems.map((wi) => {
          if (typeof wi.last_price === 'number' && wi.last_price > 0) return wi;
          const raw = localStorage.getItem(`price_cache_${wi.symbol}`);
          if (!raw) return wi;
          try {
            const cached = JSON.parse(raw) as { price: number; ts: number; changePercent?: number };
            if (cached && typeof cached.price === 'number' && Date.now() - (cached.ts || 0) <= TTL_MS) {
              return { ...wi, last_price: cached.price, change_percent: cached.changePercent ?? wi.change_percent };
            }
          } catch (_) {}
          return wi;
        });
      } catch (_) {}
      
      setWatchlist(watchlistItems);

      // Cache in localStorage for instant render on next visit
      try {
        const cacheKey = `watchlist_cache_${user.id}`;
        const payload = { ts: Date.now(), items: apiItems };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (_) {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      if (!background) setLoading(false);
    }
  }, [user?.id]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (
    symbol: string, 
    companyName?: string, 
    notes?: string
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Check local limit first to provide immediate feedback
    if (watchlist.length >= 10) {
      throw new Error('Watchlist limit reached. You can only add 10 stocks. Please remove one stock to add another.');
    }

    try {
      const newItem = await watchlistService.addToWatchlist(user.id, symbol, companyName, notes);
      
      // Update local state immediately
      const watchlistItem = watchlistService.apiItemToWatchlistItem(newItem);
      setWatchlist(prev => [watchlistItem, ...prev]);
      
      // Also refresh from server to ensure consistency (background, non-blocking)
      fetchWatchlist(true);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      throw err;
    }
  }, [user?.id, fetchWatchlist, watchlist.length]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (symbol: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      await watchlistService.removeFromWatchlist(user.id, symbol);
      
      // Update local state immediately
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      throw err;
    }
  }, [user?.id]);

  // Check if symbol is in watchlist
  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.some(item => item.symbol === symbol);
  }, [watchlist]);

  // Initial fetch with cache-first strategy
  useEffect(() => {
    if (!user?.id) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    // Try cache first
    let usedCache = false;
    try {
      const cacheKey = `watchlist_cache_${user.id}`;
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; items: any[] };
        if (parsed && Array.isArray(parsed.items)) {
          const cachedItems = parsed.items.map(item => watchlistService.apiItemToWatchlistItem(item));
          setWatchlist(cachedItems);
          setLoading(false);
          usedCache = true;
        }
      }
    } catch (_) {}

    // Always refresh in background; if no cache, do a foreground load
    if (usedCache) {
      fetchWatchlist(true);
    } else {
      fetchWatchlist(false);
    }
  }, [user?.id, fetchWatchlist]);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: fetchWatchlist
  };
}
