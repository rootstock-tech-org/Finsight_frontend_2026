/**
 * PDF Generation Utility
 * Handles both FastAPI 'result' field and legacy 'analysis_data' field.
 * Also handles Groq's nested { Results: { ... } } response shape.
 */

export interface AnalysisData {
  id: string;
  file_name: string;
  company_name: string | null;
  document_type: string | null;
  analysis_data: any;   // populated by OCRAnalysisHistory before calling
  created_at: string;
  completed_at: string | null;
}

export class PDFGenerator {

  static async generateAnalysisPDF(analysis: AnalysisData): Promise<Blob> {
    const { jsPDF } = await import('jspdf');

    const doc        = new jsPDF();
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos         = 20;
    const margin     = 20;
    const contentW   = pageWidth - margin * 2;

    const addText = (text: string, fontSize = 12, bold = false, color = '#000000') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(color);
      const lines      = doc.splitTextToSize(text, contentW);
      const lineHeight = fontSize * 0.4;
      if (yPos + lines.length * lineHeight > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
      }
      lines.forEach((line: string) => { doc.text(line, margin, yPos); yPos += lineHeight; });
      yPos += 5;
    };

    const addSection = (title: string) => { yPos += 10; addText(title, 14, true, '#2563eb'); yPos += 5; };

    const isValid = (v: any): boolean => {
      if (!v) return false;
      if (typeof v === 'string') return v.trim() !== '' && !v.toLowerCase().includes('unknown') && v.trim() !== 'N/A';
      if (typeof v === 'object' && !Array.isArray(v)) return Object.keys(v).length > 0;
      if (Array.isArray(v)) return v.length > 0 && v.some(i => typeof i === 'string' && i.trim() !== '');
      return true;
    };

    // ── Normalise the data object ─────────────────────────────────────────
    // FastAPI wraps Groq output as: { result: { Results: { TECHNICAL SETUP: ... } } }
    // or sometimes:                 { result: { TECHNICAL SETUP: ... } }
    let raw = analysis.analysis_data || {};

    // Unwrap 'Results' key if present (Groq chart analysis shape)
    if (raw.Results && typeof raw.Results === 'object') {
      raw = raw.Results;
    }

    // ── Header ────────────────────────────────────────────────────────────
    addText('FinSight Analysis Report', 20, true, '#1e40af');

    const companyName =
      raw?.['Company Name'] ||
      raw?.company_name ||
      raw?.company ||
      analysis.company_name ||
      null;

    if (companyName) addText(companyName, 16, true, '#1f2937');
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10, false, '#6b7280');
    yPos += 10;

    addSection('Document Information');
    if (companyName && isValid(companyName)) addText(`Company: ${companyName}`, 12);
    if (analysis.document_type) addText(`Document Type: ${analysis.document_type}`, 12);
    if (analysis.file_name) addText(`File: ${analysis.file_name}`, 12);

    // ── Named sections in preferred order ────────────────────────────────
    const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

    const SECTIONS: Array<{ title: string; aliases: string[] }> = [
      { title: 'Technical Setup',         aliases: ['TECHNICAL SETUP', 'technical_setup', 'technical setup'] },
      { title: 'Risk Assessment',         aliases: ['RISK ASSESSMENT', 'risk_assessment', 'risk assessment'] },
      { title: 'Finsight Insights',       aliases: ['FINSIGHT_INSIGHTS', 'finsight_insights', 'FINSIGHT INSIGHTS', 'Finsight-Insight', 'finsight_insight'] },
      { title: 'Educational Hints',       aliases: ['EDUCATIONAL_HINTS', 'educational_hints', 'Educational Hints'] },
      { title: 'Market Context',          aliases: ['MARKET_CONTEXT', 'market_context', 'Market Context'] },
      { title: 'Financial Highlights',    aliases: ['FINANCIAL HIGHLIGHTS', 'financial_highlights'] },
      { title: 'Forward Looking',         aliases: ['FORWARD LOOKING STATEMENTS', 'forward_looking_statements'] },
      { title: 'Risks & Threats',         aliases: ['RISKS AND THREATS', 'risks_and_threats', 'Risks & Cautions', 'risks_and_cautions'] },
      { title: 'Tone of Management',      aliases: ['TONE OF MANAGEMENT', 'tone_of_management'] },
      { title: 'Finsight Insight',        aliases: ['FINSIGHT INSIGHT', 'finsight_insight'] },
      { title: 'Key Insights',            aliases: ['Key Insights', 'key_insights', 'insights'] },
      { title: 'Summary',                 aliases: ['Summary', 'summary'] },
      { title: 'Event Snapshot',          aliases: ['Event Snapshot', 'event_snapshot'] },
      { title: 'Impact on Indian Markets',aliases: ['Impact on Indian Markets', 'impact_on_indian_markets'] },
      { title: 'Valuation Metrics',       aliases: ['VALUATION METRICS', 'valuation_metrics'] },
      { title: 'Peer Comparison',         aliases: ['PEER COMPARISON', 'peer_comparison'] },
      { title: 'Business Overview',       aliases: ['BUSINESS OVERVIEW', 'business_overview'] },
      { title: 'IPO Details',             aliases: ['IPO DETAILS', 'ipo_details'] },
    ];

    const printedKeys = new Set<string>();

    const renderValue = (v: any) => {
      if (typeof v === 'string') {
        addText(v, 11);
      } else if (Array.isArray(v)) {
        v.forEach((item, i) => {
          if (typeof item === 'string' && isValid(item)) addText(`${i + 1}. ${item}`, 11);
          else if (typeof item === 'object' && item) addText(`${i + 1}. ${JSON.stringify(item)}`, 10);
        });
      } else if (typeof v === 'object' && v !== null) {
        // Render nested object fields
        Object.entries(v).forEach(([subKey, subVal]) => {
          if (!isValid(subVal)) return;
          addText(`${subKey}:`, 11, true);
          if (Array.isArray(subVal)) {
            (subVal as any[]).forEach((item, i) => addText(`  ${i + 1}. ${String(item)}`, 10));
          } else {
            addText(`  ${String(subVal)}`, 10);
          }
        });
      }
    };

    for (const section of SECTIONS) {
      const matchKey = Object.keys(raw).find(k => section.aliases.map(norm).includes(norm(k)));
      if (!matchKey) continue;
      const val = raw[matchKey];
      if (!isValid(val)) continue;
      addSection(section.title);
      renderValue(val);
      section.aliases.forEach(a => printedKeys.add(norm(a)));
      printedKeys.add(norm(matchKey));
    }

    // ── Remaining fields ──────────────────────────────────────────────────
    const excluded = new Set(['company','company_name','document_type','ir_subtype',
      'processing_time','cached','timestamp','document_id','category','ginni_version',
      'analysis_type','model','_detection','content_type','route','ocr_text_length',
      'text_length','news_category','newsCategory']);

    const remaining = Object.entries(raw).filter(([k, v]) =>
      !printedKeys.has(norm(k)) && !excluded.has(k.toLowerCase()) && isValid(v)
    );

    if (remaining.length > 0) {
      addSection('Additional Insights');
      for (const [k, v] of remaining) {
        const title = k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
          .replace(/(^|\s)\w/g, m => m.toUpperCase());
        addText(`${title}:`, 12, true);
        renderValue(v);
      }
    }

    // ── Disclaimer ────────────────────────────────────────────────────────
    yPos += 20;
    addText('Disclaimer', 12, true, '#333333');
    addText(
      'FinSight is an educational assistant, not a SEBI-registered investment advisor. ' +
      'We never execute trades. Every suggestion should be evaluated against your risk profile.',
      10, false, '#333333'
    );

    return doc.output('blob');
  }

  static async downloadPDF(analysis: AnalysisData): Promise<void> {
    try {
      const pdfBlob = await this.generateAnalysisPDF(analysis);
      const url  = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href  = url;
      link.download = `FinSight_Analysis_${(analysis.file_name || 'report').replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }
}