import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, ChevronRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useStockStore, WatchlistItem } from '@/lib/store/stock-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { searchStocks } from '@/lib/services/stock-service';
import { indianStocksService } from '@/lib/services/indian-stocks-service';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/LanguageContext';

interface StockSelectionProps {
  darkMode: boolean;
  onComplete: () => void;
}

const StockSelection: React.FC<StockSelectionProps> = ({ darkMode, onComplete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'stocks'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addingSymbols, setAddingSymbols] = useState<Set<string>>(new Set());
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);
  // Removed debouncing to search immediately as user types
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  
  const { userTier } = useStockStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  
  // Stock data state
  const [stocks, setStocks] = useState<WatchlistItem[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksError, setStocksError] = useState<string | null>(null);
  
  // Watchlist management
  const { 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist, 
    isInWatchlist,
    loading: watchlistLoading 
  } = useWatchlist();

  // Popular stocks will be fetched from the service
  const [popularStocks, setPopularStocks] = useState<WatchlistItem[]>([]);

  // Load popular stocks data
  const loadPopularStocks = async () => {
    const startTime = performance.now();
    console.log('🏆 [STOCK-SELECTION] Loading popular stocks, live data enabled:', liveDataEnabled);
    
    try {
      setStocksLoading(true);
      setStocksError(null);
      
      // 1) Render instantly with catalog (no prices)
      const catalog = indianStocksService.getPopularCatalog();
      setPopularStocks(catalog);
      setStocks(catalog);
      // Stop loading so UI renders list immediately
      setStocksLoading(false);
      console.log('⚡ [STOCK-SELECTION] Rendered catalog immediately:', catalog.length);

      // Price enrichment disabled during browsing/search to avoid external timeouts
      const apiEndTime = performance.now();
      console.log(`⏱️ [STOCK-SELECTION] Skipped price enrichment; rendered catalog in ${(apiEndTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [STOCK-SELECTION] Error loading popular stocks after ${(endTime - startTime).toFixed(2)}ms:`, error);
      setStocksError(error instanceof Error ? error.message : 'Failed to load stocks');
    } finally {
      setStocksLoading(false);
    }
  };

  useEffect(() => {
    loadPopularStocks();
  }, [liveDataEnabled]);

  // Refresh function
  const handleRefresh = async () => {
    const startTime = performance.now();
    console.log('🔄 [STOCK-SELECTION] Starting refresh...');
    
    setIsRefreshing(true);
    try {
      // Clear cache and reload data
      indianStocksService.clearCache();
      console.log('🗑️ [STOCK-SELECTION] Cache cleared');
      
      await loadPopularStocks();
      const endTime = performance.now();
      console.log(`✅ [STOCK-SELECTION] Refresh completed in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [STOCK-SELECTION] Error refreshing data after ${(endTime - startTime).toFixed(2)}ms:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };


  // Fetch stocks when search query changes
  useEffect(() => {
    const fetchStocks = async () => {
      const startTime = performance.now();
      console.log(`🔍 [STOCK-SELECTION] Starting search for query: "${searchQuery}"`);
      
      if (!searchQuery.trim()) {
        console.log('🔄 [STOCK-SELECTION] Empty query, using popular stocks');
        setStocks(popularStocks);
        const endTime = performance.now();
        console.log(`⚡ [STOCK-SELECTION] Popular stocks set in ${(endTime - startTime).toFixed(2)}ms`);
        return;
      }

      try {
        setStocksLoading(true);
        setStocksError(null);
        
        // 1) Get fast search results (no prices) and render immediately
        const results = await indianStocksService.searchStocks(searchQuery);
        setStocks(results);
        setStocksLoading(false);
        console.log(`⚡ [STOCK-SELECTION] Rendered ${results.length} search results (prices deferred)`);
      } catch (error) {
        const endTime = performance.now();
        console.error(`❌ [STOCK-SELECTION] Error fetching stocks after ${(endTime - startTime).toFixed(2)}ms:`, error);
        setStocksError(error instanceof Error ? error.message : 'Failed to fetch stocks');
        setStocks(popularStocks); // Fallback to popular stocks
        console.log('🔄 [STOCK-SELECTION] Falling back to popular stocks');
      } finally {
        setStocksLoading(false);
      }
    };

    // Run search immediately on each input change
    void fetchStocks();
    return () => {};
  }, [searchQuery, popularStocks]);

  // Search results with deduplication
  const searchResults = useMemo(() => {
    if (stocksLoading) return [];
    console.log(`🎨 [STOCK-SELECTION] Rendering ${stocks.length} stocks in UI`);
    return stocks;
  }, [stocks, stocksLoading]);

  const handleAdd = async (item: WatchlistItem) => {
    try {
      setWatchlistError(null); // Clear any previous errors
      // Optimistically mark as adding for this symbol only
      setAddingSymbols(prev => new Set(prev).add(item.symbol));
      await addToWatchlist(item.symbol, item.name);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to watchlist';
      setWatchlistError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setWatchlistError(null), 5000);
    } finally {
      setAddingSymbols(prev => {
        const next = new Set(prev);
        next.delete(item.symbol);
        return next;
      });
    }
  };

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const filteredResults = useMemo(() => {
    return searchResults.filter(item => item.type === 'stock');
  }, [searchResults]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Build Your Stock Watchlist
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">
            Select stocks you&apos;re interested in to get personalized insights. You can always modify this later.
          </p>
          
          {/* Watchlist Count Indicator */}
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {watchlist.length}/10 stocks in watchlist
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for stocks or mutual funds"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {/* No debounce indicator; searching happens immediately */}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('stocks')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'stocks'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Stocks
            </button>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing || stocksLoading}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {stocksLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading stocks...</p>
          </div>
        )}

        {/* Error State */}
        {stocksError && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error loading stocks: {stocksError}</p>
          </div>
        )}

        {/* Watchlist Error State */}
        {watchlistError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Watchlist Limit Reached
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>{watchlistError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Cards */}
        <div className="space-y-3 mb-8">
          {filteredResults.map((item) => {
            const inWatchlist = isInWatchlist(item.symbol);
            const isPositive = (item.change_percent ?? 0) > 0;
            
            return (
              <div
                key={`${item.symbol}-${item.type}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      [{item.symbol}]
                    </p>
                    {item.sector && (
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 truncate">
                        {item.sector}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
                    {/* Do not show price in selection; only labels and Add/Remove */}
                    <div className="text-left sm:text-right" />
                    
                    {/* Tags */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                        {item.type === 'stock' ? 'Stock' : 'MF'}
                      </span>
                      {/* Sector pill removed to avoid duplication with left-side sector text */}
                    </div>
                    
                    {/* Add/Remove Button */}
                    <button
                      onClick={() => inWatchlist ? handleRemove(item.symbol) : handleAdd(item)}
                      disabled={(!inWatchlist && (watchlist.length >= 10 || addingSymbols.has(item.symbol)))}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
                        inWatchlist
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                          : watchlist.length >= 10
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 cursor-not-allowed'
                          : addingSymbols.has(item.symbol)
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                      title={!inWatchlist && watchlist.length >= 10 ? 'Watchlist limit reached (10/10)' : ''}
                    >
                      {inWatchlist ? 'Added' : (
                        addingSymbols.has(item.symbol)
                          ? <span className="inline-flex items-center"><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></span>Adding</span>
                          : <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            variant="outline"
            onClick={onComplete}
            className="flex-1 sm:flex-none px-8 py-3 text-base font-medium border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Skip for Now
          </Button>
          <Button
            onClick={onComplete}
            className="flex-1 sm:flex-none px-8 py-3 text-base font-medium bg-gray-600 hover:bg-gray-700 text-white"
          >
            Continue
          </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            You can always add stocks later from the &quot;My Stocks&quot; page
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockSelection;
