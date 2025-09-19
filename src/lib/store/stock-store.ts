import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  symbol: string;
  name: string;
  type: 'stock' | 'mf';
  sector?: string;
  industry?: string;
  last_price?: number;
  change_percent?: number;
}

interface StockState {
  selectedStocks: string[];
  selectedMutualFunds: string[];
  watchlist: WatchlistItem[];
  userTier: string;
  setSelectedStocks: (stocks: string[]) => void;
  setSelectedMutualFunds: (funds: string[]) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  setWatchlist: (items: WatchlistItem[]) => void;
  setUserTier: (tier: string) => void;
  clearWatchlist: () => void;
  loadWatchlistFromStorage: () => void;
  syncWithLocalStorage: () => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      selectedStocks: [],
      selectedMutualFunds: [],
      watchlist: [],
      userTier: 'FREE',
      setSelectedStocks: (stocks) => set({ selectedStocks: stocks }),
      setSelectedMutualFunds: (funds) => set({ selectedMutualFunds: funds }),
      addToWatchlist: (item) => {
        const { watchlist } = get();
        if (!watchlist.find(w => w.symbol === item.symbol)) {
          set({ watchlist: [...watchlist, item] });
        }
      },
      removeFromWatchlist: (symbol) => {
        const { watchlist } = get();
        set({ 
          watchlist: watchlist.filter(item => item.symbol !== symbol),
          selectedStocks: get().selectedStocks.filter(s => s !== symbol),
          selectedMutualFunds: get().selectedMutualFunds.filter(s => s !== symbol)
        });
      },
      setWatchlist: (items) => set({ watchlist: items }),
      setUserTier: (tier) => set({ userTier: tier }),
      clearWatchlist: () => set({ 
        watchlist: [], 
        selectedStocks: [], 
        selectedMutualFunds: [] 
      }),
      loadWatchlistFromStorage: () => {
        // This method can be used to reload watchlist from external sources
        const state = get();
        // Sync the watchlist with selected stocks and funds
        const updatedWatchlist: WatchlistItem[] = [];
        // This would be implemented when integrating with actual API
        console.log('Loading watchlist from storage');
      },
      syncWithLocalStorage: () => {
        // Sync current state with localStorage
        const state = get();
        try {
          const currentUser = localStorage.getItem('currentUser');
          if (currentUser) {
            localStorage.setItem(`selected_stocks_${currentUser}`, JSON.stringify(state.selectedStocks));
            localStorage.setItem(`selected_mutual_funds_${currentUser}`, JSON.stringify(state.selectedMutualFunds));
          }
        } catch (error) {
          // Handle case where localStorage is not available (e.g., SSR)
          console.warn('localStorage not available:', error);
        }
      },
    }),
    {
      name: 'stock-storage',
      partialize: (state) => ({ 
        selectedStocks: state.selectedStocks,
        selectedMutualFunds: state.selectedMutualFunds,
        watchlist: state.watchlist,
        userTier: state.userTier
      }),
    }
  )
); 