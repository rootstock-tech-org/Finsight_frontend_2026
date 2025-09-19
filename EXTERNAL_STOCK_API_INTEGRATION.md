# 🔗 External Stock API Integration

## 📋 **Overview**
This integration connects your FinSight application with the external stock API hosted at `https://e9cwq4w7punvx7-1003.proxy.runpod.net` to provide real-time stock data, search functionality, and price information.

## 🏗️ **Architecture**

### **API Endpoints**
- **Base URL**: `https://e9cwq4w7punvx7-1003.proxy.runpod.net`
- **Search**: `GET /api/stocks/search?query={query}`
- **Price**: `GET /api/stock/{symbol}/price`

### **Integration Points**
1. **Server-Side API Routes** - Handle external API calls
2. **External Stock Service** - Centralized API client
3. **Database Integration** - Cache and store external data
4. **Fallback Mechanism** - Database fallback when external API fails

## 🔧 **Implementation**

### **1. External Stock Service** (`src/lib/services/external-stock-api.ts`)

```typescript
// Key Features:
- Stock search by query
- Individual stock price fetching
- Batch price operations
- Popular stocks and market indices
- Health check functionality
- Error handling and fallbacks
```

### **2. Updated API Routes**

#### **Main Stocks Route** (`/api/stocks`)
- **GET** with `?external=true&search={query}` - Uses external API
- **GET** without external flag - Uses database
- **Automatic fallback** to database if external API fails

#### **Individual Stock Route** (`/api/stocks/[symbol]`)
- **GET** with `?external=true` - Fetches fresh external data
- **GET** with `?refresh=true` - Updates cached data
- **Automatic upsert** of external data to database

#### **External API Route** (`/api/stocks/external`)
- **GET** with `?action=search&query={query}` - Search stocks
- **GET** with `?action=price&symbol={symbol}` - Get price
- **GET** with `?action=popular` - Get popular stocks
- **GET** with `?action=indices` - Get market indices
- **GET** with `?action=health` - Health check
- **POST** with batch operations

## 📊 **API Usage Examples**

### **Search Stocks**
```bash
# Search using external API
GET /api/stocks?external=true&search=AAPL

# Search using database
GET /api/stocks?search=AAPL
```

### **Get Stock Price**
```bash
# Get fresh external price
GET /api/stocks/AAPL?external=true

# Refresh cached price
GET /api/stocks/AAPL?refresh=true

# Get cached price
GET /api/stocks/AAPL
```

### **External API Direct**
```bash
# Search stocks
GET /api/stocks/external?action=search&query=Apple

# Get price
GET /api/stocks/external?action=price&symbol=AAPL

# Get popular stocks
GET /api/stocks/external?action=popular

# Health check
GET /api/stocks/external?action=health
```

### **Batch Operations**
```bash
# Batch price lookup
POST /api/stocks/external
{
  "action": "batch-prices",
  "symbols": ["AAPL", "MSFT", "GOOGL"]
}

# Search and get prices
POST /api/stocks/external
{
  "action": "search-and-prices",
  "query": "technology"
}
```

## 🔄 **Data Flow**

### **Search Flow**
```
Client Request → API Route → External API → Process Results → Return to Client
     ↓
Database Cache (if successful)
```

### **Price Flow**
```
Client Request → API Route → External API → Update Database → Return to Client
     ↓
Fallback to Database (if external fails)
```

## 📈 **Response Format**

### **Stock Search Response**
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "company_name": "Apple Inc.",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "current_price": 150.25,
      "last_price": 150.25,
      "change_percent": 1.25,
      "volume": 50000000,
      "market_cap": 2500000000000,
      "last_updated": "2024-01-15T10:30:00Z",
      "source": "external"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "source": "external"
}
```

### **Price Data Response**
```json
{
  "symbol": "AAPL",
  "last_price": 150.25,
  "change": 1.85,
  "change_percent": 1.25,
  "volume": 50000000,
  "market_cap": 2500000000000,
  "high_52w": 180.00,
  "low_52w": 120.00,
  "open": 149.50,
  "previous_close": 148.40,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## ⚙️ **Configuration**

### **Environment Variables**
```env
# Optional: External API key (if required)
EXTERNAL_STOCK_API_KEY=your_api_key_here

# Existing Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Service Configuration**
```typescript
// Custom configuration
const externalStockApi = new ExternalStockApiService({
  baseUrl: 'https://e9cwq4w7punvx7-1003.proxy.runpod.net',
  apiKey: process.env.EXTERNAL_STOCK_API_KEY,
  timeout: 10000
});
```

## 🛡️ **Error Handling**

### **Fallback Strategy**
1. **Primary**: External API call
2. **Fallback**: Database lookup
3. **Error Response**: Clear error message with details

### **Error Types**
- **Authentication Errors**: API key issues
- **Network Errors**: Connection timeouts
- **Rate Limiting**: Too many requests
- **Data Errors**: Invalid responses

### **Error Response Format**
```json
{
  "error": "External API request failed",
  "details": "Authentication failed. Your API token has either expired or is invalid.",
  "fallback": "Using database data"
}
```

## 🚀 **Performance Features**

### **Caching Strategy**
- **Database Cache**: Store external data locally
- **Automatic Updates**: Refresh stale data
- **Batch Operations**: Multiple requests in one call

### **Optimization**
- **Timeout Handling**: 10-second default timeout
- **Parallel Requests**: Batch operations for multiple stocks
- **Error Recovery**: Graceful degradation to database

## 🧪 **Testing**

### **Health Check**
```bash
GET /api/stocks/external?action=health
```

### **Test Search**
```bash
GET /api/stocks?external=true&search=Apple
```

### **Test Price**
```bash
GET /api/stocks/AAPL?external=true
```

## 📚 **Integration Benefits**

### **Real-Time Data**
- ✅ **Live Prices**: Current market prices
- ✅ **Fresh Data**: Up-to-date information
- ✅ **Market Indices**: Major market indicators

### **Enhanced Search**
- ✅ **Symbol Search**: Find stocks by symbol
- ✅ **Company Search**: Find by company name
- ✅ **Sector Search**: Filter by industry

### **Reliability**
- ✅ **Fallback System**: Database backup
- ✅ **Error Handling**: Graceful failures
- ✅ **Caching**: Performance optimization

## 🔧 **Maintenance**

### **Monitoring**
- Check external API health regularly
- Monitor error rates and response times
- Track database cache hit rates

### **Updates**
- Update API endpoints if external API changes
- Adjust timeout values based on performance
- Add new features as external API evolves

## 📁 **Files Created/Modified**

### **New Files**
- `src/lib/services/external-stock-api.ts` - External API service
- `src/app/api/stocks/external/route.ts` - External API routes
- `EXTERNAL_STOCK_API_INTEGRATION.md` - This documentation

### **Modified Files**
- `src/app/api/stocks/route.ts` - Added external API integration
- `src/app/api/stocks/[symbol]/route.ts` - Added external price fetching

## 🎯 **Next Steps**

1. **Test the Integration**: Use the API endpoints to verify functionality
2. **Add API Key**: Configure authentication if required
3. **Monitor Performance**: Track response times and error rates
4. **Enhance Features**: Add more external API capabilities
5. **Update UI**: Integrate with frontend components

The external stock API integration is now complete and ready for use! 🚀


