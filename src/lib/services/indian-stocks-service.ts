/**
 * Indian Stocks Service
 * Fetches live data for popular Indian stocks
 */

import { WatchlistItem } from '@/lib/store/stock-store';
import { runPodApiService, RunPodStockData } from './runpod-api-service';
import { externalStockApi } from './external-stock-api';

// Popular Indian stock symbols
const POPULAR_INDIAN_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Limited', sector: 'Oil & Gas' },
  { symbol: 'JIOFIN', name: 'Jio Financial Services Limited', sector: 'Financial Services' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', sector: 'Automobile' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Banking' },
  { symbol: 'ETERNAL', name: 'ETERNAL LIMITED', sector: 'Technology' },
  { symbol: 'BEL', name: 'Bharat Electronics Limited', sector: 'Defense' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Limited', sector: 'Information Technology' },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'Information Technology' },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'Information Technology' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Limited', sector: 'Information Technology' },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'Consumer Goods' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', sector: 'Automobile' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', sector: 'Financial Services' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecommunications' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', sector: 'Consumer Goods' },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', sector: 'Consumer Goods' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', sector: 'Cement' },
  { symbol: 'TITAN', name: 'Titan Company Limited', sector: 'Consumer Goods' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited', sector: 'Pharmaceuticals' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Limited', sector: 'Pharmaceuticals' }
];


export interface IndianStocksServiceConfig {
  cacheTimeout: number; // in milliseconds
}

export class IndianStocksService {
  private config: IndianStocksServiceConfig;
  private cache: Map<string, { data: WatchlistItem[], timestamp: number }> = new Map();

  constructor(config?: Partial<IndianStocksServiceConfig>) {
    this.config = {
      cacheTimeout: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Get popular Indian stocks with live data from RunPod API
   */
  async getPopularStocks(): Promise<WatchlistItem[]> {
    const startTime = performance.now();
    console.log(`🏆 [INDIAN-STOCKS] Starting popular stocks fetch`);
    
    const cacheKey = 'popular_stocks';
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      const endTime = performance.now();
      console.log(`⚡ [INDIAN-STOCKS] Returning cached stock data (${cached.data.length} stocks) in ${(endTime - startTime).toFixed(2)}ms`);
      return cached.data;
    }

    console.log('🔄 [INDIAN-STOCKS] Cache expired, fetching live stock data from RunPod API...');
    
    try {
      const liveData = await this.fetchLiveStockDataFromRunPod();
      this.cache.set(cacheKey, { data: liveData, timestamp: Date.now() });
      const endTime = performance.now();
      console.log(`✅ [INDIAN-STOCKS] Live stock data fetched successfully in ${(endTime - startTime).toFixed(2)}ms: ${liveData.length} stocks`);
      return liveData;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [INDIAN-STOCKS] Error fetching live stock data after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Return a fast catalog of popular stocks without waiting for live prices.
   * Useful to render UI instantly while background enrichment runs.
   */
  getPopularCatalog(): WatchlistItem[] {
    return POPULAR_INDIAN_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      type: 'stock' as const,
      sector: s.sector,
      last_price: undefined,
      change_percent: undefined as unknown as number
    }));
  }

  /**
   * Enrich a list of items with prices incrementally and call onUpdate per symbol
   */
  async enrichPrices(
    items: Pick<WatchlistItem, 'symbol'>[],
    onUpdate: (symbol: string, price: number, changePercent: number) => void,
    options: { concurrency?: number } = {}
  ): Promise<void> {
    // Reduce concurrency to be gentle on the external API and avoid aborts
    const concurrency = Math.max(1, Math.min(options.concurrency ?? 2, 3));
    const queue = [...items.map(i => i.symbol)];
    const workers: Promise<void>[] = [];
    const worker = async () => {
      while (queue.length) {
        const symbol = queue.shift();
        if (!symbol) break;
        try {
          const { last_price, change_percent } = await this.getStockPrice(symbol);
          if (last_price > 0) onUpdate(symbol, last_price, change_percent || 0);
        } catch (e) {
          // Ignore expected abort/timeout errors quietly
          if (e && (e as any).name === 'AbortError') {
            continue;
          }
        }
      }
    };
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);
  }

  /**
   * Fetch live stock data from RunPod API
   */
  private async fetchLiveStockDataFromRunPod(): Promise<WatchlistItem[]> {
    const startTime = performance.now();
    console.log('🔄 [INDIAN-STOCKS] Fetching stock data from RunPod API...');
    
    try {
      const runPodData = await runPodApiService.getPopularStocks();
      const apiEndTime = performance.now();
      console.log(`⏱️ [INDIAN-STOCKS] RunPod API call completed in ${(apiEndTime - startTime).toFixed(2)}ms`);
      
      // Check if we got any valid data
      const validData = runPodData.filter(item => item.last_price && item.last_price > 0);
      
      if (validData.length === 0) {
        const endTime = performance.now();
        console.log(`⚠️ [INDIAN-STOCKS] No valid data received from RunPod API after ${(endTime - startTime).toFixed(2)}ms - API may be returning null values`);
        return [];
      }
      
      // Convert RunPod data to WatchlistItem format
      const convertStartTime = performance.now();
      const stocksWithPrices: WatchlistItem[] = validData.map(item => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        type: item.type,
        sector: item.sector || 'Unknown',
        last_price: item.last_price,
        change_percent: item.change_percent
      }));
      const convertEndTime = performance.now();
      console.log(`🔄 [INDIAN-STOCKS] Data conversion completed in ${(convertEndTime - convertStartTime).toFixed(2)}ms`);

      const endTime = performance.now();
      console.log(`✅ [INDIAN-STOCKS] Successfully converted RunPod data in ${(endTime - startTime).toFixed(2)}ms: ${stocksWithPrices.length} items`);
      return stocksWithPrices;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [INDIAN-STOCKS] Error fetching live stock data after ${(endTime - startTime).toFixed(2)}ms:`, error);
      console.log('🔄 [INDIAN-STOCKS] Returning empty array due to API error');
      return [];
    }
  }

  /**
   * Fetch live stock data from external API (fallback)
   */
  private async fetchLiveStockData(): Promise<WatchlistItem[]> {
    const symbols = POPULAR_INDIAN_STOCKS.map(stock => stock.symbol);
    
    try {
      // Fetch prices for all symbols with timeout handling
      const priceData = await externalStockApi.getMultipleStockPrices(symbols);
      
      // Check if we got any valid price data
      const validPriceData = priceData.filter(p => p.last_price && p.last_price > 0);
      
      if (validPriceData.length === 0) {
        console.log('No valid price data received, falling back to mock data');
        throw new Error('No valid price data received');
      }
      
      // Combine stock info with price data
      const stocksWithPrices: WatchlistItem[] = POPULAR_INDIAN_STOCKS.map(stockInfo => {
        const priceInfo = priceData.find(p => p.symbol === stockInfo.symbol);
        
        return {
          symbol: stockInfo.symbol,
          name: stockInfo.name,
          type: 'stock' as const,
          sector: stockInfo.sector,
          last_price: priceInfo?.last_price || 0,
          change_percent: priceInfo?.change_percent || 0
        };
      });

      return stocksWithPrices;
    } catch (error) {
      console.error('Error fetching live stock data:', error);
      throw error;
    }
  }

  /**
   * Get mock stock data (fallback)
   */
  private getMockStockData(): WatchlistItem[] {
    console.log('Generating mock stock data...');
    
    // Realistic price ranges for Indian stocks
    const priceRanges: { [key: string]: { min: number; max: number } } = {
      'RELIANCE': { min: 2000, max: 3000 },
      'JIOFIN': { min: 150, max: 300 },
      'TATAMOTORS': { min: 600, max: 1200 },
      'HDFCBANK': { min: 1400, max: 1800 },
      'ETERNAL': { min: 400, max: 600 },
      'BEL': { min: 100, max: 200 },
      'TCS': { min: 3000, max: 4000 },
      'INFY': { min: 1200, max: 1800 },
      'WIPRO': { min: 400, max: 600 },
      'HCLTECH': { min: 1000, max: 1500 },
      'ITC': { min: 400, max: 600 },
      'MARUTI': { min: 8000, max: 12000 },
      'BAJFINANCE': { min: 6000, max: 8000 },
      'BHARTIARTL': { min: 800, max: 1200 },
      'ASIANPAINT': { min: 2500, max: 3500 },
      'NESTLEIND': { min: 15000, max: 20000 },
      'ULTRACEMCO': { min: 6000, max: 8000 },
      'TITAN': { min: 2500, max: 3500 },
      'SUNPHARMA': { min: 800, max: 1200 },
      'DRREDDY': { min: 4000, max: 6000 }
    };

    const mockData = POPULAR_INDIAN_STOCKS.map(stock => {
      const range = priceRanges[stock.symbol] || { min: 100, max: 2000 };
      const basePrice = range.min + Math.random() * (range.max - range.min);
      const changePercent = (Math.random() - 0.5) * 8; // -4% to +4%
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        type: 'stock' as const,
        sector: stock.sector,
        last_price: Math.round(basePrice * 100) / 100, // Round to 2 decimal places
        change_percent: Math.round(changePercent * 100) / 100 // Round to 2 decimal places
      };
    });

    console.log('Mock data generated:', mockData.length, 'stocks');
    console.log('Sample mock data:', mockData.slice(0, 3));
    return mockData;
  }


  /**
   * Search stocks by query using RunPod API
   */
  async searchStocks(query: string): Promise<WatchlistItem[]> {
    const startTime = performance.now();
    console.log(`🔍 [INDIAN-STOCKS] Starting stock search for query: "${query}"`);
    
    if (!query.trim()) {
      console.log('🔄 [INDIAN-STOCKS] Empty query, returning popular stocks...');
      return this.getPopularStocks();
    }

    // 1) Try super-fast local CSV search for name/symbol
    try {
      const url = `/api/local-stocks/search?query=${encodeURIComponent(query)}&limit=50`;
      console.log('🔍 [INDIAN-STOCKS] Trying local CSV search at:', url);
      const res = await fetch(url);
      if (res.ok) {
        const data: { results: { symbol: string; name: string }[] } = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          const csvItems: WatchlistItem[] = data.results.map(item => ({
            symbol: item.symbol,
            name: item.name || item.symbol,
            type: 'stock' as const,
            sector: 'Unknown',
            last_price: undefined,
            change_percent: undefined as unknown as number
          }));
          const endTime = performance.now();
          console.log(`✅ [INDIAN-STOCKS] Local CSV search returned ${csvItems.length} results in ${(endTime - startTime).toFixed(2)}ms`);
          return csvItems;
        }
      }
    } catch (e) {
      console.log('⚠️ [INDIAN-STOCKS] Local CSV search failed, falling back to RunPod search');
    }

    console.log('🔍 [INDIAN-STOCKS] Searching stocks using RunPod API...');
    
    try {
      // Use RunPod API for search (names/symbols only for fast return)
      const searchResults = await runPodApiService.search(query);
      const searchEndTime = performance.now();
      console.log(`⏱️ [INDIAN-STOCKS] RunPod search completed in ${(searchEndTime - startTime).toFixed(2)}ms`);
      
      // Convert to WatchlistItem format
      const convertStartTime = performance.now();
      const stockItems: WatchlistItem[] = searchResults.map(item => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        type: 'stock' as const,
        sector: item.sector || 'Unknown',
        last_price: undefined,
        change_percent: undefined as unknown as number
      }));
      const convertEndTime = performance.now();
      console.log(`🔄 [INDIAN-STOCKS] Data conversion completed in ${(convertEndTime - convertStartTime).toFixed(2)}ms`);

      const endTime = performance.now();
      console.log(`✅ [INDIAN-STOCKS] Search results from RunPod API in ${(endTime - startTime).toFixed(2)}ms: ${stockItems.length} items`);
      return stockItems;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [INDIAN-STOCKS] Error searching stocks after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  }


  /**
   * Get stock price for a specific symbol using RunPod API
   */
  async getStockPrice(symbol: string): Promise<{ last_price: number; change_percent: number }> {
    try {
      const priceData = await runPodApiService.getPrice(symbol);
      if (!priceData) {
        throw new Error(`No price data found for ${symbol}`);
      }
      return {
        last_price: priceData.last_price || 0,
        change_percent: priceData.change_percent || 0
      };
    } catch (error) {
      console.error(`Error fetching live price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IndianStocksServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const indianStocksService = new IndianStocksService({
  cacheTimeout: 30000
});

// Types already exported via interface declaration above
