'use client';

import { useState, useEffect } from 'react';
import { indianStocksService } from '@/lib/services/indian-stocks-service';
import { WatchlistItem } from '@/lib/store/stock-store';

export default function TestStockService() {
  const [stocks, setStocks] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);

  const loadStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing stock service, live data enabled:', liveDataEnabled);
      
      // Update service configuration
      indianStocksService.updateConfig({ cacheTimeout: liveDataEnabled ? 30000 : 300000 });
      
      const stockData = await indianStocksService.getPopularStocks();
      console.log('Stock service returned:', stockData);
      setStocks(stockData);
    } catch (err) {
      console.error('Error testing stock service:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, [liveDataEnabled]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Stock Service Test
        </h1>
        
        <div className="mb-6">
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={liveDataEnabled}
              onChange={(e) => setLiveDataEnabled(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Enable Live Data
            </span>
          </label>
          
          <button
            onClick={loadStocks}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading stocks...</p>
          </div>
        )}

        <div className="grid gap-4">
          {stocks.map((stock) => (
            <div
              key={stock.symbol}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {stock.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    [{stock.symbol}] - {stock.sector}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ₹{stock.last_price?.toFixed(2) || 'N/A'}
                  </div>
                  <div className={`text-sm ${
                    (stock.change_percent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(stock.change_percent ?? 0) >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || '0.00'}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Debug Info:
          </h3>
          <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify({ 
              stockCount: stocks.length, 
              liveDataEnabled, 
              sampleStock: stocks[0] 
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

