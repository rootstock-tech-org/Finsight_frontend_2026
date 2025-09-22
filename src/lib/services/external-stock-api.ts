/**
 * Enhanced External Stock API Service
 * Integrates with the RunPod proxy stock API with circuit breaker and fallback
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
  close?: number;
  timestamp?: string;
  error?: string;
  mock?: boolean; // Flag to indicate if this is mock data
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
  circuitBreakerThreshold?: number;
  circuitBreakerResetTime?: number;
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
    private threshold: number = 5,
    private resetTime: number = 60000 // 1 minute
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTime) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log('🔄 [CIRCUIT-BREAKER] Moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - failing fast');
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
    if (this.state !== CircuitBreakerState.CLOSED) {
      console.log('✅ [CIRCUIT-BREAKER] Moving to CLOSED state');
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitBreakerState.OPEN;
      console.log(`🔴 [CIRCUIT-BREAKER] Moving to OPEN state after ${this.failureCount} failures`);
    }
  }

  getState() {
    return this.state;
  }
}

// Mock data for Indian stocks when external API is down
const MOCK_STOCK_DATA: Record<string, StockPriceData> = {
  'RELIANCE': {
    symbol: 'RELIANCE',
    last_price: 2847.50,
    day_change: 12.30,
    day_change_perc: 0.43,
    volume: 2456789,
    market_cap: 19250000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'TCS': {
    symbol: 'TCS',
    last_price: 4125.75,
    day_change: -15.25,
    day_change_perc: -0.37,
    volume: 1234567,
    market_cap: 15000000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'HDFCBANK': {
    symbol: 'HDFCBANK',
    last_price: 1789.20,
    day_change: 8.45,
    day_change_perc: 0.47,
    volume: 3456789,
    market_cap: 13500000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'INFY': {
    symbol: 'INFY',
    last_price: 1456.80,
    day_change: -5.60,
    day_change_perc: -0.38,
    volume: 2345678,
    market_cap: 6000000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'ICICIBANK': {
    symbol: 'ICICIBANK',
    last_price: 1234.90,
    day_change: 18.70,
    day_change_perc: 1.54,
    volume: 4567890,
    market_cap: 8500000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'WIPRO': {
    symbol: 'WIPRO',
    last_price: 567.30,
    day_change: -2.10,
    day_change_perc: -0.37,
    volume: 1876543,
    market_cap: 3200000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'HCLTECH': {
    symbol: 'HCLTECH',
    last_price: 1789.45,
    day_change: 23.15,
    day_change_perc: 1.31,
    volume: 2987654,
    market_cap: 4850000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'TATAMOTORS': {
    symbol: 'TATAMOTORS',
    last_price: 892.60,
    day_change: -12.40,
    day_change_perc: -1.37,
    volume: 5678901,
    market_cap: 3250000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'JIOFIN': {
    symbol: 'JIOFIN',
    last_price: 345.80,
    day_change: 4.20,
    day_change_perc: 1.23,
    volume: 3456789,
    market_cap: 2200000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'ETERNAL': {
    symbol: 'ETERNAL',
    last_price: 156.75,
    day_change: 2.35,
    day_change_perc: 1.52,
    volume: 876543,
    market_cap: 125000000000,
    timestamp: new Date().toISOString(),
    mock: true
  },
  'BEL': {
    symbol: 'BEL',
    last_price: 289.45,
    day_change: 7.85,
    day_change_perc: 2.79,
    volume: 1456789,
    market_cap: 215000000000,
    timestamp: new Date().toISOString(),
    mock: true
  }
};

export class ExternalStockApiService {
  private config: ExternalStockApiConfig;
  private circuitBreaker: CircuitBreaker;

  constructor(config?: Partial<ExternalStockApiConfig>) {
    this.config = {
      baseUrl: 'https://e9cwq4w7punvx7-1003.proxy.runpod.net',
      timeout: 2000, // Reduced timeout to 2 seconds
      retries: 0, // No retries to fail fast
      circuitBreakerThreshold: 3, // Open circuit after 3 failures
      circuitBreakerResetTime: 30000, // Reset after 30 seconds
      ...config
    };
    this.circuitBreaker = new CircuitBreaker(
      this.config.circuitBreakerThreshold!,
      this.config.circuitBreakerResetTime!
    );
  }

  /**
   * Resolve relative API route URLs to absolute origin (needed on server)
   */
  private resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`);
    return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /**
   * Generate mock stock price data with realistic variations
   */
  private generateMockPrice(symbol: string): StockPriceData {
    const baseData = MOCK_STOCK_DATA[symbol.toUpperCase()];
    if (baseData) {
      // Add small random variations to make it look realistic
      const priceVariation = (Math.random() - 0.5) * 10; // ±5 price variation
      const changeVariation = (Math.random() - 0.5) * 2; // ±1% change variation
      
      return {
        ...baseData,
        last_price: Math.max(1, (baseData.last_price || 100) + priceVariation),
        day_change: (baseData.day_change || 0) + changeVariation,
        day_change_perc: (baseData.day_change_perc || 0) + (changeVariation / 100),
        timestamp: new Date().toISOString(),
        mock: true
      };
    }

    // Generate random mock data for unknown symbols
    const basePrice = 100 + Math.random() * 500;
    const changePercent = (Math.random() - 0.5) * 10; // ±5% change
    const change = basePrice * (changePercent / 100);

    return {
      symbol: symbol.toUpperCase(),
      last_price: Math.round(basePrice * 100) / 100,
      day_change: Math.round(change * 100) / 100,
      day_change_perc: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      market_cap: Math.floor(Math.random() * 1000000000000) + 50000000000,
      timestamp: new Date().toISOString(),
      mock: true
    };
  }

  /**
   * Search for stocks by query with fallback to mock data
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const startTime = performance.now();
    console.log(`🔍 [EXTERNAL-API] Starting stock search for query: "${query}"`);
    
    try {
      const result = await this.circuitBreaker.call(async () => {
        const url = '/api/external-stocks/search';
        const params = new URLSearchParams({ query });
        
        console.log(`🌐 [EXTERNAL-API] Making API call to: ${url}?${params}`);
          const response = await this.fetchWithRetry(`${url}?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        if (Array.isArray(data)) {
          return data.map((item: any) => ({
            symbol: item.symbol || '',
            name: item.name || '',
            exchange: item.exchange || 'NSE',
            type: item.type || 'stock',
            sector: item.industry || 'Unknown',
            industry: item.industry || 'Unknown'
          }));
        }
        return [];
      });

      const endTime = performance.now();
      console.log(`✅ [EXTERNAL-API] Search completed successfully in ${(endTime - startTime).toFixed(2)}ms - Found ${result.length} results`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.warn(`⚠️ [EXTERNAL-API] Search failed after ${(endTime - startTime).toFixed(2)}ms, using mock data:`, error);
      
      // Return mock search results for popular Indian stocks
      const mockResults = Object.keys(MOCK_STOCK_DATA)
        .filter(symbol => 
          symbol.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(symbol.toLowerCase())
        )
        .map(symbol => ({
          symbol,
          name: this.getCompanyName(symbol),
          exchange: 'NSE',
          type: 'stock',
          sector: 'Technology',
          industry: 'Software'
        }));

      return mockResults.length > 0 ? mockResults : [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', type: 'stock', sector: 'Energy', industry: 'Oil & Gas' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', type: 'stock', sector: 'Technology', industry: 'IT Services' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', type: 'stock', sector: 'Financial', industry: 'Banking' }
      ];
    }
  }

  /**
   * Get stock price by symbol with circuit breaker and mock fallback
   */
  async getStockPrice(symbol: string): Promise<StockPriceData> {
    const startTime = performance.now();
    console.log(`💰 [EXTERNAL-API] Starting price fetch for symbol: "${symbol}"`);
    
    try {
      const result = await this.circuitBreaker.call(async () => {
        const { normalizeToBackendSymbol } = await import('@/lib/services/symbol-resolver');
        const norm = normalizeToBackendSymbol(symbol);
        const url = `/api/external-stocks/price/${encodeURIComponent(norm)}`;
        
        console.log(`🌐 [EXTERNAL-API] Making price API call to: ${url}`);
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return {
          symbol: norm,
          last_price: data.last_price || null,
          change: data.day_change || 0,
          change_percent: data.day_change_perc || 0,
          volume: data.volume || 0,
          market_cap: data.market_cap || null,
          open: data.ohlc?.open || null,
          close: data.ohlc?.close || null,
          high_52w: data.week_52_high || null,
          low_52w: data.week_52_low || null,
          day_change: data.day_change || 0,
          day_change_perc: data.day_change_perc || 0,
          timestamp: new Date().toISOString()
        };
      });

      const endTime = performance.now();
      console.log(`✅ [EXTERNAL-API] Price fetch completed in ${(endTime - startTime).toFixed(2)}ms - Price: ${result.last_price}`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.warn(`⚠️ [EXTERNAL-API] Price fetch failed after ${(endTime - startTime).toFixed(2)}ms for ${symbol}`, error);
      // Do not return mock/hardcoded data. Let caller decide fallback (e.g., Supabase cached)
      throw error instanceof Error ? error : new Error('External price fetch failed');
    }
  }

  /**
   * Get multiple stock prices in batch with better error handling and mock fallback
   */
  async getMultipleStockPrices(symbols: string[]): Promise<StockPriceData[]> {
    const startTime = performance.now();
    console.log(`💰💰 [EXTERNAL-API] Starting batch price fetch for ${symbols.length} symbols: [${symbols.join(', ')}]`);
    
    // Check circuit breaker state
    if (this.circuitBreaker.getState() === CircuitBreakerState.OPEN) {
      console.log(`🔴 [CIRCUIT-BREAKER] Circuit is OPEN, skipping external calls and returning empty results`);
      const endTime = performance.now();
      console.log(`⏭️ [EXTERNAL-API] Skipped in ${(endTime - startTime).toFixed(2)}ms`);
      return [];
    }

    try {
      // Process in smaller batches to avoid overwhelming the API
      const batchSize = 3; // Conservative batch
      const results: StockPriceData[] = [];
      
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const batchStartTime = performance.now();
        
        console.log(`📦 [EXTERNAL-API] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)}: [${batch.join(', ')}]`);
        
        const batchPromises = batch.map(symbol => 
          this.getStockPrice(symbol).catch(error => {
            console.warn(`Failed to fetch price for ${symbol}`, error);
            return null;
          })
        );

        const batchResults = await Promise.all(batchPromises);
        const realResults = batchResults.filter((r): r is StockPriceData => !!r && r.last_price != null);
        results.push(...realResults);
        
        const batchEndTime = performance.now();
        console.log(`✅ [EXTERNAL-API] Batch ${Math.floor(i/batchSize) + 1} completed in ${(batchEndTime - batchStartTime).toFixed(2)}ms`);
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < symbols.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const endTime = performance.now();
      console.log(`✅ [EXTERNAL-API] Batch price fetch completed in ${(endTime - startTime).toFixed(2)}ms - ${results.length} real`);
      return results;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ [EXTERNAL-API] Batch price fetch failed after ${(endTime - startTime).toFixed(2)}ms`, error);
      // Return empty; caller should fallback to Supabase cached
      return [];
    }
  }

  /**
   * Search by query and fetch prices for the resulting symbols
   */
  async searchAndGetPrice(query: string): Promise<{ searchResults: StockSearchResult[]; prices: StockPriceData[] }> {
    const searchResults = await this.searchStocks(query);
    if (searchResults.length === 0) {
      return { searchResults, prices: [] };
    }

    try {
      const symbols = searchResults.map(r => r.symbol);
      const prices = await this.getMultipleStockPrices(symbols);

      // Ensure output arrays align by input symbols
      const symbolToPrice = new Map(prices.map(p => [p.symbol.toUpperCase(), p] as const));
      const orderedPrices = symbols.map(s => symbolToPrice.get(s.toUpperCase()) || this.generateMockPrice(s));

      return { searchResults, prices: orderedPrices };
    } catch (error) {
      console.warn('[EXTERNAL-API] searchAndGetPrice failed, falling back to mock prices:', error);
      const prices = searchResults.map(r => this.generateMockPrice(r.symbol));
      return { searchResults, prices };
    }
  }

  /**
   * Return a curated list of popular Indian stocks with price data
   */
  async getPopularStocks(): Promise<StockPriceData[]> {
    const symbols = [
      'RELIANCE', 'JIOFIN', 'TATAMOTORS', 'HDFCBANK', 'ETERNAL', 'BEL',
      'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'ITC', 'MARUTI', 'BAJFINANCE',
      'BHARTIARTL', 'ASIANPAINT', 'NESTLEIND', 'ULTRACEMCO', 'TITAN',
      'SUNPHARMA', 'DRREDDY'
    ];

    try {
      return await this.getMultipleStockPrices(symbols);
    } catch (error) {
      console.warn('[EXTERNAL-API] getPopularStocks failed, returning mock data:', error);
      return symbols.map(s => this.generateMockPrice(s));
    }
  }

  /**
   * Provide basic market indices mock data (extend when upstream is available)
   */
  async getMarketIndices(): Promise<Array<{ index: string; last_price: number; change_percent: number; timestamp: string }>> {
    // If there is an upstream endpoint later, wire it similarly to price/search
    const now = new Date().toISOString();
    return [
      { index: 'NIFTY 50', last_price: 24500 + Math.random() * 200, change_percent: (Math.random() - 0.5) * 1.5, timestamp: now },
      { index: 'SENSEX', last_price: 81000 + Math.random() * 300, change_percent: (Math.random() - 0.5) * 1.5, timestamp: now },
      { index: 'NIFTY BANK', last_price: 52000 + Math.random() * 300, change_percent: (Math.random() - 0.5) * 1.5, timestamp: now }
    ].map(i => ({ ...i, last_price: Math.round(i.last_price * 100) / 100, change_percent: Math.round(i.change_percent * 100) / 100 }));
  }

  /**
   * Get company name for a symbol
   */
  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      'RELIANCE': 'Reliance Industries Ltd',
      'TCS': 'Tata Consultancy Services',
      'HDFCBANK': 'HDFC Bank Ltd',
      'INFY': 'Infosys Ltd',
      'ICICIBANK': 'ICICI Bank Ltd',
      'WIPRO': 'Wipro Ltd',
      'HCLTECH': 'HCL Technologies Ltd',
      'TATAMOTORS': 'Tata Motors Ltd',
      'JIOFIN': 'Jio Financial Services Ltd',
      'ETERNAL': 'Eternal Oil Ltd',
      'BEL': 'Bharat Electronics Ltd'
    };
    return names[symbol.toUpperCase()] || `${symbol} Ltd`;
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded', message: string, circuitState: string }> {
    try {
      const response = await this.fetchWithRetry('/api/external-stocks/search?query=test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return { 
          status: 'healthy', 
          message: 'External API is responding correctly',
          circuitState: this.circuitBreaker.getState()
        };
      } else {
        return { 
          status: 'degraded', 
          message: `External API returned status ${response.status}, using fallback`,
          circuitState: this.circuitBreaker.getState()
        };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `External API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}, using mock data`,
        circuitState: this.circuitBreaker.getState()
      };
    }
  }

  /**
   * Fetch with timeout and no retries (fail fast)
   */
  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (this.config.timeout ?? 10000) + 1500);

    try {
      const finalUrl = this.resolveUrl(url);
      const response = await fetch(finalUrl, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Export singleton instance
export const externalStockApi = new ExternalStockApiService({
  // Configuration can be customized here
});
// Types are already exported above with the interface declarations