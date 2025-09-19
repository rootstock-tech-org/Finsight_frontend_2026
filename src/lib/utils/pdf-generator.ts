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
      
      // Key Insights
      if (data['Key Insights'] && isValidContent(data['Key Insights'])) {
        addSectionHeader('Key Insights');
        if (Array.isArray(data['Key Insights'])) {
          data['Key Insights'].forEach((insight: string, index: number) => {
            if (isValidContent(insight)) {
              addText(`${index + 1}. ${insight}`, 11);
            }
          });
        } else {
          addText(data['Key Insights'], 11);
        }
      }
      
      // Event Snapshot
      if (data['Event Snapshot'] && isValidContent(data['Event Snapshot'])) {
        addSectionHeader('Event Snapshot');
        addText(data['Event Snapshot'], 11);
      }
      
      // Finsight Insight
      if (data['Finsight Insight'] && isValidContent(data['Finsight Insight'])) {
        addSectionHeader('Finsight Insight');
        addText(data['Finsight Insight'], 11);
      }
      
      // Impact on Indian Markets
      if (data['Impact on Indian Markets'] && isValidContent(data['Impact on Indian Markets'])) {
        addSectionHeader('Impact on Indian Markets');
        addText(data['Impact on Indian Markets'], 11);
      }
      
      // Peer & Value Chain Read-through
      if (data['Peer & Value Chain Read-through'] && isValidContent(data['Peer & Value Chain Read-through'])) {
        addSectionHeader('Peer & Value Chain Read-through');
        addText(data['Peer & Value Chain Read-through'], 11);
      }
      
      // Risks & Cautions
      if (data['Risks & Cautions'] && isValidContent(data['Risks & Cautions'])) {
        addSectionHeader('Risks & Cautions');
        addText(data['Risks & Cautions'], 11);
      }
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
