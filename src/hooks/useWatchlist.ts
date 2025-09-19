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
  const fetchWatchlist = useCallback(async () => {
    if (!user?.id) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const apiItems = await watchlistService.fetchWatchlist(user.id);
      const watchlistItems = apiItems.map(item => 
        watchlistService.apiItemToWatchlistItem(item)
      );
      
      setWatchlist(watchlistItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
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
      
      // Also refresh from server to ensure consistency
      await fetchWatchlist();
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

  // Initial fetch
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

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
