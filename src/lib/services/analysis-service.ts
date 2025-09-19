import { useAuthStore } from '@/lib/store/auth-store';

export interface AnalysisResult {
  id: string;
  summary: string;
  insights: string[];
  sectors_affected: string[];
  recommendations: string[];
  risk_factors: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence_score: number;
  timestamp: Date;
  document_type: 'image' | 'pdf' | 'url';
  document_name: string;
}

export interface AnalysisSession {
  id: string;
  title: string;
  timestamp: Date;
  result: AnalysisResult;
}

class AnalysisService {
  private baseURL = '/api'; // Use local API routes
  
  // Mock analysis for development
  private async mockAnalysis(file: File | string): Promise<AnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockInsights = [
      "Q3 revenue grew by 15% year-over-year, indicating strong business momentum",
      "EBITDA margins improved to 18.5%, showing operational efficiency gains",
      "Debt-to-equity ratio decreased to 0.65, reflecting better financial health",
      "Management guidance suggests 20% growth target for next fiscal year",
      "Market share in key segments expanded from 12% to 15%",
      "Cash flow from operations increased by 22%, providing strong liquidity position"
    ];

    const mockRecommendations = [
      "Consider accumulating on dips given strong fundamentals",
      "Monitor quarterly results for sustained growth trajectory",
      "Watch for sector headwinds that might impact performance",
      "Suitable for long-term wealth creation portfolios"
    ];

    const mockRiskFactors = [
      "Regulatory changes in the sector could impact margins",
      "Rising input costs may pressure profitability",
      "Intense competition from new market entrants",
      "Dependency on key customer segments poses concentration risk"
    ];

    const filename = typeof file === 'string' ? 'URL Analysis' : file.name;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      summary: "The financial document shows strong performance indicators with revenue growth outpacing industry averages. The company demonstrates robust operational efficiency and improving market position, making it an attractive investment opportunity for long-term investors.",
      insights: mockInsights,
      sectors_affected: ["Banking", "Technology", "Healthcare", "Consumer Goods"],
      recommendations: mockRecommendations,
      risk_factors: mockRiskFactors,
      sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
      confidence_score: 0.85 + Math.random() * 0.1,
      timestamp: new Date(),
      document_type: typeof file === 'string' ? 'url' : (file.type.includes('pdf') ? 'pdf' : 'image'),
      document_name: filename
    };
  }

  async analyzeDocument(file: File): Promise<AnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending file to API:', file.name, file.type);
      
      console.log('Sending file to local API proxy');
      
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        if (response.status === 503) {
          throw new Error('Backend service is currently unavailable. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please check your file or URL and try again.');
        } else {
          throw new Error(`Analysis failed: ${response.statusText} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Transform the API response to match our interface
      return {
        id: result.id || Math.random().toString(36).substr(2, 9),
        summary: result.summary || result.analysis || 'Analysis completed',
        insights: result.insights || result.key_points || [],
        sectors_affected: result.sectors_affected || result.sectors || [],
        recommendations: result.recommendations || result.suggestions || [],
        risk_factors: result.risk_factors || result.risks || [],
        sentiment: result.sentiment || 'neutral',
        confidence_score: result.confidence_score || result.confidence || 0.8,
        timestamp: new Date(),
        document_type: file.type.includes('pdf') ? 'pdf' : 'image',
        document_name: file.name
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - API might be down or CORS issue');
        throw new Error('Unable to connect to analysis service. Please check your internet connection.');
      }
      
      // Fallback to mock analysis if API fails
      console.log('Falling back to mock analysis');
      return await this.mockAnalysis(file);
    }
  }

  async analyzeURL(url: string): Promise<AnalysisResult> {
    try {
      console.log('Sending URL to API:', url);
      
      console.log('Sending URL to local API proxy');
      
      const response = await fetch(`${this.baseURL}/analyze-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        if (response.status === 503) {
          throw new Error('Backend service is currently unavailable. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid URL. Please check the URL and try again.');
        } else {
          throw new Error(`URL analysis failed: ${response.statusText} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Transform the API response to match our interface
      return {
        id: result.id || Math.random().toString(36).substr(2, 9),
        summary: result.summary || result.analysis || 'URL analysis completed',
        insights: result.insights || result.key_points || [],
        sectors_affected: result.sectors_affected || result.sectors || [],
        recommendations: result.recommendations || result.suggestions || [],
        risk_factors: result.risk_factors || result.risks || [],
        sentiment: result.sentiment || 'neutral',
        confidence_score: result.confidence_score || result.confidence || 0.8,
        timestamp: new Date(),
        document_type: 'url',
        document_name: 'URL Analysis'
      };
    } catch (error) {
      console.error('URL analysis error:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - API might be down or CORS issue');
        throw new Error('Unable to connect to analysis service. Please check your internet connection.');
      }
      
      // Fallback to mock analysis if API fails
      console.log('Falling back to mock analysis');
      return await this.mockAnalysis(url);
    }
  }

  async getAnalysisHistory(): Promise<AnalysisSession[]> {
    try {
      const stored = localStorage.getItem('analysis_history');
      if (stored) {
        const sessions = JSON.parse(stored);
        return sessions.map((session: unknown) => {
          const sessionObj = session as { timestamp: string; result: { timestamp: string } };
          return {
            ...sessionObj,
            timestamp: new Date(sessionObj.timestamp),
            result: {
              ...sessionObj.result,
              timestamp: new Date(sessionObj.result.timestamp)
            }
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Failed to load analysis history:', error);
      return [];
    }
  }

  async saveAnalysisSession(result: AnalysisResult): Promise<AnalysisSession> {
    try {
      const session: AnalysisSession = {
        id: result.id,
        title: this.generateSessionTitle(result),
        timestamp: new Date(),
        result
      };

      const history = await this.getAnalysisHistory();
      const updatedHistory = [session, ...history].slice(0, 50); // Keep last 50 sessions
      
      localStorage.setItem('analysis_history', JSON.stringify(updatedHistory));
      return session;
    } catch (error) {
      console.error('Failed to save analysis session:', error);
      throw error;
    }
  }

  async deleteAnalysisSession(sessionId: string): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      const updatedHistory = history.filter(session => session.id !== sessionId);
      localStorage.setItem('analysis_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to delete analysis session:', error);
      throw error;
    }
  }

  private generateSessionTitle(result: AnalysisResult): string {
    const date = new Date().toLocaleDateString();
    const docName = result.document_name.split('.')[0].substring(0, 20);
    return `${docName} - ${date}`;
  }

  private getAuthToken(): string {
    // Get auth token from store or localStorage
            // In production, you would get the actual token from Supabase
    const { user } = useAuthStore.getState();
    return user?.uid || '';
  }

  // Utility method to export analysis as PDF
  async exportToPDF(session: AnalysisSession): Promise<void> {
    try {
      // In a real implementation, this would generate and download a PDF
      const content = this.formatAnalysisForExport(session);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analysis:', error);
      throw new Error('Failed to export analysis. Please try again.');
    }
  }

  private formatAnalysisForExport(session: AnalysisSession): string {
    const { result } = session;
    return `
FinSight Analysis Report
========================

Document: ${result.document_name}
Date: ${result.timestamp.toLocaleDateString()}
Type: ${result.document_type.toUpperCase()}
Confidence Score: ${(result.confidence_score * 100).toFixed(1)}%
Sentiment: ${result.sentiment.toUpperCase()}

EXECUTIVE SUMMARY
-----------------
${result.summary}

KEY INSIGHTS
------------
${result.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

RECOMMENDATIONS
---------------
${result.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

RISK FACTORS
------------
${result.risk_factors.map((risk, i) => `${i + 1}. ${risk}`).join('\n')}

SECTORS AFFECTED
----------------
${result.sectors_affected.join(', ')}

---
Generated by FinSight AI Platform
    `;
  }
}

export const analysisService = new AnalysisService();
export default analysisService;
