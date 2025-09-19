# Live Stock Data Integration

This document describes the implementation of live stock data fetching to replace hardcoded values in the FinSight application.

## Overview

The application now fetches live stock data from external APIs instead of using hardcoded values. This provides real-time stock prices and percentage changes for a better user experience.

## Key Changes

### 1. New Indian Stocks Service (`src/lib/services/indian-stocks-service.ts`)

- **Purpose**: Centralized service for fetching live Indian stock data
- **Features**:
  - Fetches live prices for popular Indian stocks
  - Caches data for 30 seconds to reduce API calls
  - Fallback to mock data if live data fails
  - Supports search functionality
  - Handles mutual funds (with mock data as they don't have real-time pricing)

### 2. Updated Stock Selection Component (`src/components/StockSelection.tsx`)

- **Changes**:
  - Removed hardcoded stock data
  - Added live data fetching on component mount
  - Added refresh functionality with manual refresh button
  - Improved error handling and loading states
  - Uses the new Indian stocks service

### 3. Updated Stock Service (`src/lib/services/stock-service.ts`)

- **Changes**:
  - Integrated with the new Indian stocks service
  - Maintains backward compatibility
  - Improved error handling with fallbacks

### 4. Test Endpoint (`src/app/api/test-stocks/route.ts`)

- **Purpose**: Test the stock data integration
- **Features**:
  - Tests popular stocks fetching
  - Tests mutual funds fetching
  - Tests stock search functionality
  - Tests individual stock price fetching

## Popular Indian Stocks Included

The service includes live data for these popular Indian stocks:

1. **RELIANCE** - Reliance Industries Limited (Oil & Gas)
2. **JIOFIN** - Jio Financial Services Limited (Financial Services)
3. **TATAMOTORS** - Tata Motors Limited (Automobile)
4. **HDFCBANK** - HDFC Bank Limited (Banking)
5. **ETERNAL** - ETERNAL LIMITED (Technology)
6. **BEL** - Bharat Electronics Limited (Defense)
7. **TCS** - Tata Consultancy Services Limited (IT)
8. **INFY** - Infosys Limited (IT)
9. **WIPRO** - Wipro Limited (IT)
10. **HCLTECH** - HCL Technologies Limited (IT)
11. **ITC** - ITC Limited (Consumer Goods)
12. **MARUTI** - Maruti Suzuki India Limited (Automobile)
13. **BAJFINANCE** - Bajaj Finance Limited (Financial Services)
14. **BHARTIARTL** - Bharti Airtel Limited (Telecommunications)
15. **ASIANPAINT** - Asian Paints Limited (Consumer Goods)
16. **NESTLEIND** - Nestle India Limited (Consumer Goods)
17. **ULTRACEMCO** - UltraTech Cement Limited (Cement)
18. **TITAN** - Titan Company Limited (Consumer Goods)
19. **SUNPHARMA** - Sun Pharmaceutical Industries Limited (Pharmaceuticals)
20. **DRREDDY** - Dr. Reddy's Laboratories Limited (Pharmaceuticals)

## Features

### Live Data Fetching
- Real-time stock prices
- Live percentage changes
- Automatic data refresh
- Manual refresh capability

### Error Handling
- Graceful fallback to mock data
- User-friendly error messages
- Loading states during data fetch

### Caching
- 30-second cache to reduce API calls
- Manual cache clearing via refresh button
- Improved performance

### Search Functionality
- Live search through external API
- Fallback to local search if API fails
- Supports both stock symbols and company names

## Testing

To test the integration, you can:

1. **Visit the test endpoint**: `/api/test-stocks`
2. **Use the refresh button** in the stock selection interface
3. **Search for stocks** using the search bar
4. **Check browser console** for any errors

## Configuration

The service can be configured via the `IndianStocksServiceConfig`:

```typescript
{
  enableLiveData: true,        // Enable/disable live data fetching
  fallbackToMock: true,       // Fallback to mock data on error
  cacheTimeout: 30000         // Cache timeout in milliseconds
}
```

## API Integration

The service integrates with the existing external stock API:
- **Search endpoint**: `/api/external-stocks/search`
- **Price endpoint**: `/api/external-stocks/price/[symbol]`
- **Base URL**: `https://e9cwq4w7punvx7-1003.proxy.runpod.net`

## Future Enhancements

1. **Real-time updates**: WebSocket integration for live price updates
2. **More stock exchanges**: Support for NSE, BSE, etc.
3. **Historical data**: Price history and charts
4. **Market indices**: Nifty 50, Sensex, etc.
5. **News integration**: Stock-related news feeds
6. **Alerts**: Price alerts and notifications

## Troubleshooting

### Common Issues

1. **API Rate Limits**: The service includes caching to reduce API calls
2. **Network Errors**: Automatic fallback to mock data
3. **Invalid Symbols**: Error handling for invalid stock symbols
4. **Slow Loading**: Loading states and progress indicators

### Debug Steps

1. Check browser console for errors
2. Test the `/api/test-stocks` endpoint
3. Verify external API connectivity
4. Check network requests in browser dev tools

## Dependencies

- `@/lib/services/external-stock-api` - External API integration
- `@/lib/store/stock-store` - State management
- `lucide-react` - UI icons
- `next/server` - API routes


