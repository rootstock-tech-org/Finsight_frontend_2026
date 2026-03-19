'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Loader2, TrendingUp, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth-store';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  analysisId?: string;
  documentId?: string;
  error?: string;
  result?: any;
}

interface OCRDocumentUploadProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  onUploadStart?: () => void;
  className?: string;
}

const OCRDocumentUpload: React.FC<OCRDocumentUploadProps> = ({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  className = ''
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'info' | 'warning' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    console.log('Files state changed:', files.map(f => ({ id: f.id, status: f.status, hasResult: !!f.result })));
  }, [files]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();  // ← direct store access, no provider needed

  const maxFileSize = 50 * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!acceptedTypes.includes(file.type)) {
      return 'Invalid file type. Only PDF and image files are allowed.';
    }
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return;
      }
      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending',
        progress: 0,
      });
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, [onUploadError]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const uploadFile = async (uploadedFile: UploadedFile) => {
    try {
      setFiles(prev => prev.map(f =>
        f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      if (!user?.user_id) {
        throw new Error('Authentication required. Please sign in first.');
      }

      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      const response = await fetch('/api/ocr/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.user_id}`,
          'X-User-Id': user.user_id,
        },
        body: formData,
      });

      console.log('📡 [OCR-UPLOAD] Response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
      });

      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) errorMessage += ` ${errorData.details}`;
        } catch {
          errorMessage = (await response.text()) || errorMessage;
        }

        setFiles(prev => prev.map(f =>
          f.id === uploadedFile.id ? { ...f, status: 'failed', error: errorMessage, progress: 0 } : f
        ));

        const isQuota = errorMessage.toLowerCase().includes('quota');
        setBanner({
          type: isQuota ? 'warning' : 'error',
          message: isQuota
            ? `${errorMessage} Visit pricing to upgrade your plan and increase your monthly limit.`
            : errorMessage,
        });
        onUploadError?.(errorMessage);
        return;
      }

      let result;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) throw new Error('Empty response received from upload API');
        result = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(`Failed to parse response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      }

      const fileStatus: UploadedFile['status'] =
        result.status === 'completed'
          ? 'completed'
          : result.status === 'failed'
          ? 'failed'
          : result.success
          ? 'completed'
          : 'processing';

      setFiles(prev => prev.map(f =>
        f.id === uploadedFile.id
          ? {
              ...f,
              status: fileStatus,
              progress: 100,
              analysisId: result.analysis_id,
              documentId: result.document_id,
              result: result.analysis,
              error: result.error || undefined,
            }
          : f
      ));

      if (result.status === 'completed') {
        onUploadComplete?.(result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f =>
        f.id === uploadedFile.id
          ? { ...f, status: 'failed', error: error instanceof Error ? error.message : 'Upload failed', progress: 0 }
          : f
      ));
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    onUploadStart?.();
    try {
      for (const file of files.filter(f => f.status === 'pending')) {
        await uploadFile(file);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  }, [addFiles]);

  const getFileIcon = (file: File) =>
    file.type === 'application/pdf'
      ? <FileText className="w-8 h-8 text-red-500" />
      : <Image className="w-8 h-8 text-blue-500" />;

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Document Analysis Upload
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Upload PDF or image documents for AI-powered financial analysis
        </p>
      </div>

      {banner && (
        <div className={`mb-4 rounded-lg border p-4 flex items-start justify-between ${
          banner.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
            : banner.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
        }`}>
          <div className="pr-3 text-sm">{banner.message}</div>
          <div className="flex items-center gap-2">
            {banner.type === 'warning' && (
              <a href="/pricing" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">
                Upgrade Plan
              </a>
            )}
            <button onClick={() => setBanner(null)} className="px-2 py-1 rounded text-sm border border-current/20">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Supports PDF, JPEG, and PNG files up to 50MB
        </p>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-4">
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.file)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{file.progress}%</span>
                    </div>
                  )}
                  {getStatusIcon(file.status)}
                  {file.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => removeFile(file.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.every(f => f.status !== 'pending')}
            className="px-8 py-3"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
            ) : 'Start Analysis'}
          </Button>
        </div>
      )}

      {/* Analysis Results */}
      {files.filter(f => f.status === 'completed' && f.result).length > 0 && (
        <div className="mt-8 space-y-6">
          {files.filter(f => f.status === 'completed' && f.result).map((file) => (
            <div key={file.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Complete</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{file.file.name} • {new Date().toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => removeFile(file.id)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {file.result?.summary && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />Summary
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{file.result.summary}</p>
                </div>
              )}

              {file.result?.insights?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />Key Insights
                  </h4>
                  <div className="space-y-3">
                    {file.result.insights.map((insight: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {file.result?.recommendations?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2" />Recommendations
                  </h4>
                  <div className="space-y-3">
                    {file.result.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {file.result?.risk_factors?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />Risk Factors
                  </h4>
                  <div className="space-y-3">
                    {file.result.risk_factors.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {file.result?.sectors_affected?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />Sectors Affected
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {file.result.sectors_affected.map((sector: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Document Type:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{file.result?.document_type?.toUpperCase() || 'UNKNOWN'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Company:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{file.result?.company_name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Sentiment:</span>
                    <span className={`ml-2 font-medium ${
                      file.result?.sentiment === 'positive' ? 'text-green-600' :
                      file.result?.sentiment === 'negative' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {file.result?.sentiment?.charAt(0)?.toUpperCase() + file.result?.sentiment?.slice(1) || 'Neutral'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Analysis ID:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white font-mono text-xs">{file.analysisId}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OCRDocumentUpload;