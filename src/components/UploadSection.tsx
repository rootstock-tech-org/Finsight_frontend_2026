import React, { useState, useRef } from 'react';
import { Upload, FileText, Link as LinkIcon, HelpCircle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  darkMode: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileUpload, darkMode }) => {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      // Handle URL submission - in a real app, this would fetch the document from the URL
      console.log('URL submitted:', urlInput);
      setUrlInput('');
      // Mock file upload from URL
      const mockFile = new File([""], "document-from-url.pdf", { type: "application/pdf" });
      onFileUpload(mockFile);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openHelpModal = () => {
    // In a real app, this would open a modal with help information
    console.log('Help modal should open');
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-xl bg-teal-500 text-white mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('fromImageToInsight')}
        </h2>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {t('uploadDocumentPrompt')}
        </p>
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-8 mb-4 text-center transition-colors flex-1 flex flex-col justify-center items-center ${
          dragActive 
            ? darkMode 
              ? 'border-teal-400 bg-teal-900/20' 
              : 'border-teal-500 bg-teal-50' 
            : darkMode 
              ? 'border-gray-700 hover:border-gray-600' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
        />
        
        <div className="mb-4">
          <div className={`inline-flex p-4 rounded-full mb-4 ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Upload className={`w-8 h-8 ${darkMode ? 'text-teal-400' : 'text-teal-500'}`} />
          </div>
        </div>
        
        <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('fromImageToInsight')}
        </h3>
        <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('clickOrDragPrompt')}
        </p>
        
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            darkMode 
              ? 'bg-teal-600 hover:bg-teal-700 text-white' 
              : 'bg-teal-500 hover:bg-teal-600 text-white'
          }`}
        >
          {t('chooseDocument')}
        </button>
        
        <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('supportedFileTypes')}
        </p>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={`px-2 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>
            {t('or')}
          </span>
        </div>
      </div>

      <form onSubmit={handleUrlSubmit} className="mb-6">
        <div className="relative">
          <LinkIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t('pasteWebLink')}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-teal-500 focus:border-teal-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500'
            } focus:outline-none focus:ring-2`}
          />
        </div>
      </form>

      <div className="flex justify-center">
        <button
          onClick={openHelpModal}
          className={`flex items-center text-sm ${
            darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          <span>{t('whatDocumentsCanIAnalyze')}</span>
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
