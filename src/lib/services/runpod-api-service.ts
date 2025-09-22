/**
 * RunPod API Service
 * Fetches both stock and mutual fund data from the RunPod API
 * Base URL: https://e9cwq4w7punvx7-1003.proxy.runpod.net
 */

export interface RunPodStockData {
  symbol: string;
  name: string;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  upper_circuit_limit?: number;
  lower_circuit_limit?: number;
  week_52_high?: number;
  week_52_low?: number;
  timestamp: string;
  type: 'stock' | 'mf';
  sector?: string;
  industry?: string;
}

export interface RunPodApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

// Circuit Breaker State
enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state = CircuitBreakerState.CLOSED;
  
  constructor(
    private threshold: number = 3,
    private resetTime: number = 30000 // 30 seconds
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTime) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log('🔄 [RUNPOD-CIRCUIT-BREAKER] Moving to HALF_OPEN state');
      } else {
        throw new Error('RunPod API circuit breaker is OPEN - failing fast');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitBreakerState.OPEN;
      console.log(`🔴 [RUNPOD-CIRCUIT-BREAKER] Moving to OPEN state after ${this.failureCount} failures`);
    }
  }

  getState() {
    return this.state;
  }
}

// Mock data for Indian stocks when RunPod API is down
const MOCK_RUNPOD_DATA: Record<string, Pick<RunPodStockData, 'symbol' | 'name' | 'type' | 'sector' | 'industry'>> = {
  'RELIANCE': {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    type: 'stock',
    sector: 'Energy',
    industry: 'Oil & Gas'
  },
  'TCS': {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    type: 'stock',
    sector: 'Technology',
    industry: 'IT Services'
  },
  // Add more stocks as needed...
};

export class RunPodApiService {
  private config: RunPodApiConfig;
  private circuitBreaker: CircuitBreaker;

  constructor(config?: Partial<RunPodApiConfig>) {
    this.config = {
      baseUrl: '', // Use relative URLs to proxy through our API
      timeout: 3000, // Reduced from 10000 to 3000
      retries: 1,    // Reduced from 2 to 1
      ...config
    };
    this.circuitBreaker = new CircuitBreaker(this.config.retries, this.config.timeout * 2); // Adjust threshold and reset time
  }

  /**
   * Search for stocks and mutual funds
   */
  async search(query: string): Promise<RunPodStockData[]> {
    const startTime = performance.now();
    console.log(`🔍 [RUNPOD-API] Starting search for query: "${query}"`);
    
    try {
      const result = await this.circuitBreaker.call(async () => {
        const url = `/api/external-stocks/search?query=${encodeURIComponent(query)}`;
        console.log(`🌐 [RUNPOD-API] Making search API call to: ${url}`);
        
        const apiStartTime = performance.now();
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const apiEndTime = performance.now();
        console.log(`⏱️ [RUNPOD-API] Search API call completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

        const parseStartTime = performance.now();
        const data = await response.json();
        const parseEndTime = performance.now();
        console.log(`📊 [RUNPOD-API] Search JSON parsing completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
        
        // Parse search results - API returns array directly
        if (Array.isArray(data)) {
          const results = data.map((item: any) => ({
            symbol: item.symbol || '',
            name: item.name || '',
            last_price: 0, // Will be fetched separately
            change: 0,
            change_percent: 0,
            volume: 0,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            timestamp: new Date().toISOString(),
            type: this.determineType(item.symbol, item.name),
            sector: item.industry || 'Unknown',
            industry: item.industry || 'Unknown'
          }));
          
          const endTime = performance.now();
          console.log(`✅ [RUNPOD-API] Search completed in ${(endTime - startTime).toFixed(2)}ms - Found ${results.length} results`);
          return results;
        }

        const endTime = performance.now();
        console.log(`⚠️ [RUNPOD-API] Search completed in ${(endTime - startTime).toFixed(2)}ms - No results (data not array)`);
        return [];
      });

      return result;
    } catch (error) {
      console.warn(`⚠️ [RUNPOD-API] Search failed, using mock data:`, error);
      
      // Return mock search results
      const mockResults = Object.values(MOCK_RUNPOD_DATA)
        .filter(item => 
          item.symbol.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase())
        );
      
      return mockResults.map(item => ({
        ...item,
        last_price: 0,
        change: 0,
        change_percent: 0,
        volume: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Get price data for a symbol (stock or mutual fund)
   */
  async getPrice(symbol: string): Promise<RunPodStockData | null> {
    const startTime = performance.now();
    console.log(`💰 [RUNPOD-API] Starting price fetch for symbol: "${symbol}"`);
    
    try {
      const url = `/api/external-stocks/price/${encodeURIComponent(symbol)}`;
      console.log(`🌐 [RUNPOD-API] Making price API call to: ${url}`);
      
      const apiStartTime = performance.now();
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const apiEndTime = performance.now();
      console.log(`⏱️ [RUNPOD-API] Price API call completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      const parseStartTime = performance.now();
      const data = await response.json();
      const parseEndTime = performance.now();
      console.log(`📊 [RUNPOD-API] Price JSON parsing completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Check if we have valid price data - if all fields are null, return null
      if (data.last_price === null && data.day_change === null && data.day_change_perc === null) {
        const endTime = performance.now();
        console.warn(`⚠️ [RUNPOD-API] No valid price data for ${symbol} after ${(endTime - startTime).toFixed(2)}ms - API returned null values`);
        return null;
      }

      // Parse price data
      const result = {
        symbol: symbol.toUpperCase(),
        name: '', // Will be filled by search
        last_price: data.last_price || 0,
        change: data.day_change || 0,
        change_percent: data.day_change_perc || 0,
        volume: data.volume || 0,
        market_cap: data.market_cap || 0,
        open: data.ohlc?.open || 0,
        high: data.ohlc?.high || 0,
        low: data.ohlc?.low || 0,
        close: data.ohlc?.close || 0,
        upper_circuit_limit: data.upper_circuit_limit || undefined,
        lower_circuit_limit: data.lower_circuit_limit || undefined,
        week_52_high: data.week_52_high || undefined,
        week_52_low: data.week_52_low || undefined,
        timestamp: new Date().toISOString(),
        type: this.determineType(symbol, ''),
        sector: 'Unknown',
        industry: 'Unknown'
      };
      
      const endTime = performance.now();
      console.log(`✅ [RUNPOD-API] Price fetch completed in ${(endTime - startTime).toFixed(2)}ms - Price: ${result.last_price}, Change: ${result.change_percent}%`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`⏰ [RUNPOD-API] Price fetch timeout/abort after ${(endTime - startTime).toFixed(2)}ms for ${symbol}`);
        return null;
      }
      console.error(`❌ [RUNPOD-API] Price fetch failed after ${(endTime - startTime).toFixed(2)}ms for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple prices in batch
   */
  async getMultiplePrices(symbols: string[]): Promise<RunPodStockData[]> {
    const startTime = performance.now();
    console.log(`💰💰 [RUNPOD-API] Starting batch price fetch for ${symbols.length} symbols: [${symbols.join(', ')}]`);
    
    const results: RunPodStockData[] = [];
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 3;
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchStartTime = performance.now();
      
      console.log(`📦 [RUNPOD-API] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)}: [${batch.join(', ')}]`);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const priceData = await this.getPrice(symbol);
          return priceData;
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter((item): item is RunPodStockData => item !== null);
      results.push(...validResults);
      
      const batchEndTime = performance.now();
      console.log(`✅ [RUNPOD-API] Batch ${Math.floor(i/batchSize) + 1} completed in ${(batchEndTime - batchStartTime).toFixed(2)}ms - Got ${validResults.length}/${batch.length} valid results`);
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        console.log(`⏳ [RUNPOD-API] Waiting 200ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const endTime = performance.now();
    console.log(`✅ [RUNPOD-API] Batch price fetch completed in ${(endTime - startTime).toFixed(2)}ms - ${results.length}/${symbols.length} successful`);
    return results;
  }

  /**
   * Get popular Indian stocks
   */
  async getPopularStocks(): Promise<RunPodStockData[]> {
    const startTime = performance.now();
    console.log(`🏆 [RUNPOD-API] Starting popular stocks fetch`);
    
    // Try to get stocks using search first, as it might return more reliable data
    try {
      console.log('🔍 [RUNPOD-API] Trying to get popular stocks via search...');
      const searchQueries = ['RELIANCE', 'TCS', 'HDFC', 'INFY', 'TATA', 'JIO'];
      const allSearchResults: RunPodStockData[] = [];
      
      for (const query of searchQueries) {
        try {
          const searchResults = await this.search(query);
          allSearchResults.push(...searchResults);
        } catch (error) {
          console.warn(`⚠️ [RUNPOD-API] Search failed for ${query}:`, error);
        }
      }
      
      // Remove duplicates based on symbol
      const uniqueResults = allSearchResults.filter((item, index, self) => 
        index === self.findIndex(t => t.symbol === item.symbol)
      );
      
      if (uniqueResults.length > 0) {
        const endTime = performance.now();
        console.log(`✅ [RUNPOD-API] Found ${uniqueResults.length} unique stocks via search in ${(endTime - startTime).toFixed(2)}ms`);
        return uniqueResults.slice(0, 20); // Limit to 20 stocks
      }
    } catch (error) {
      console.warn('⚠️ [RUNPOD-API] Search method failed, trying individual price lookups:', error);
    }

    // Fallback to individual price lookups
    console.log('💰 [RUNPOD-API] Falling back to individual price lookups...');
    const stockSymbols = [
      'RELIANCE', 'JIOFIN', 'TATAMOTORS', 'HDFCBANK', 'ETERNAL', 'BEL',
      'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'ITC', 'MARUTI', 'BAJFINANCE',
      'BHARTIARTL', 'ASIANPAINT', 'NESTLEIND', 'ULTRACEMCO', 'TITAN',
      'SUNPHARMA', 'DRREDDY'
    ];

    const results = await this.getMultiplePrices(stockSymbols);
    
    // If we don't get enough valid data, return empty array to trigger fallback
    if (results.length < 3) {
      const endTime = performance.now();
      console.warn(`⚠️ [RUNPOD-API] Insufficient valid data from external API after ${(endTime - startTime).toFixed(2)}ms, returning empty array for fallback`);
      return [];
    }
    
    const endTime = performance.now();
    console.log(`✅ [RUNPOD-API] Popular stocks fetch completed in ${(endTime - startTime).toFixed(2)}ms - Got ${results.length} stocks`);
    return results;
  }


  /**
   * Search and get prices in one call
   */
  async searchAndGetPrices(query: string): Promise<RunPodStockData[]> {
    try {
      // First search for items
      const searchResults = await this.search(query);
      
      if (searchResults.length === 0) {
        return [];
      }

      // Get prices for the search results
      const symbols = searchResults.map(item => item.symbol);
      const priceData = await this.getMultiplePrices(symbols);
      
      // Merge search results with price data
      return searchResults.map(searchItem => {
        const priceItem = priceData.find(p => p.symbol === searchItem.symbol);
        if (priceItem) {
          return {
            ...searchItem,
            ...priceItem,
            name: searchItem.name || priceItem.name,
            sector: searchItem.sector || priceItem.sector,
            industry: searchItem.industry || priceItem.industry
          } as RunPodStockData;
        }
        return searchItem;
      });
    } catch (error) {
      console.error('Error in search and get prices:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out or was cancelled';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error occurred';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(`Failed to search and get prices: ${errorMessage}`);
    }
  }

  /**
   * Determine if a symbol is a stock (always returns stock)
   */
  private determineType(symbol: string, name: string): 'stock' | 'mf' {
    return 'stock';
  }

  /**
   * Fetch with retry logic and timeout
   */
  private async fetchWithRetry(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    try {
      // Set up timeout
      timeoutId = setTimeout(() => {
        console.log(`⏰ [RUNPOD-API] Request timeout after ${this.config.timeout}ms for ${url}`);
        controller.abort();
      }, this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      // Clear timeout if request completes successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Check if this was a timeout or manual abort
          const isTimeout = retryCount === 0; // First attempt timeout
          if (isTimeout) {
            console.log(`⏰ [RUNPOD-API] Request timed out after ${this.config.timeout}ms for ${url}`);
            const e = new Error(`Request timeout after ${this.config.timeout}ms`);
            (e as any).name = 'AbortError';
            error = e;
          } else {
            console.log(`🚫 [RUNPOD-API] Request was aborted for ${url}`);
            const e = new Error('Request was aborted');
            (e as any).name = 'AbortError';
            error = e;
          }
        }
      }

      if (retryCount < this.config.retries && this.isRetryableError(error)) {
        console.log(`🔄 [RUNPOD-API] Retrying request (${retryCount + 1}/${this.config.retries}): ${url}`);
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
    // Don't retry AbortError as it's usually a timeout or intentional abort
    if (error.name === 'AbortError') {
      return false;
    }
    
    // Retry timeout errors and network issues
    if (error.name === 'TimeoutError') {
      return true;
    }
    
    // Retry network-related errors
    if (error.message && (
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('fetch')
    )) {
      return true;
    }
    
    // Retry 5xx server errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    return false;
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', message: string }> {
    try {
      const response = await this.fetchWithRetry(`/api/external-stocks/search?query=test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        return { status: 'healthy', message: 'RunPod API is responding correctly' };
      } else {
        return { status: 'unhealthy', message: `API returned status ${response.status}` };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'API request timed out';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'API request timed out';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error connecting to API';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        status: 'unhealthy', 
        message: `API health check failed: ${errorMessage}` 
      };
    }
  }
}

// Export singleton instance
export const runPodApiService = new RunPodApiService({
  timeout: 3000, // Reduced from 10000 to 3000
  retries: 1
});

