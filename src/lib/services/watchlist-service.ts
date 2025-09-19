import { supabase } from '@/lib/supabase';
import { WatchlistItem } from '@/lib/store/stock-store';

export interface WatchlistApiItem {
  id: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  notes?: string;
  added_at: string;
  created_at: string;
  updated_at: string;
  stocks?: {
    symbol: string;
    company_name: string;
    current_price: number;
    price_change_percent: number;
    sector: string;
  };
}

export class WatchlistService {
  // Fetch user's watchlist
  async fetchWatchlist(userId: string): Promise<WatchlistApiItem[]> {
    try {
      const response = await fetch(`/api/watchlist?user_id=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Return as-is without fetching prices to ensure instant list render
      return data.watchlist || [];
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  // Add stock to watchlist
  async addToWatchlist(
    userId: string, 
    symbol: string, 
    companyName?: string, 
    notes?: string
  ): Promise<WatchlistApiItem> {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          symbol,
          company_name: companyName,
          notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Fetch price only for the newly added symbol so it can show immediately
      try {
        const priceRes = await fetch(`/api/external-stocks/price/${encodeURIComponent(symbol)}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          return {
            ...data.item,
            stocks: {
              symbol,
              company_name: companyName || symbol,
              current_price: Number(priceData?.last_price) || 0,
              price_change_percent: Number(priceData?.day_change_perc) || 0,
              sector: data.item?.stocks?.sector || 'Unknown'
            }
          } as WatchlistApiItem;
        }
      } catch (e) {
        // Non-fatal; return item without price
      }

      return data.item;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  // Remove stock from watchlist
  async removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    try {
      const response = await fetch(`/api/watchlist?user_id=${userId}&symbol=${symbol}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  // Convert WatchlistApiItem to WatchlistItem
  apiItemToWatchlistItem(item: WatchlistApiItem): WatchlistItem {
    return {
      symbol: item.symbol,
      name: item.company_name || item.stocks?.company_name || item.symbol,
      type: 'stock',
      sector: item.stocks?.sector,
      last_price: typeof item.stocks?.current_price === 'number' && item.stocks.current_price > 0 ? item.stocks.current_price : undefined,
      change_percent: item.stocks?.price_change_percent || 0
    };
  }

  // Fetch current prices for watchlist items
  async fetchCurrentPrices(watchlistItems: WatchlistApiItem[]): Promise<WatchlistApiItem[]> {
    const itemsWithPrices = await Promise.all(
      watchlistItems.map(async (item) => {
        // If we already have price data, return as is
        if (item.stocks?.current_price && item.stocks.current_price > 0) {
          return item;
        }

        // Try to fetch current price from external API
        try {
          const response = await fetch(`/api/external-stocks/price/${item.symbol}`);
          if (response.ok) {
            const priceData = await response.json();
            return {
              ...item,
              stocks: {
                ...item.stocks,
                symbol: item.symbol,
                company_name: item.company_name || item.symbol,
                current_price: priceData.last_price || 0,
                price_change_percent: priceData.day_change_perc || 0,
                sector: item.stocks?.sector || 'Unknown'
              }
            };
          }
        } catch (error) {
          console.error(`Error fetching price for ${item.symbol}:`, error);
        }

        return item;
      })
    );

    return itemsWithPrices;
  }

  // Convert WatchlistItem to WatchlistApiItem
  watchlistItemToApiItem(item: WatchlistItem, userId: string): Partial<WatchlistApiItem> {
    return {
      user_id: userId,
      symbol: item.symbol,
      company_name: item.name,
      notes: ''
    };
  }
}

// Export singleton instance
export const watchlistService = new WatchlistService();
