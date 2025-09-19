# 🔍 OCR Document Analysis Integration

## 📋 **Overview**
This integration connects your FinSight application with the GinniAI Document Analysis API (`https://e9cwq4w7punvx7-1002.proxy.runpod.net`) to provide AI-powered financial document analysis. The system supports PDF and image uploads, processes them using OCR technology, and stores the results in Supabase for history tracking.

## 🏗️ **Architecture**

### **API Integration**
- **Base URL**: `https://e9cwq4w7punvx7-1002.proxy.runpod.net`
- **Document Analysis**: `/analyze` (sync) and `/analyze-async` (async)
- **Status Check**: `/status/{document_id}`
- **Search**: `/search` for similar documents
- **Health Check**: `/health`

### **Database Schema**
- **`document_analysis`**: Main table for analysis records
- **`document_analysis_search`**: Search history tracking
- **`document_analysis_files`**: File metadata storage

### **Frontend Components**
- **`OCRDocumentUpload`**: Drag-and-drop upload interface
- **`OCRAnalysisHistory`**: History management and viewing
- **`OCRPage`**: Main page combining upload and history

## 🔧 **Implementation Details**

### **1. OCR API Service** (`src/lib/services/ocr-api.ts`)

```typescript
// Key Features:
- Document analysis (sync/async)
- Status monitoring
- Document search
- Health checking
- Error handling and retries
```

**Supported Document Types:**
- **AR**: Annual Report
- **SHL**: Shareholder Letter  
- **IR**: Investor Relations
- **BRK**: Broker Note
- **DIV**: Dividend Report
- **DRHP**: IPO Prospectus
- **OTH**: Other documents

### **2. API Routes**

#### **Upload Route** (`/api/ocr/upload`)
- **POST**: Upload and analyze documents
- **GET**: Get upload status and supported file types
- Supports both sync and async processing
- File validation and size limits
- Authentication required

#### **History Route** (`/api/ocr/history`)
- **GET**: Fetch analysis history with pagination and filtering
- **DELETE**: Delete specific analyses or all analyses
- Statistics and search functionality
- User-specific data access

#### **Search Route** (`/api/ocr/search`)
- **POST**: Search for similar documents
- **GET**: Get search history
- Semantic search using OCR API
- Search result caching

#### **Status Route** (`/api/ocr/status/[analysis_id]`)
- **GET**: Check analysis processing status
- **PUT**: Update analysis status manually
- Real-time status monitoring
- External API status checking

### **3. Database Schema**

```sql
-- Main analysis table
CREATE TABLE document_analysis (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    document_id TEXT UNIQUE, -- External API document ID
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    company_name TEXT,
    document_type TEXT CHECK (document_type IN ('AR', 'SHL', 'IR', 'BRK', 'DIV', 'DRHP', 'OTH')),
    status TEXT CHECK (status IN ('processing', 'completed', 'failed')),
    analysis_data JSONB, -- Full analysis results
    metadata JSONB, -- Processing metadata
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### **4. Frontend Components**

#### **OCRDocumentUpload Component**
- **Drag-and-drop interface** for file uploads
- **File validation** (type, size limits)
- **Progress tracking** for uploads and processing
- **Real-time status updates**
- **Error handling and user feedback**

#### **OCRAnalysisHistory Component**
- **Analysis history display** with pagination
- **Search and filtering** capabilities
- **Statistics dashboard** with key metrics
- **Bulk operations** (delete selected/all)
- **Status monitoring** for processing documents

## 📊 **Data Flow**

### **Upload Process**
```
1. User uploads file via OCRDocumentUpload
2. File validation (type, size)
3. Create database record with 'processing' status
4. Send file to OCR API (sync or async)
5. Update database with results
6. Display results to user
```

### **Status Monitoring**
```
1. User views history via OCRAnalysisHistory
2. Check database for processing documents
3. Query external API for status updates
4. Update database with latest status
5. Refresh UI with current status
```

### **Search Process**
```
1. User enters search query
2. Send query to OCR API search endpoint
3. Save search to history
4. Display results to user
5. Allow result interaction
```

## 🚀 **API Usage Examples**

### **Upload Document**
```bash
POST /api/ocr/upload
Content-Type: multipart/form-data

file: [PDF/Image file]
company_name: "Apple Inc"
max_pages: 1000
use_cache: true
async: false
```

### **Get Analysis History**
```bash
GET /api/ocr/history?page=1&limit=10&status=completed&search=apple
Authorization: Bearer [token]
```

### **Search Documents**
```bash
POST /api/ocr/search
Content-Type: application/json

{
  "query": "Apple quarterly results",
  "top_k": 5
}
```

### **Check Analysis Status**
```bash
GET /api/ocr/status/[analysis_id]
Authorization: Bearer [token]
```

## 📈 **Response Formats**

### **Analysis Response**
```json
{
  "document_type": "AR",
  "company_name": "Apple Inc",
  "analysis_date": "2024-01-15T10:30:00Z",
  "insights": {
    "financial_highlights": {
      "revenue": 1000000000,
      "profit": 100000000,
      "growth_rate": 10.5
    },
    "strategic_moves": {
      "acquisitions": ["Company A", "Company B"],
      "partnerships": ["Partner X", "Partner Y"]
    }
  },
  "metadata": {
    "pages_processed": 50,
    "processing_time": 30000,
    "confidence_score": 0.95
  }
}
```

### **History Response**
```json
{
  "analyses": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "statistics": {
    "total": 25,
    "completed": 20,
    "processing": 3,
    "failed": 2,
    "totalFileSize": 50000000,
    "documentTypes": {
      "AR": 10,
      "IR": 8,
      "BRK": 7
    }
  }
}
```

## ⚙️ **Configuration**

### **Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: OCR API Configuration
OCR_API_BASE_URL=https://e9cwq4w7punvx7-1002.proxy.runpod.net
OCR_API_TIMEOUT=300000
```

### **File Upload Limits**
- **Max file size**: 50MB
- **Supported types**: PDF, JPEG, PNG
- **Max pages**: 1000 (configurable)
- **Concurrent uploads**: Limited by server capacity

## 🛡️ **Security Features**

### **Authentication**
- JWT token validation for all API routes
- User-specific data access (RLS policies)
- Secure file upload handling

### **Data Protection**
- Row Level Security (RLS) enabled
- User data isolation
- Secure file storage
- Input validation and sanitization

### **Error Handling**
- Graceful API failures
- User-friendly error messages
- Comprehensive logging
- Fallback mechanisms

## 📱 **User Interface Features**

### **Upload Interface**
- ✅ **Drag-and-drop** file upload
- ✅ **File validation** with clear error messages
- ✅ **Progress tracking** for uploads and processing
- ✅ **Real-time status** updates
- ✅ **Batch upload** support

### **History Interface**
- ✅ **Search and filter** capabilities
- ✅ **Pagination** for large datasets
- ✅ **Statistics dashboard** with key metrics
- ✅ **Bulk operations** for management
- ✅ **Status monitoring** for processing documents

### **Analysis Display**
- ✅ **Structured data** presentation
- ✅ **Document type** classification
- ✅ **Company information** extraction
- ✅ **Financial metrics** highlighting
- ✅ **Download** functionality

## 🧪 **Testing**

### **API Testing**
```bash
# Test upload
curl -X POST http://localhost:3000/api/ocr/upload \
  -H "Authorization: Bearer [token]" \
  -F "file=@document.pdf" \
  -F "company_name=Test Company"

# Test history
curl -X GET "http://localhost:3000/api/ocr/history?page=1&limit=10" \
  -H "Authorization: Bearer [token]"

# Test search
curl -X POST http://localhost:3000/api/ocr/search \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "top_k": 5}'
```

### **Component Testing**
- Upload component with various file types
- History component with different data states
- Error handling and edge cases
- Responsive design testing

## 📁 **Files Created/Modified**

### **New Files**
- `src/lib/services/ocr-api.ts` - OCR API service
- `src/app/api/ocr/upload/route.ts` - Upload API route
- `src/app/api/ocr/history/route.ts` - History API route
- `src/app/api/ocr/search/route.ts` - Search API route
- `src/app/api/ocr/status/[analysis_id]/route.ts` - Status API route
- `src/components/OCRDocumentUpload.tsx` - Upload component
- `src/components/OCRAnalysisHistory.tsx` - History component
- `src/app/ocr/page.tsx` - Main OCR page
- `ocr-document-analysis-schema.sql` - Database schema
- `OCR_INTEGRATION_DOCUMENTATION.md` - This documentation

### **Database Schema**
- `document_analysis` table with RLS policies
- `document_analysis_search` table for search history
- `document_analysis_files` table for file metadata
- Indexes for performance optimization
- Helper functions for statistics and search

## 🎯 **Next Steps**

1. **Apply Database Schema**: Run the SQL migration to create the required tables
2. **Test Upload Functionality**: Upload sample documents to verify the integration
3. **Configure Authentication**: Ensure proper JWT token handling
4. **Monitor Performance**: Track API response times and error rates
5. **Enhance UI**: Add more detailed analysis result displays
6. **Add Notifications**: Implement real-time status updates
7. **Optimize Caching**: Implement smart caching strategies

## 🔧 **Maintenance**

### **Monitoring**
- Track API response times
- Monitor error rates and types
- Check database performance
- Monitor file storage usage

### **Updates**
- Update API endpoints if external API changes
- Adjust timeout values based on performance
- Add new document types as supported
- Enhance error handling based on usage patterns

The OCR document analysis integration is now complete and ready for use! 🚀

## 📞 **Support**

For issues or questions regarding the OCR integration:
1. Check the API logs for error details
2. Verify database schema is properly applied
3. Ensure authentication tokens are valid
4. Check external API status and availability
5. Review file upload limits and supported formats


