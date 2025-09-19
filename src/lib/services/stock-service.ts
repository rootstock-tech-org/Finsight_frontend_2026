import { WatchlistItem } from '@/lib/store/stock-store';
import { externalStockApi, StockSearchResult, StockPriceData } from './external-stock-api';
import { indianStocksService } from './indian-stocks-service';

// Mock stock data - replace with actual API calls
const mockStocks = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    sector: 'Petroleum Products',
    type: 'stock' as const,
    last_price: 2450.50,
    change_percent: 2.5
  },
  {
    symbol: 'JIOFIN',
    name: 'Jio Financial Services Limited',
    sector: 'Financial Services',
    type: 'stock' as const,
    last_price: 185.75,
    change_percent: -1.2
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    sector: 'Automobiles',
    type: 'stock' as const,
    last_price: 890.25,
    change_percent: 3.8
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    sector: 'Banks',
    type: 'stock' as const,
    last_price: 1650.00,
    change_percent: 1.5
  },
  {
    symbol: 'ETERNAL',
    name: 'ETERNAL LIMITED',
    sector: 'Textiles',
    type: 'stock' as const,
    last_price: 45.80,
    change_percent: 5.2
  },
  {
    symbol: 'BEL',
    name: 'Bharat Electronics Limited',
    sector: 'Capital Goods',
    type: 'stock' as const,
    last_price: 125.40,
    change_percent: -0.8
  }
];


export const searchStocks = async (query: string): Promise<WatchlistItem[]> => {
  const startTime = performance.now();
  console.log(`🔍 [STOCK-SERVICE] Starting stock search for query: "${query}"`);
  
  try {
    const results = await indianStocksService.searchStocks(query);
    const endTime = performance.now();
    console.log(`✅ [STOCK-SERVICE] Stock search completed in ${(endTime - startTime).toFixed(2)}ms - Found ${results.length} results`);
    return results;
  } catch (error) {
    const endTime = performance.now();
    console.error(`❌ [STOCK-SERVICE] Stock search failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    throw error;
  }
};

export const getStockPrice = async (symbol: string): Promise<{ last_price: number; change_percent: number }> => {
  return await indianStocksService.getStockPrice(symbol);
};

export const addToWishlist = async (symbol: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a real app, this would make an API call to add to wishlist
  console.log(`Added ${symbol} to wishlist`);
};

export const getStockSuggestions = async (query: string): Promise<WatchlistItem[]> => {
  const startTime = performance.now();
  console.log(`💡 [STOCK-SERVICE] Starting stock suggestions for query: "${query}"`);
  
  try {
    // Use external API for stock suggestions
    const searchResults = await externalStockApi.searchStocks(query);
    const searchEndTime = performance.now();
    console.log(`⏱️ [STOCK-SERVICE] Search completed in ${(searchEndTime - startTime).toFixed(2)}ms - Found ${searchResults.length} results`);
    
    // Convert search results to WatchlistItem format
    const convertStartTime = performance.now();
    const stockItems: WatchlistItem[] = searchResults.map((result: StockSearchResult) => ({
      symbol: result.symbol,
      name: result.name,
      type: 'stock' as const,
      sector: result.sector || result.industry || 'Unknown',
      last_price: 0, // Will be fetched separately
      change_percent: 0 // Will be fetched separately
    }));
    const convertEndTime = performance.now();
    console.log(`🔄 [STOCK-SERVICE] Data conversion completed in ${(convertEndTime - convertStartTime).toFixed(2)}ms`);
    
    // Get prices for the suggestions
    if (stockItems.length > 0) {
      const symbols = stockItems.map(item => item.symbol);
      console.log(`💰 [STOCK-SERVICE] Fetching prices for ${symbols.length} symbols...`);
      const prices = await externalStockApi.getMultipleStockPrices(symbols);
      const priceEndTime = performance.now();
      console.log(`⏱️ [STOCK-SERVICE] Price fetching completed in ${(priceEndTime - convertEndTime).toFixed(2)}ms`);
      
      // Merge price data with search results
      const mergeStartTime = performance.now();
      stockItems.forEach((item, index) => {
        const priceData = prices.find(p => p.symbol === item.symbol);
        if (priceData) {
          item.last_price = priceData.last_price || 0;
          item.change_percent = priceData.change_percent || 0;
        }
      });
      const mergeEndTime = performance.now();
      console.log(`🔄 [STOCK-SERVICE] Price merging completed in ${(mergeEndTime - mergeStartTime).toFixed(2)}ms`);
    }
    
    const endTime = performance.now();
    console.log(`✅ [STOCK-SERVICE] Stock suggestions completed in ${(endTime - startTime).toFixed(2)}ms - Returning ${Math.min(stockItems.length, 10)} items`);
    return stockItems.slice(0, 10);
  } catch (error) {
    const endTime = performance.now();
    console.error(`❌ [STOCK-SERVICE] Stock suggestions failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    
    // Fallback to mock data if external API fails
    console.log('🔄 [STOCK-SERVICE] Falling back to mock data for suggestions...');
    const fallbackStartTime = performance.now();
    const mockResults = mockStocks
      .filter(stock => 
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10);
    const fallbackEndTime = performance.now();
    console.log(`⚡ [STOCK-SERVICE] Mock data fallback completed in ${(fallbackEndTime - fallbackStartTime).toFixed(2)}ms - Returning ${mockResults.length} items`);
    return mockResults;
  }
};


// Get user's wishlist
export const getWishlist = async (): Promise<WatchlistItem[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // In development, try to get from localStorage as fallback
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const savedStocksJson = localStorage.getItem(`selected_stocks_${currentUser}`);
      
      const stocks: string[] = savedStocksJson ? JSON.parse(savedStocksJson) : [];
      
      const wishlistItems: WatchlistItem[] = [];
      
      // Add stocks to wishlist
      stocks.forEach(symbol => {
        const stock = mockStocks.find(s => s.symbol === symbol);
        if (stock) {
          wishlistItems.push({
            ...stock,
            type: 'stock'
          });
        }
      });
      
      return wishlistItems;
    }
    
    return [];
  } catch (error) {
    console.error('Error loading wishlist:', error);
    return [];
  }
};

// Remove from user's wishlist
export const removeFromWishlist = async (symbol: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    // In development, remove from localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      // Remove from stocks
      const savedStocksJson = localStorage.getItem(`selected_stocks_${currentUser}`);
      if (savedStocksJson) {
        const stocks = JSON.parse(savedStocksJson);
        const updatedStocks = stocks.filter((s: string) => s !== symbol);
        localStorage.setItem(`selected_stocks_${currentUser}`, JSON.stringify(updatedStocks));
      }
    }
    
    console.log(`Removed ${symbol} from wishlist`);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw new Error('Failed to remove from wishlist');
  }
};