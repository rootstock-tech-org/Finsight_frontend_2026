/**
 * PDF Generation Utility
 * Generates PDF reports for analysis results
 */

export interface AnalysisData {
  id: string;
  file_name: string;
  company_name: string | null;
  document_type: string | null;
  analysis_data: any;
  created_at: string;
  completed_at: string | null;
}

export interface PDFReportData {
  title: string;
  company: string;
  documentType: string;
  date: string;
  keyInsights: string[];
  eventSnapshot: string;
  finsightInsight: string;
  marketImpact: string;
  peerValueChain: string;
  risksCautions: string;
}

export class PDFGenerator {
  /**
   * Generate PDF from analysis data
   */
  static async generateAnalysisPDF(analysis: AnalysisData): Promise<Blob> {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.4;
      
      // Check if we need a new page
      if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }
      
      lines.forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += 5; // Add some spacing
    };
    
    // Helper function to add a section header
    const addSectionHeader = (title: string) => {
      yPosition += 10;
      addText(title, 14, true, '#2563eb');
      yPosition += 5;
    };
    
    // Helper function to check if content is valid (not Unknown or empty)
    const isValidContent = (content: any): boolean => {
      if (!content) return false;
      if (typeof content === 'string') {
        return content.trim() !== '' && 
               !content.toLowerCase().includes('unknown') && 
               content.trim() !== 'N/A';
      }
      if (Array.isArray(content)) {
        return content.length > 0 && content.some(item => 
          typeof item === 'string' && 
          item.trim() !== '' && 
          !item.toLowerCase().includes('unknown')
        );
      }
      return true;
    };
    
    // Header
    addText('FinSight Analysis Report', 20, true, '#1e40af');
    
    // Add company name prominently if available
    const companyName = analysis.analysis_data?.['Company Name'] || analysis.company_name;
    if (companyName) {
      addText(companyName, 16, true, '#1f2937');
    }
    
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10, false, '#6b7280');
    yPosition += 10;
    
    // Document Information
    addSectionHeader('Document Information');
    
    // Only show company name
    if (companyName && isValidContent(companyName)) {
      addText(`Company: ${companyName}`, 12);
    }
    
    // Analysis Data
    if (analysis.analysis_data) {
      const data = analysis.analysis_data;

      // Helpers to find content across naming variants
      const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
      const findValue = (aliases: string[]): any => {
        const keys = Object.keys(data);
        const aliasSet = new Set(aliases.map(norm));
        for (const key of keys) {
          if (aliasSet.has(norm(key))) return data[key];
        }
        return undefined;
      };

      // Keep track of printed keys to avoid duplicates
      const printedKeys = new Set<string>();
      const markPrinted = (aliases: string[]) => aliases.forEach(a => printedKeys.add(norm(a)));

      // Ordered sections with aliases to support multiple providers/key styles
      const sections: Array<{ title: string; aliases: string[] }> = [
        { title: 'Key Insights', aliases: ['Key Insights', 'key_insights', 'insights', 'Highlights'] },
        { title: 'Event Snapshot', aliases: ['Event Snapshot', 'event_snapshot', 'Event Overview'] },
        { title: 'Finsight Insight', aliases: ['Finsight Insight', 'Finsight-Insight', 'finsight_insight'] },
        { title: 'Impact on Indian Markets', aliases: ['Impact on Indian Markets', 'impact_on_indian_markets'] },
        { title: 'Peer & Value Chain Read-through', aliases: ['Peer & Value Chain Read-through', 'peer_value_chain_read_through', 'peer & value chain read-through'] },
        { title: 'Winners vs Losers (Sector/Stocks)', aliases: ['Winners vs Losers (Sector/Stocks)', 'winners vs losers (sector/stocks)', 'winners_vs_losers', 'Winners Vs Losers (sector/stocks)'] },
        { title: 'Trade Measure Snapshot', aliases: ['Trade Measure Snapshot', 'trade_measure_snapshot'] },
        { title: 'India Trade Linkages', aliases: ['India Trade Linkages', 'india_trade_linkages'] },
        { title: 'Data Snapshot', aliases: ['Data Snapshot', 'data_snapshot'] },
        { title: 'Signal Interpretation', aliases: ['Signal Interpretation', 'signal_interpretation'] },
        { title: 'Summary', aliases: ['Summary', 'summary'] },
        { title: 'Risks & Cautions', aliases: ['Risks & Cautions', 'risks & cautions', 'risks_and_cautions', 'risks', 'cautions'] },
      ];

      for (const section of sections) {
        const val = findValue(section.aliases);
        if (isValidContent(val)) {
          addSectionHeader(section.title);
          if (Array.isArray(val)) {
            val.forEach((item: any, idx: number) => {
              if (isValidContent(item)) addText(`${idx + 1}. ${String(item)}`, 11);
            });
          } else {
            addText(String(val), 11);
          }
          markPrinted(section.aliases);
        }
      }

      // Print any remaining non-empty fields as a generic Key Insights list
      try {
        const excluded = new Set(['company','document_type','ir_subtype','processing_time','cached','timestamp','document_id','category','news_category','newsCategory']);
        const remainingEntries = Object.entries(data).filter(([k, v]) => !printedKeys.has(norm(k)) && !excluded.has(k) && isValidContent(v));
        if (remainingEntries.length > 0) {
          addSectionHeader('Additional Insights');
          for (const [k, v] of remainingEntries) {
            const title = k.replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/(^|\s)\w/g, (m) => m.toUpperCase());
            addText(`${title}:`, 12, true);
            if (Array.isArray(v)) {
              v.forEach((item: any, idx: number) => isValidContent(item) && addText(`- ${String(item)}`, 11));
            } else {
              addText(String(v), 11);
            }
          }
        }
      } catch (_) {}
    }
    
    // Footer with disclaimer
    yPosition += 20;
    addText('Disclaimer', 12, true, '#333333');
    addText('FinSight is an educational assistant, not a SEBI-registered investment advisor. We never execute trades. Every suggestion should be evaluated against your risk profile.', 10, false, '#333333');
    
    // Generate PDF blob
    return doc.output('blob');
  }
  
  /**
   * Download PDF file
   */
  static async downloadPDF(analysis: AnalysisData): Promise<void> {
    try {
      const pdfBlob = await this.generateAnalysisPDF(analysis);
      const url = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `FinSight_Analysis_${analysis.file_name.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
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
