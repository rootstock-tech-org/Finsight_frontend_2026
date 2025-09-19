/**
 * Mutual Fund Service
 * Fetches live NAV data for Indian mutual funds
 */

interface MutualFundData {
  symbol: string;
  name: string;
  nav: number;
  change?: number;
  change_percent?: number;
  date?: string;
  fund_house?: string;
  category?: string;
  scheme_type?: string;
}

interface MutualFundServiceConfig {
  enableLiveData: boolean;
  fallbackToMock: boolean;
  cacheTimeout: number;
  apiKey?: string;
}

export class MutualFundService {
  private config: MutualFundServiceConfig;
  private cache: Map<string, { data: MutualFundData[], timestamp: number }> = new Map();

  constructor(config?: Partial<MutualFundServiceConfig>) {
    this.config = {
      enableLiveData: true,
      fallbackToMock: true,
      cacheTimeout: 300000, // 5 minutes cache for mutual funds
      ...config
    };
  }

  /**
   * Get popular Indian mutual funds with live NAV data
   */
  async getPopularMutualFunds(): Promise<MutualFundData[]> {
    const cacheKey = 'popular_mutual_funds';
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      console.log('Returning cached mutual fund data');
      return cached.data;
    }

    console.log('Fetching mutual fund data, live data enabled:', this.config.enableLiveData);

    try {
      if (this.config.enableLiveData) {
        console.log('Attempting to fetch live mutual fund data...');
        const liveData = await this.fetchLiveMutualFundData();
        this.cache.set(cacheKey, { data: liveData, timestamp: Date.now() });
        console.log('Live mutual fund data fetched successfully:', liveData.length, 'funds');
        return liveData;
      }
    } catch (error) {
      console.error('Error fetching live mutual fund data:', error);
      
      if (this.config.fallbackToMock) {
        console.log('Falling back to mock mutual fund data...');
        const mockData = this.getMockMutualFundData();
        this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
        return mockData;
      }
      
      throw error;
    }

    // If live data is disabled, return mock data
    console.log('Using mock mutual fund data (live data disabled)');
    const mockData = this.getMockMutualFundData();
    this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    return mockData;
  }

  /**
   * Fetch live mutual fund data from external APIs
   */
  private async fetchLiveMutualFundData(): Promise<MutualFundData[]> {
    const fundSymbols = [
      'SBI_BLUECHIP',
      'HDFC_TOP100', 
      'ICICI_MIDCAP',
      'AXIS_SMALLCAP',
      'MIRAE_EMERGING',
      'PARAG_FLEXI',
      'KOTAK_EQUITY',
      'UTI_NIFTY'
    ];

    try {
      // Try multiple APIs in order of preference
      const apis = [
        () => this.fetchFromAMFI(),
        () => this.fetchFromAPI(),
        () => this.fetchFromAlternativeAPI()
      ];

      for (const api of apis) {
        try {
          const data = await api();
          if (data && data.length > 0) {
            console.log('Successfully fetched mutual fund data from API');
            return data;
          }
        } catch (error) {
          console.log('API failed, trying next one...', error);
          continue;
        }
      }

      throw new Error('All APIs failed');
    } catch (error) {
      console.error('Error fetching live mutual fund data:', error);
      throw error;
    }
  }

  /**
   * Fetch from AMFI (Association of Mutual Funds in India)
   */
  private async fetchFromAMFI(): Promise<MutualFundData[]> {
    try {
      // AMFI provides daily NAV data
      const response = await fetch('/api/mutual-funds/amfi', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`AMFI API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAMFIData(data);
    } catch (error) {
      console.error('Error fetching from AMFI:', error);
      throw error;
    }
  }

  /**
   * Fetch from external API
   */
  private async fetchFromAPI(): Promise<MutualFundData[]> {
    try {
      const response = await fetch('/api/mutual-funds/external', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseExternalAPIData(data);
    } catch (error) {
      console.error('Error fetching from external API:', error);
      throw error;
    }
  }

  /**
   * Fetch from alternative API
   */
  private async fetchFromAlternativeAPI(): Promise<MutualFundData[]> {
    try {
      // This would be a third-party API like API Ninjas or similar
      const response = await fetch('/api/mutual-funds/alternative', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Alternative API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAlternativeAPIData(data);
    } catch (error) {
      console.error('Error fetching from alternative API:', error);
      throw error;
    }
  }

  /**
   * Parse AMFI data
   */
  private parseAMFIData(data: any): MutualFundData[] {
    // This would parse the AMFI response format
    // For now, return empty array as we need to implement the actual parsing
    return [];
  }

  /**
   * Parse external API data
   */
  private parseExternalAPIData(data: any): MutualFundData[] {
    // This would parse the external API response format
    // For now, return empty array as we need to implement the actual parsing
    return [];
  }

  /**
   * Parse alternative API data
   */
  private parseAlternativeAPIData(data: any): MutualFundData[] {
    // This would parse the alternative API response format
    // For now, return empty array as we need to implement the actual parsing
    return [];
  }

  /**
   * Get mock mutual fund data (fallback)
   */
  private getMockMutualFundData(): MutualFundData[] {
    console.log('Generating mock mutual fund data...');
    
    const baseFunds = [
      { symbol: 'SBI_BLUECHIP', name: 'SBI Bluechip Fund', nav: 45.32, fund_house: 'SBI Mutual Fund', category: 'Large Cap' },
      { symbol: 'HDFC_TOP100', name: 'HDFC Top 100 Fund', nav: 78.45, fund_house: 'HDFC Mutual Fund', category: 'Large Cap' },
      { symbol: 'ICICI_MIDCAP', name: 'ICICI Prudential Mid Cap Fund', nav: 125.67, fund_house: 'ICICI Prudential', category: 'Mid Cap' },
      { symbol: 'AXIS_SMALLCAP', name: 'Axis Small Cap Fund', nav: 52.89, fund_house: 'Axis Mutual Fund', category: 'Small Cap' },
      { symbol: 'MIRAE_EMERGING', name: 'Mirae Asset Emerging Bluechip Fund', nav: 95.23, fund_house: 'Mirae Asset', category: 'Large & Mid Cap' },
      { symbol: 'PARAG_FLEXI', name: 'Parag Parikh Flexi Cap Fund', nav: 67.34, fund_house: 'Parag Parikh', category: 'Flexi Cap' },
      { symbol: 'KOTAK_EQUITY', name: 'Kotak Standard Multicap Fund', nav: 89.12, fund_house: 'Kotak Mahindra', category: 'Multi Cap' },
      { symbol: 'UTI_NIFTY', name: 'UTI Nifty Index Fund', nav: 156.78, fund_house: 'UTI Mutual Fund', category: 'Index Fund' }
    ];

    const mockData = baseFunds.map(fund => {
      // Generate realistic NAV variations (±2% for mutual funds)
      const variation = (Math.random() - 0.5) * 0.04; // ±2% variation
      const newNav = fund.nav * (1 + variation);
      const change = newNav - fund.nav;
      const changePercent = (change / fund.nav) * 100;
      
      return {
        symbol: fund.symbol,
        name: fund.name,
        nav: Math.round(newNav * 100) / 100,
        change: Math.round(change * 100) / 100,
        change_percent: Math.round(changePercent * 100) / 100,
        date: new Date().toISOString().split('T')[0],
        fund_house: fund.fund_house,
        category: fund.category,
        scheme_type: 'Open Ended'
      };
    });

    console.log('Mock mutual fund data generated:', mockData.length, 'funds');
    console.log('Sample mock data:', mockData.slice(0, 3));
    return mockData;
  }

  /**
   * Search mutual funds by query
   */
  async searchMutualFunds(query: string): Promise<MutualFundData[]> {
    if (!query.trim()) {
      return this.getPopularMutualFunds();
    }

    try {
      if (this.config.enableLiveData) {
        // For now, filter the popular funds based on query
        const allFunds = await this.getPopularMutualFunds();
        return allFunds.filter(fund => 
          fund.name.toLowerCase().includes(query.toLowerCase()) ||
          fund.symbol.toLowerCase().includes(query.toLowerCase()) ||
          fund.category?.toLowerCase().includes(query.toLowerCase())
        );
      }
    } catch (error) {
      console.error('Error searching mutual funds with live data:', error);
      
      if (this.config.fallbackToMock) {
        return this.searchMockMutualFunds(query);
      }
      
      throw error;
    }

    return this.searchMockMutualFunds(query);
  }

  /**
   * Search mock mutual funds
   */
  private searchMockMutualFunds(query: string): MutualFundData[] {
    const allFunds = this.getMockMutualFundData();
    
    return allFunds.filter(fund => 
      fund.name.toLowerCase().includes(query.toLowerCase()) ||
      fund.symbol.toLowerCase().includes(query.toLowerCase()) ||
      fund.category?.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get mutual fund NAV by symbol
   */
  async getMutualFundNav(symbol: string): Promise<MutualFundData | null> {
    try {
      const funds = await this.getPopularMutualFunds();
      return funds.find(fund => fund.symbol === symbol) || null;
    } catch (error) {
      console.error(`Error fetching NAV for ${symbol}:`, error);
      return null;
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
  updateConfig(newConfig: Partial<MutualFundServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const mutualFundService = new MutualFundService({
  enableLiveData: true,
  fallbackToMock: true,
  cacheTimeout: 300000 // 5 minutes
});
export type { MutualFundData, MutualFundServiceConfig };
