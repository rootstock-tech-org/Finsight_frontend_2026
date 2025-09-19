import React, { useState } from "react";
import { FileText, CheckCircle, HelpCircle, Upload, X, Loader2, TrendingUp, AlertTriangle, Target, BarChart3 } from "lucide-react";
import { useTranslation } from "../context/LanguageContext";
import { analysisService } from "../lib/services/analysis-service";

interface AnalysisResult {
  id: string;
  summary: string;
  insights: string[];
  sectors_affected: string[];
  recommendations: string[];
  risk_factors: string[];
  sentiment: string;
  confidence_score: number;
  timestamp: Date;
  document_type: string;
  document_name: string;
}

interface DocumentSectionProps {
  onSubmit: (file: File | null, url?: string | null) => void;
  darkMode: boolean;
  isLoading?: boolean;
}

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

const DocumentSection: React.FC<DocumentSectionProps> = ({
  onSubmit,
  darkMode,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showSupportedTypes, setShowSupportedTypes] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the upload area completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Check if file type is supported
      if (file.type.startsWith("image/") || file.type === "application/pdf" || file.type.includes("document")) {
        handleFileSelect(file);
      } else {
        alert("Please upload an image, PDF, or document file.");
      }
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (
      file.type === "application/pdf" ||
      file.type.includes("document")
    ) {
      setPreviewUrl(null);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const handleUploadAreaClick = () => {
    if (!uploadedFile) {
      document.getElementById('file-upload')?.click();
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile && !imageUrl.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    
    try {
      console.log('Starting analysis:', { file: uploadedFile?.name, url: imageUrl });
      
      let result: AnalysisResult;
      if (uploadedFile) {
        result = await analysisService.analyzeDocument(uploadedFile);
      } else {
        // For URL analysis, we'll need to implement this in the service
        throw new Error('URL analysis not implemented yet');
      }
      
      setAnalysisResult(result);
      console.log('Analysis completed:', result);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = (uploadedFile || imageUrl.trim()) && !isAnalyzing;
  
  const resetAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setUploadedFile(null);
    setImageUrl("");
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
          darkMode ? "bg-gray-800" : "bg-gray-50"
        } ${
          isDragging
            ? darkMode
              ? "border-green-400 bg-gray-700 scale-105"
              : "border-green-500 bg-green-50 scale-105"
            : uploadedFile
            ? darkMode
              ? "border-green-400 bg-gray-700"
              : "border-green-500 bg-green-50"
            : darkMode
            ? "border-gray-600 hover:border-gray-500 hover:bg-gray-700"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-100"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
        aria-label={t("dropArea")}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          accept={isMobile() ? "image/*,.pdf" : "image/*,.pdf,.doc,.docx"}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center">
              {uploadedFile ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : isDragging ? (
                <div className="text-4xl animate-pulse">📁</div>
              ) : (
                <Upload className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </div>

          {/* Preview for uploaded file */}
          {uploadedFile && (
            <div className="flex justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-xs max-h-48 rounded-lg shadow-md"
                />
              ) : (
                <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded-lg shadow-md">
                  <FileText
                    className={`w-16 h-16 ${
                      darkMode ? "text-gray-600" : "text-gray-500"
                    }`}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <h3
              className={`text-lg sm:text-xl font-semibold mb-2 break-words ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {uploadedFile
                ? `${t('fileReady')}: ${
                    uploadedFile.name.length > 30
                      ? `${uploadedFile.name.substring(0, 27)}...`
                      : uploadedFile.name
                  }`
                : t('fromImageToInsight')}
            </h3>
            <p
              className={`text-base ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {uploadedFile
                ? t('clickAnalyzeForInsights')
                : isDragging
                ? "Drop your file here to upload"
                : "Click anywhere or drag & drop your file here"}
            </p>
          </div>

          {/* File Upload Button - Only show when no file is uploaded */}
          {!uploadedFile && (
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className={`inline-block px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent triggering the parent click
              >
                {t('chooseDocument')}
              </label>
              <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Supports: Images, PDFs, Documents
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {uploadedFile && (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <label
                htmlFor="file-upload"
                className={`px-6 py-3 rounded-xl font-semibold cursor-pointer transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {t('changeDocument')}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* URL Input */}
      <div className="w-full">
        <input
          type="url"
          id="url-input"
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder={`🔗 ${t('orPasteWebLink')}`}
          className={`w-full px-4 py-3 rounded-xl border text-base transition-colors ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
          } focus:outline-none focus:ring-2 ${
            darkMode ? "focus:ring-blue-400" : "focus:ring-blue-500"
          } focus:ring-opacity-20`}
        />
      </div>

      {/* Analyze Button */}
      {canAnalyze && !analysisResult && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className={`px-8 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg ${
              isAnalyzing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isAnalyzing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </div>
            ) : (
              t('analyzeDocument')
            )}
          </button>
        </div>
      )}

      {/* Help Section */}
      <div className="text-center">
        <button
          onClick={() => setShowSupportedTypes(!showSupportedTypes)}
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('whatDocumentsCanIAnalyze')}</span>
        </button>

        {showSupportedTypes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {[
              {icon: "📊", key: 'marketImages'},
              {icon: "📰", key: 'chartNews'},
              {icon: "📈", key: 'financialData'},
              {icon: "🖼️", key: 'screenshots'},
              {icon: "📉", key: 'chartImages'},
              {icon: "📄", key: 'quarterlyReports'},
            ].map((item, i) => (
              <span
                key={i}
                className={`px-4 py-2 rounded-full text-base font-medium text-center ${
                  darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {`${item.icon} ${t(item.key)}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mt-8 space-y-6">
          {/* Analysis Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analysis Complete
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysisResult.document_name} • {new Date(analysisResult.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={resetAnalysis}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Summary
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>

          {/* Key Insights */}
          {analysisResult.insights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Key Insights
              </h4>
              <div className="space-y-3">
                {analysisResult.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Recommendations
              </h4>
              <div className="space-y-3">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {analysisResult.risk_factors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Risk Factors
              </h4>
              <div className="space-y-3">
                {analysisResult.risk_factors.map((risk, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sectors Affected */}
          {analysisResult.sectors_affected.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Sectors Affected
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.sectors_affected.map((sector, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Metadata */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Sentiment:</span>
                <span className={`ml-2 font-medium ${
                  analysisResult.sentiment === 'positive' ? 'text-green-600' :
                  analysisResult.sentiment === 'negative' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {analysisResult.sentiment.charAt(0).toUpperCase() + analysisResult.sentiment.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {Math.round(analysisResult.confidence_score * 100)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Document Type:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {analysisResult.document_type.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Analysis ID:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white font-mono text-xs">
                  {analysisResult.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Analysis Failed
              </h4>
              <p className="text-red-700 dark:text-red-300 mt-1">{analysisError}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={resetAnalysis}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSection;
