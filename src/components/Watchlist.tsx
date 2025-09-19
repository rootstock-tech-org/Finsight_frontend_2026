import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Search, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useStockStore } from '@/lib/store/stock-store';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface WatchlistProps {
  darkMode: boolean;
  onBack?: () => void;
  onSelectMoreStocks?: () => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ darkMode, onBack, onSelectMoreStocks }) => {
  const { t } = useTranslation();
  const { userTier } = useStockStore();
  const { 
    watchlist, 
    loading: isLoading, 
    error, 
    removeFromWatchlist 
  } = useWatchlist();
  const [searchTerm, setSearchTerm] = useState('');

  const handleRemoveItem = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol);
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  // Filter items based on search term
  const filteredItems = watchlist.filter(item => {
    return searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Separate stocks and mutual funds
  const stocks = filteredItems.filter(item => item.type === 'stock');
  const mutualFunds = filteredItems.filter(item => item.type === 'mf');

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `₹${price.toFixed(2)}`;
  };

  const formatChange = (changePercent?: number) => {
    if (changePercent === undefined) return null;
    const isPositive = changePercent >= 0;
    const sign = isPositive ? '+' : '';
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    return <span className={`text-sm ${color}`}>{sign}{changePercent.toFixed(2)}%</span>;
  };

  const tierLimits = { FREE: 10, PREMIUM: 50, PRO: 100 } as const;
  const currentLimit = tierLimits[userTier as keyof typeof tierLimits] || 10;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Watchlist ({watchlist.length}/{currentLimit})
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              You will receive notifications for all stocks and mutual funds in your watchlist.
            </p>
          </div>
          {onSelectMoreStocks && (
            <Button onClick={onSelectMoreStocks} className="bg-blue-600 hover:bg-blue-700 text-white">
              Select More Stocks
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for stocks or mutual funds"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Loading watchlist...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="ml-4">
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stocks Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Stocks ({stocks.length})</h2>
            {stocks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No stocks in watchlist</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add stocks to start tracking them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stocks.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">[{item.symbol}]</p>
                      {item.last_price && (
                        <div className="mt-2">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatPrice(item.last_price)}</span>
                          {item.change_percent !== undefined && (<span className="ml-2">{formatChange(item.change_percent)}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">Stock</span>
                      <button onClick={() => handleRemoveItem(item.symbol)} className="p-1 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`Remove ${item.name} from watchlist`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mutual Funds Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mutual Funds ({mutualFunds.length})</h2>
            {mutualFunds.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No mutual funds in watchlist</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add mutual funds to start tracking them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mutualFunds.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">[{item.symbol}]</p>
                      {item.last_price && (
                        <div className="mt-2">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatPrice(item.last_price)}</span>
                          {item.change_percent !== undefined && (<span className="ml-2">{formatChange(item.change_percent)}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">MF</span>
                      <button onClick={() => handleRemoveItem(item.symbol)} className="p-1 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={`Remove ${item.name} from watchlist`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
