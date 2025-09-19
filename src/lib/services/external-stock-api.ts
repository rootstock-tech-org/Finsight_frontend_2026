/**
 * External Stock API Service
 * Integrates with the RunPod proxy stock API
 * Base URL: https://e9cwq4w7punvx7-1003.proxy.runpod.net
 */

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  sector?: string;
  industry?: string;
}

export interface StockPriceData {
  symbol: string;
  last_price: number | null;
  change?: number;
  change_percent?: number;
  volume?: number;
  market_cap?: number;
  high_52w?: number;
  low_52w?: number;
  open?: number;
  previous_close?: number;
  timestamp?: string;
  error?: string;
  // Additional fields from RunPod API
  day_change?: number;
  day_change_perc?: number;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  upper_circuit_limit?: number;
  lower_circuit_limit?: number;
  week_52_high?: number;
  week_52_low?: number;
}

export interface ExternalStockApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export class ExternalStockApiService {
  private config: ExternalStockApiConfig;

  constructor(config?: Partial<ExternalStockApiConfig>) {
    this.config = {
      baseUrl: 'https://e9cwq4w7punvx7-1003.proxy.runpod.net',
      timeout: 3000, // Reduced timeout to 3 seconds
      retries: 1, // Only 1 retry to avoid long delays
      ...config
    };
  }

  /**
   * Search for stocks by query
   * Uses server-side proxy to avoid CORS issues
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const startTime = performance.now();
    console.log(`🔍 [EXTERNAL-API] Starting stock search for query: "${query}"`);
    
    try {
      const url = '/api/external-stocks/search';
      const params = new URLSearchParams({ query });
      
      console.log(`🌐 [EXTERNAL-API] Making API call to: ${url}?${params}`);
      const apiStartTime = performance.now();
      
      const response = await this.fetchWithRetry(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const apiEndTime = performance.now();
      console.log(`⏱️ [EXTERNAL-API] API call completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      const parseStartTime = performance.now();
      const data = await response.json();
      const parseEndTime = performance.now();
      console.log(`📊 [EXTERNAL-API] JSON parsing completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
      
      // Handle error responses from our API
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Parse RunPod API search response format
      if (Array.isArray(data)) {
        const results = data.map((item: any) => ({
          symbol: item.symbol || '',
          name: item.name || '',
          exchange: item.exchange || 'NSE',
          type: item.type || 'stock',
          sector: item.industry || 'Unknown',
          industry: item.industry || 'Unknown'
        }));
        
        const endTime = performance.now();
        console.log(`✅ [EXTERNAL-API] Search completed successfully in ${(endTime - startTime).toFixed(2)}ms - Found ${results.length} results`);
        return results;
      }
      
      const endTime = performance.now();
      console.log(`⚠️ [EXTERNAL-API] Search completed in ${(endTime - startTime).toFixed(2)}ms - No results (data not array)`);
      return [];
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [EXTERNAL-API] Search failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw new Error(`Failed to search stocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get stock price by symbol
   * Uses server-side proxy to avoid CORS issues
   */
  async getStockPrice(symbol: string): Promise<StockPriceData> {
    const startTime = performance.now();
    console.log(`💰 [EXTERNAL-API] Starting price fetch for symbol: "${symbol}"`);
    
    try {
      const url = `/api/external-stocks/price/${encodeURIComponent(symbol)}`;
      
      console.log(`🌐 [EXTERNAL-API] Making price API call to: ${url}`);
      const apiStartTime = performance.now();
      
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const apiEndTime = performance.now();
      console.log(`⏱️ [EXTERNAL-API] Price API call completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      const parseStartTime = performance.now();
      const data = await response.json();
      const parseEndTime = performance.now();
      console.log(`📊 [EXTERNAL-API] Price JSON parsing completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
      
      // Handle error responses from our API
      if (data.error) {
        throw new Error(data.error);
      }

      // Parse RunPod API response format
      const result = {
        symbol: symbol.toUpperCase(),
        last_price: data.last_price || null,
        change: data.day_change || 0,
        change_percent: data.day_change_perc || 0,
        volume: data.volume || 0,
        market_cap: data.market_cap || null,
        open: data.ohlc?.open || null,
        previous_close: data.ohlc?.close || null,
        high_52w: data.week_52_high || null,
        low_52w: data.week_52_low || null,
        upper_circuit_limit: data.upper_circuit_limit || null,
        lower_circuit_limit: data.lower_circuit_limit || null,
        ohlc: data.ohlc || null,
        day_change: data.day_change || 0,
        day_change_perc: data.day_change_perc || 0,
        week_52_high: data.week_52_high || null,
        week_52_low: data.week_52_low || null,
        timestamp: new Date().toISOString()
      };
      
      const endTime = performance.now();
      console.log(`✅ [EXTERNAL-API] Price fetch completed in ${(endTime - startTime).toFixed(2)}ms - Price: ${result.last_price}, Change: ${result.change_percent}%`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [EXTERNAL-API] Price fetch failed after ${(endTime - startTime).toFixed(2)}ms for ${symbol}:`, error);
      throw new Error(`Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multiple stock prices in batch with better error handling
   */
  async getMultipleStockPrices(symbols: string[]): Promise<StockPriceData[]> {
    const startTime = performance.now();
    console.log(`💰💰 [EXTERNAL-API] Starting batch price fetch for ${symbols.length} symbols: [${symbols.join(', ')}]`);
    
    try {
      // Process in smaller batches to avoid overwhelming the API
      const batchSize = 5;
      const results: StockPriceData[] = [];
      
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const batchStartTime = performance.now();
        
        console.log(`📦 [EXTERNAL-API] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)}: [${batch.join(', ')}]`);
        
        const batchPromises = batch.map(symbol => 
          this.getStockPrice(symbol).catch(error => ({
            symbol: symbol.toUpperCase(),
            last_price: null,
            error: error.message
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        const batchEndTime = performance.now();
        console.log(`✅ [EXTERNAL-API] Batch ${Math.floor(i/batchSize) + 1} completed in ${(batchEndTime - batchStartTime).toFixed(2)}ms - Got ${batchResults.length} results`);
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < symbols.length) {
          console.log(`⏳ [EXTERNAL-API] Waiting 100ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const endTime = performance.now();
      const validResults = results.filter(r => r.last_price !== null);
      console.log(`✅ [EXTERNAL-API] Batch price fetch completed in ${(endTime - startTime).toFixed(2)}ms - ${validResults.length}/${symbols.length} successful`);
      return results;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [EXTERNAL-API] Batch price fetch failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw new Error(`Failed to fetch multiple stock prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search and get price in one call
   */
  async searchAndGetPrice(query: string): Promise<{ searchResults: StockSearchResult[], prices: StockPriceData[] }> {
    try {
      // First search for stocks
      const searchResults = await this.searchStocks(query);
      
      if (searchResults.length === 0) {
        return { searchResults: [], prices: [] };
      }

      // Extract symbols and get prices
      const symbols = searchResults.map(result => result.symbol);
      const prices = await this.getMultipleStockPrices(symbols);

      return { searchResults, prices };
    } catch (error) {
      console.error('Error in search and get price:', error);
      throw new Error(`Failed to search and get prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get popular stocks (commonly traded)
   */
  async getPopularStocks(): Promise<StockPriceData[]> {
    const popularSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
      'AMD', 'INTC', 'CRM', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SPOT'
    ];

    return this.getMultipleStockPrices(popularSymbols);
  }

  /**
   * Get market indices
   */
  async getMarketIndices(): Promise<StockPriceData[]> {
    const indices = [
      'SPY', 'QQQ', 'IWM', 'VTI', 'VEA', 'VWO', 'BND', 'GLD'
    ];

    return this.getMultipleStockPrices(indices);
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', message: string }> {
    try {
      const response = await this.fetchWithRetry('/api/external-stocks/search?query=test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        return { status: 'healthy', message: 'API is responding correctly' };
      } else {
        return { status: 'unhealthy', message: `API returned status ${response.status}` };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Fetch with retry logic and timeout
   */
  private async fetchWithRetry(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (retryCount < this.config.retries! && this.isRetryableError(error)) {
        console.log(`Retrying request (${retryCount + 1}/${this.config.retries}): ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return true;
    }
    if (error.message && error.message.includes('timeout')) {
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const externalStockApi = new ExternalStockApiService({
  // You can add API key here if needed
  // apiKey: process.env.EXTERNAL_STOCK_API_KEY
});

// Types are already exported above with the interface declarations