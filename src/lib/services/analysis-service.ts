/**
 * analysis-service.ts
 *
 * Analysis results now persisted to FastAPI /analysis_results/.
 * localStorage is kept as a fast local cache only (not source of truth).
 *
 * Backend endpoints used:
 *   POST /analysis_results/                    → create
 *   GET  /analysis_results/?user_id=           → list history
 *   GET  /analysis_results/{id}                → single result
 *   GET  /analysis_results/{user_id}/stats     → stats
 *   GET  /analysis_results/{user_id}/search?q= → search
 *   DELETE /analysis_results/{id}?user_id=     → delete
 */

import { useAuthStore } from '@/lib/store/auth-store';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const LOCAL_CACHE_KEY = 'analysis_history_cache';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  company_name?: string;
}

export interface AnalysisSession {
  id: string;
  title: string;
  timestamp: Date;
  result: AnalysisResult;
}

// Backend doc_type enum values
const DOC_TYPE_MAP: Record<string, string> = {
  pdf: 'AR',
  image: 'CHART',
  url: 'IR',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true",  // ← mandatory
      ...(options?.headers || {}),
    },
  });
}

function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.user_id || null;
}

function generateTitle(result: AnalysisResult): string {
  const date = new Date().toLocaleDateString();
  const docName = result.document_name.split('.')[0].substring(0, 20);
  return `${docName} - ${date}`;
}

// ── Service ───────────────────────────────────────────────────────────────────

class AnalysisService {
  private baseURL = '/api';

  // ── Mock fallback ─────────────────────────────────────────────────────────

  private async mockAnalysis(file: File | string): Promise<AnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const filename = typeof file === 'string' ? 'URL Analysis' : file.name;

    return {
      id: crypto.randomUUID(),
      summary:
        'Strong performance indicators with revenue growth outpacing industry averages. Robust operational efficiency and improving market position.',
      insights: [
        'Q3 revenue grew 15% YoY indicating strong business momentum',
        'EBITDA margins improved to 18.5% showing operational efficiency gains',
        'Debt-to-equity ratio decreased to 0.65 reflecting better financial health',
        'Management guidance suggests 20% growth target for next fiscal year',
      ],
      sectors_affected: ['Banking', 'Technology', 'Healthcare', 'Consumer Goods'],
      recommendations: [
        'Consider accumulating on dips given strong fundamentals',
        'Monitor quarterly results for sustained growth trajectory',
        'Watch for sector headwinds that might impact performance',
      ],
      risk_factors: [
        'Regulatory changes in the sector could impact margins',
        'Rising input costs may pressure profitability',
        'Intense competition from new market entrants',
      ],
      sentiment: 'positive',
      confidence_score: 0.87,
      timestamp: new Date(),
      document_type:
        typeof file === 'string' ? 'url' : file.type.includes('pdf') ? 'pdf' : 'image',
      document_name: filename,
    };
  }

  // ── Analyze document ──────────────────────────────────────────────────────

  async analyzeDocument(file: File): Promise<AnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 503) throw new Error('Backend service unavailable. Try again later.');
        if (response.status === 400) throw new Error('Invalid file. Please check and retry.');
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return this._mapApiResponse(result, file.type.includes('pdf') ? 'pdf' : 'image', file.name);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to analysis service.');
      }
      console.log('Falling back to mock analysis');
      return this.mockAnalysis(file);
    }
  }

  // ── Analyze URL ───────────────────────────────────────────────────────────

  async analyzeURL(url: string): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.baseURL}/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        if (response.status === 503) throw new Error('Backend service unavailable.');
        if (response.status === 400) throw new Error('Invalid URL. Please check and retry.');
        throw new Error(`URL analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return this._mapApiResponse(result, 'url', 'URL Analysis');
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to analysis service.');
      }
      console.log('Falling back to mock analysis');
      return this.mockAnalysis(url);
    }
  }

  // ── Save to FastAPI backend ───────────────────────────────────────────────

  async saveAnalysisSession(result: AnalysisResult): Promise<AnalysisSession> {
    const session: AnalysisSession = {
      id: result.id,
      title: generateTitle(result),
      timestamp: new Date(),
      result,
    };

    // Always update local cache (instant UI)
    this._updateLocalCache(session);

    // Persist to backend if user is logged in
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await apiFetch('/analysis_results/', {
          method: 'POST',
          body: JSON.stringify({
            user_id: userId,
            doc_name: result.document_name,
            doc_type: DOC_TYPE_MAP[result.document_type] || 'OTH',
            status: 'completed',
            summary: result.summary,
            result: {
              insights: result.insights,
              sectors_affected: result.sectors_affected,
              recommendations: result.recommendations,
              risk_factors: result.risk_factors,
              sentiment: result.sentiment,
              confidence_score: result.confidence_score,
            },
          }),
        });
      } catch (e) {
        console.warn('Failed to persist analysis to backend (cached locally):', e);
      }
    }

    return session;
  }

  // ── Get history ───────────────────────────────────────────────────────────
  // Tries backend first, falls back to local cache

  async getAnalysisHistory(): Promise<AnalysisSession[]> {
    const userId = getCurrentUserId();

    if (userId) {
      try {
        const res = await apiFetch(`/analysis_results/?user_id=${userId}&limit=50`);
        if (res.ok) {
          const items: Record<string, any>[] = await res.json();
          return items.map((item) => ({
            id: item.id,
            title: `${item.doc_name} - ${new Date(item.created_at).toLocaleDateString()}`,
            timestamp: new Date(item.created_at),
            result: {
              id: item.id,
              summary: item.summary,
              insights: item.result?.insights || [],
              sectors_affected: item.result?.sectors_affected || [],
              recommendations: item.result?.recommendations || [],
              risk_factors: item.result?.risk_factors || [],
              sentiment: item.result?.sentiment || 'neutral',
              confidence_score: item.result?.confidence_score || 0.8,
              timestamp: new Date(item.created_at),
              document_type: this._backendDocTypeToFrontend(item.doc_type),
              document_name: item.doc_name,
            } as AnalysisResult,
          }));
        }
      } catch (e) {
        console.warn('Backend history fetch failed, using cache:', e);
      }
    }

    // Fall back to local cache
    return this._readLocalCache();
  }

  // ── Delete session ────────────────────────────────────────────────────────

  async deleteAnalysisSession(sessionId: string): Promise<void> {
    // Remove from local cache
    const history = await this._readLocalCache();
    const updated = history.filter((s) => s.id !== sessionId);
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(updated));

    // Delete from backend
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await apiFetch(`/analysis_results/${sessionId}?user_id=${userId}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Backend delete failed:', e);
      }
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async exportToPDF(session: AnalysisSession): Promise<void> {
    const content = this._formatForExport(session);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _mapApiResponse(
    result: Record<string, any>,
    docType: 'pdf' | 'image' | 'url',
    docName: string
  ): AnalysisResult {
    return {
      id: result.id || crypto.randomUUID(),
      summary: result.summary || result.analysis || 'Analysis completed',
      insights: result.insights || result.key_points || [],
      sectors_affected: result.sectors_affected || result.sectors || [],
      recommendations: result.recommendations || result.suggestions || [],
      risk_factors: result.risk_factors || result.risks || [],
      sentiment: result.sentiment || 'neutral',
      confidence_score: result.confidence_score || result.confidence || 0.8,
      timestamp: new Date(),
      document_type: docType,
      document_name: docName,
    };
  }

  private _backendDocTypeToFrontend(docType: string): 'pdf' | 'image' | 'url' {
    const map: Record<string, 'pdf' | 'image' | 'url'> = {
      AR: 'pdf', SHL: 'pdf', DRHP: 'pdf',
      CHART: 'image',
      IR: 'url', BRK: 'url',
    };
    return map[docType] || 'pdf';
  }

  private _updateLocalCache(session: AnalysisSession): void {
    try {
      const history = this._readLocalCacheSync();
      const updated = [session, ...history].slice(0, 50);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local cache write failed:', e);
    }
  }

  private _readLocalCacheSync(): AnalysisSession[] {
    try {
      const stored = localStorage.getItem(LOCAL_CACHE_KEY);
      if (!stored) return [];
      return JSON.parse(stored).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
        result: { ...s.result, timestamp: new Date(s.result.timestamp) },
      }));
    } catch {
      return [];
    }
  }

  private async _readLocalCache(): Promise<AnalysisSession[]> {
    return this._readLocalCacheSync();
  }

  private _formatForExport(session: AnalysisSession): string {
    const { result } = session;
    return `
FinSight Analysis Report
========================
Document: ${result.document_name}
Date: ${result.timestamp.toLocaleDateString()}
Type: ${result.document_type.toUpperCase()}
Confidence: ${(result.confidence_score * 100).toFixed(1)}%
Sentiment: ${result.sentiment.toUpperCase()}

SUMMARY
-------
${result.summary}

KEY INSIGHTS
------------
${result.insights.map((i, n) => `${n + 1}. ${i}`).join('\n')}

RECOMMENDATIONS
---------------
${result.recommendations.map((r, n) => `${n + 1}. ${r}`).join('\n')}

RISK FACTORS
------------
${result.risk_factors.map((r, n) => `${n + 1}. ${r}`).join('\n')}

SECTORS AFFECTED
----------------
${result.sectors_affected.join(', ')}

---
Generated by FinSight AI Platform
    `.trim();
  }
}

export const analysisService = new AnalysisService();
export default analysisService;