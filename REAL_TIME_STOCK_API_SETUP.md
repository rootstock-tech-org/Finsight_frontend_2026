# 🚀 Real-Time Stock Data API Integration Guide

## 📋 **Overview**
This guide shows you how to integrate real-time stock data APIs for both server-side and client-side operations to make your website faster and more secure.

## 🏗️ **Architecture**

### **Server-Side APIs (Node.js/Edge)**
- **Next.js API Routes** - RESTful endpoints for stock data
- **Supabase Edge Functions** - Real-time data fetching and processing
- **Database Operations** - Secure data storage and retrieval

### **Client-Side APIs (Browser)**
- **Real-time WebSocket** - Live stock price updates
- **React Hooks** - State management and data fetching
- **Service Workers** - Background data processing

## 🔧 **Setup Instructions**

### **Step 1: Environment Variables**
Add to your `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Third-party API Keys (for production)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
POLYGON_API_KEY=your_polygon_key
```

### **Step 2: Database Schema**
Run this in your Supabase SQL Editor:
```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE market_data;
ALTER PUBLICATION supabase_realtime ADD TABLE news;
ALTER PUBLICATION supabase_realtime ADD TABLE watchlist;
```

### **Step 3: Deploy Edge Functions**
```bash
# Deploy stock fetching function
supabase functions deploy fetch-stocks

# Deploy news fetching function
supabase functions deploy fetch-news

# Set up cron jobs (optional)
supabase functions deploy --with-cron
```

### **Step 4: Test the Integration**
```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/stocks
curl http://localhost:3000/api/stocks/RELIANCE
curl http://localhost:3000/api/news
```

## 📊 **API Endpoints**

### **Server-Side APIs**

#### **Stocks API**
- `GET /api/stocks` - Fetch all stocks with pagination
- `GET /api/stocks?search=AAPL` - Search stocks
- `GET /api/stocks?symbol=RELIANCE` - Get specific stock
- `POST /api/stocks` - Create/update stock
- `PUT /api/stocks/[symbol]` - Update stock price

#### **Market Data API**
- `GET /api/market-data` - Fetch market data
- `GET /api/market-data?symbol=RELIANCE` - Get specific stock data
- `POST /api/market-data` - Create market data entry

#### **News API**
- `GET /api/news` - Fetch news articles
- `GET /api/news?symbol=RELIANCE` - Get stock-specific news
- `POST /api/news` - Create news article

#### **Watchlist API**
- `GET /api/watchlist?user_id=xxx` - Get user's watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist?user_id=xxx&symbol=RELIANCE` - Remove from watchlist

### **Client-Side Services**

#### **Real-Time Stock Service**
```typescript
import { realTimeStockService } from '@/lib/services/real-time-stock-service';

// Fetch stocks
const { stocks } = await realTimeStockService.fetchStocks({
  search: 'RELIANCE',
  limit: 10
});

// Subscribe to real-time updates
const channel = realTimeStockService.subscribeToStockUpdates('RELIANCE', (payload) => {
  console.log('Price updated:', payload.new.current_price);
});
```

#### **Watchlist Service**
```typescript
import { watchlistService } from '@/lib/services/watchlist-service';

// Add to watchlist
await watchlistService.addToWatchlist(userId, 'RELIANCE', 'Reliance Industries');

// Remove from watchlist
await watchlistService.removeFromWatchlist(userId, 'RELIANCE');
```

## 🎣 **React Hooks**

### **useRealTimeStocks**
```typescript
import { useRealTimeStocks } from '@/hooks/useRealTimeStocks';

function StockList() {
  const { stocks, loading, error } = useRealTimeStocks({
    search: 'RELIANCE',
    autoRefresh: true,
    refreshInterval: 30000
  });

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {stocks.map(stock => (
        <div key={stock.symbol}>
          {stock.company_name}: ₹{stock.current_price}
        </div>
      ))}
    </div>
  );
}
```

### **useWatchlist**
```typescript
import { useWatchlist } from '@/hooks/useWatchlist';

function WatchlistComponent() {
  const { 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist, 
    isInWatchlist 
  } = useWatchlist();

  return (
    <div>
      {watchlist.map(item => (
        <div key={item.symbol}>
          {item.name}
          <button onClick={() => removeFromWatchlist(item.symbol)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

## ⚡ **Performance Optimizations**

### **Client-Side**
- **Real-time Updates** - Only update changed data
- **Pagination** - Load data in chunks
- **Caching** - Use React Query or SWR
- **Debouncing** - Delay search requests
- **Virtual Scrolling** - For large lists

### **Server-Side**
- **Database Indexing** - On symbol, sector, date
- **Connection Pooling** - Reuse database connections
- **Rate Limiting** - Prevent API abuse
- **Caching** - Redis for frequently accessed data

## 🔒 **Security Features**

### **Authentication**
- **Supabase Auth** - User authentication
- **RLS Policies** - Row-level security
- **API Keys** - Server-side only

### **Data Protection**
- **Input Validation** - Sanitize all inputs
- **SQL Injection Prevention** - Parameterized queries
- **CORS Configuration** - Restrict origins
- **Rate Limiting** - Prevent abuse

## 📈 **Real-Time Features**

### **Live Price Updates**
- **WebSocket Connection** - Supabase Realtime
- **Automatic Reconnection** - Handle connection drops
- **Optimistic Updates** - Immediate UI updates

### **News Feed**
- **Real-time Notifications** - New articles
- **Sentiment Analysis** - Positive/negative scoring
- **Related Symbols** - Stock-specific news

### **Watchlist Management**
- **Instant Updates** - Add/remove stocks
- **Price Alerts** - Threshold notifications
- **Portfolio Tracking** - Performance metrics

## 🚀 **Deployment**

### **Production Setup**
1. **Environment Variables** - Set production keys
2. **Database Migration** - Run schema updates
3. **Edge Functions** - Deploy to Supabase
4. **Cron Jobs** - Schedule data fetching
5. **Monitoring** - Set up error tracking

### **Scaling Considerations**
- **CDN** - Cache static assets
- **Load Balancing** - Distribute traffic
- **Database Optimization** - Query performance
- **Caching Strategy** - Reduce API calls

## 🧪 **Testing**

### **Unit Tests**
```typescript
// Test stock service
import { realTimeStockService } from '@/lib/services/real-time-stock-service';

test('should fetch stocks', async () => {
  const result = await realTimeStockService.fetchStocks();
  expect(result.stocks).toBeDefined();
});
```

### **Integration Tests**
```typescript
// Test API endpoints
test('GET /api/stocks', async () => {
  const response = await fetch('/api/stocks');
  expect(response.status).toBe(200);
});
```

## 📚 **File Structure**
```
src/
├── app/api/
│   ├── stocks/
│   │   ├── route.ts
│   │   └── [symbol]/route.ts
│   ├── market-data/route.ts
│   ├── news/route.ts
│   └── watchlist/route.ts
├── lib/services/
│   ├── real-time-stock-service.ts
│   ├── watchlist-service.ts
│   └── supabase-realtime-service.ts
├── hooks/
│   ├── useRealTimeStocks.ts
│   └── useWatchlist.ts
└── components/
    └── StockSelection.tsx (updated)

supabase/functions/
├── fetch-stocks/index.ts
├── fetch-news/index.ts
└── cron-config.json
```

## 🎯 **Benefits**

### **Performance**
- ⚡ **Real-time Updates** - Live data without page refresh
- 🚀 **Fast Loading** - Optimized API responses
- 💾 **Efficient Caching** - Reduced server load

### **Security**
- 🔐 **Secure APIs** - Server-side key management
- 🛡️ **Data Protection** - RLS policies
- 🚫 **Rate Limiting** - Prevent abuse

### **User Experience**
- 📱 **Responsive Design** - Works on all devices
- 🔄 **Live Updates** - Real-time price changes
- ⚡ **Instant Actions** - Add/remove stocks quickly

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Connection Errors** - Check Supabase credentials
2. **Real-time Not Working** - Verify RLS policies
3. **Slow Loading** - Check database indexes
4. **API Errors** - Validate request parameters

### **Debug Tools**
- **Browser Console** - Client-side errors
- **Supabase Dashboard** - Database logs
- **Network Tab** - API request/response
- **React DevTools** - Component state

This integration provides a complete real-time stock data solution with optimal performance and security! 🚀
