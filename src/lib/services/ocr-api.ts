/**
 * GinniAI Document Analysis API Service
 * Integrates with the OCR API for financial document analysis
 * Base URL: https://e9cwq4w7punvx7-1002.proxy.runpod.net
 */

export interface DocumentAnalysisRequest {
  file: File;
  company_name?: string;
  max_pages?: number;
  use_cache?: boolean;
}

export interface DocumentAnalysisResponse {
  document_id?: string;
  status?: 'processing' | 'completed' | 'failed';
  analysis?: DocumentAnalysis;
  error?: string;
  message?: string;
}

export interface DocumentAnalysis {
  document_type: 'AR' | 'SHL' | 'IR' | 'BRK' | 'DIV' | 'DRHP' | 'OTH';
  company_name: string;
  analysis_date: string;
  insights: {
    financial_highlights?: FinancialHighlights;
    strategic_moves?: StrategicMoves;
    forward_looking?: ForwardLooking;
    risks?: RiskAnalysis;
    quarterly_results?: QuarterlyResults;
    valuation_metrics?: ValuationMetrics;
    peer_comparison?: PeerComparison;
    dividend_analysis?: DividendAnalysis;
    ipo_details?: IPODetails;
    general_insights?: GeneralInsights;
  };
  metadata: {
    pages_processed: number;
    processing_time: number;
    confidence_score: number;
    file_size: number;
    file_name: string;
  };
}

export interface FinancialHighlights {
  revenue: number;
  profit: number;
  growth_rate: number;
  key_metrics: Array<{
    metric: string;
    value: number;
    period: string;
  }>;
}

export interface StrategicMoves {
  acquisitions: string[];
  partnerships: string[];
  expansions: string[];
  strategic_initiatives: string[];
}

export interface ForwardLooking {
  guidance: string[];
  outlook: string[];
  risks: string[];
  opportunities: string[];
}

export interface RiskAnalysis {
  market_risks: string[];
  operational_risks: string[];
  financial_risks: string[];
  regulatory_risks: string[];
}

export interface QuarterlyResults {
  q1: QuarterlyData;
  q2: QuarterlyData;
  q3: QuarterlyData;
  q4: QuarterlyData;
}

export interface QuarterlyData {
  revenue: number;
  profit: number;
  growth: number;
  highlights: string[];
}

export interface ValuationMetrics {
  pe_ratio: number;
  pb_ratio: number;
  debt_to_equity: number;
  roe: number;
  roa: number;
}

export interface PeerComparison {
  peers: Array<{
    name: string;
    pe_ratio: number;
    pb_ratio: number;
    market_cap: number;
  }>;
  relative_performance: string;
}

export interface DividendAnalysis {
  dividend_yield: number;
  payout_ratio: number;
  dividend_history: Array<{
    year: number;
    amount: number;
    yield: number;
  }>;
  trends: string[];
}

export interface IPODetails {
  issue_size: number;
  price_band: {
    min: number;
    max: number;
  };
  listing_date: string;
  lead_managers: string[];
  business_overview: string;
}

export interface GeneralInsights {
  key_points: string[];
  trends: string[];
  recommendations: string[];
  summary: string;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
}

export interface SearchResult {
  document_id: string;
  company_name: string;
  document_type: string;
  relevance_score: number;
  snippet: string;
  analysis_date: string;
}

export interface CacheStats {
  total_documents: number;
  total_size_mb: number;
  document_types: Record<string, number>;
  last_updated: string;
}

export interface DocumentType {
  type: string;
  description: string;
  examples: string[];
}

export class OCRApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(config?: { baseUrl?: string; timeout?: number }) {
    this.baseUrl = config?.baseUrl || 'http://127.0.0.1:1002';
    this.timeout = config?.timeout || 300000; // 5 minutes for document processing
  }

  /**
   * Analyze a document synchronously
   */
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);

      const params = new URLSearchParams();
      if (request.max_pages) params.append('max_pages', request.max_pages.toString());
      if (request.use_cache !== undefined) params.append('use_cache', request.use_cache.toString());

      const url = `${this.baseUrl}/analyze?${params}`;
      
      console.log('🔍 [OCR-API] Starting document analysis:', {
        fileName: request.file.name,
        fileSize: request.file.size,
        fileType: request.file.type,
        url
      });
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      console.log('📡 [OCR-API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        const responseText = await response.text();
        try {
          const errorData = responseText ? JSON.parse(responseText) : null;
          if (errorData) {
            errorMessage += `, message: ${errorData.detail || errorData.message || 'Unknown error'}`;
          } else {
            errorMessage += `, response: ${responseText || 'empty body'}`;
          }
        } catch {
          errorMessage += `, response: ${responseText || 'empty body'}`;
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ [OCR-API] Non-JSON response received:', responseText);
        throw new Error(`Expected JSON response but got: ${contentType || 'unknown content type'}`);
      }

      // Parse JSON with better error handling
      let data;
      try {
        const responseText = await response.text();
        console.log('📄 [OCR-API] Raw response text length:', responseText.length);
        
        if (!responseText.trim()) {
          throw new Error('Empty response received from OCR API');
        }
        
        data = JSON.parse(responseText);
        console.log('✅ [OCR-API] Successfully parsed JSON response');
      } catch (jsonError) {
        console.error('❌ [OCR-API] JSON parsing error:', jsonError);
        const responseText = await response.text();
        console.error('❌ [OCR-API] Raw response that failed to parse:', responseText);
        throw new Error(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      }

      return {
        status: 'completed',
        analysis: data
      };

    } catch (error) {
      console.error('❌ [OCR-API] Error analyzing document:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze a document asynchronously
   */
  async analyzeDocumentAsync(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);

      const params = new URLSearchParams();
      if (request.company_name) params.append('company_name', request.company_name);
      if (request.max_pages) params.append('max_pages', request.max_pages.toString());
      if (request.use_cache !== undefined) params.append('use_cache', request.use_cache.toString());

      const url = `${this.baseUrl}/analyze-async?${params}`;
      
      console.log('🔄 [OCR-API] Starting async document analysis:', {
        fileName: request.file.name,
        fileSize: request.file.size,
        fileType: request.file.type,
        url
      });
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000) // 30 seconds for async submission
      });

      console.log('📡 [OCR-API] Async response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += `, message: ${errorData.detail || errorData.message || 'Unknown error'}`;
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += `, response: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON with better error handling
      let data;
      try {
        const responseText = await response.text();
        console.log('📄 [OCR-API] Async raw response text length:', responseText.length);
        
        if (!responseText.trim()) {
          throw new Error('Empty response received from OCR API');
        }
        
        data = JSON.parse(responseText);
        console.log('✅ [OCR-API] Successfully parsed async JSON response');
      } catch (jsonError) {
        console.error('❌ [OCR-API] Async JSON parsing error:', jsonError);
        const responseText = await response.text();
        console.error('❌ [OCR-API] Raw async response that failed to parse:', responseText);
        throw new Error(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      }

      return {
        document_id: data.document_id,
        status: 'processing',
        message: 'Document submitted for analysis'
      };

    } catch (error) {
      console.error('❌ [OCR-API] Error submitting document for analysis:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get processing status of an async analysis
   */
  async getProcessingStatus(documentId: string): Promise<DocumentAnalysisResponse> {
    try {
      const url = `${this.baseUrl}/status/${documentId}`;
      
      console.log('🔍 [OCR-API] Checking processing status for document:', documentId);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      console.log('📡 [OCR-API] Status response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += `, message: ${errorData.detail || errorData.message || 'Unknown error'}`;
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += `, response: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON with better error handling
      let data;
      try {
        const responseText = await response.text();
        console.log('📄 [OCR-API] Status raw response text length:', responseText.length);
        
        if (!responseText.trim()) {
          throw new Error('Empty response received from OCR API status endpoint');
        }
        
        data = JSON.parse(responseText);
        console.log('✅ [OCR-API] Successfully parsed status JSON response');
      } catch (jsonError) {
        console.error('❌ [OCR-API] Status JSON parsing error:', jsonError);
        const responseText = await response.text();
        console.error('❌ [OCR-API] Raw status response that failed to parse:', responseText);
        throw new Error(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      }

      return {
        document_id: documentId,
        status: data.status || 'processing',
        analysis: data.analysis,
        error: data.error
      };

    } catch (error) {
      console.error('❌ [OCR-API] Error getting processing status:', error);
      return {
        document_id: documentId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for similar documents
   */
  async searchDocuments(request: SearchRequest): Promise<SearchResult[]> {
    try {
      const url = `${this.baseUrl}/search`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          top_k: request.top_k || 5
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const url = `${this.baseUrl}/cache/stats`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Get supported document types
   */
  async getDocumentTypes(): Promise<DocumentType[]> {
    try {
      const url = `${this.baseUrl}/document-types`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting document types:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const url = `${this.baseUrl}/health`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return { status: 'healthy', message: 'OCR API is responding correctly' };
      } else {
        return { status: 'unhealthy', message: `OCR API returned status ${response.status}` };
      }

    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `OCR API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Export singleton instance
export const ocrApi = new OCRApiService();

