import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Menu,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
}

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  darkMode: boolean;
}

interface InsightsSectionProps {
  insights: string[];
  loading: boolean;
  darkMode: boolean;
}

interface ChatInterfaceProps {
  userId: string;
  darkMode: boolean;
  UploadSection: React.FC<UploadSectionProps>;
  InsightsSection: React.FC<InsightsSectionProps>;
  onAnalysisComplete?: (insights: string[]) => void;
  onFileUpload?: (file: File) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  darkMode,
  UploadSection,
  InsightsSection,
  onAnalysisComplete,
  onFileUpload,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useTranslation();
  
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    if (!userId) return;
    
    const savedSessions = localStorage.getItem(`finsight-chat-sessions-${userId}`);
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      
      // Set current session to the most recent one if none is selected
      if (parsedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(parsedSessions[0].id);
      }
    }
  }, [userId, currentSessionId]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (!userId || sessions.length === 0) return;
    localStorage.setItem(`finsight-chat-sessions-${userId}`, JSON.stringify(sessions));
  }, [sessions, userId]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, sidebarOpen]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `${t('analysis')} ${new Date().toLocaleDateString()}`,
      timestamp: Date.now(),
      messages: [],
    };
    
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setUploadedFile(null);
    setInsights([]);
    
    // Close sidebar on mobile after creating a new session
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    
    // If we're deleting the current session, select the first available one
    if (sessionId === currentSessionId && updatedSessions.length > 0) {
      setCurrentSessionId(updatedSessions[0].id);
    } else if (updatedSessions.length === 0) {
      setCurrentSessionId(null);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setLoading(true);
    
    // Simulate API call for analysis
    setTimeout(() => {
      const mockInsights = [
        t('mockInsight1'),
        t('mockInsight2'),
        t('mockInsight3'),
        t('mockInsight4'),
      ];
      setInsights(mockInsights);
      setLoading(false);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(mockInsights);
      }
      
      // Update current session with file info
      if (currentSessionId) {
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === currentSessionId 
              ? { 
                  ...session, 
                  title: `${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}`,
                  messages: [
                    ...session.messages,
                    {
                      id: `msg-${Date.now()}`,
                      content: `${t('uploadedFile')}: ${file.name}`,
                      sender: 'user',
                      timestamp: Date.now()
                    }
                  ]
                }
              : session
          )
        );
      }
    }, 2000);
  };

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSession = sessions.find(session => session.id === currentSessionId);

  return (
    <div className={`flex h-screen w-screen fixed top-0 left-0 z-50 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`fixed left-0 top-20 z-30 p-2 rounded-r-lg shadow-md transition-colors ${
            darkMode 
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed md:relative h-full z-20 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        } border-r w-72 md:w-80 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('analyses')}
            </h2>
            <button
              onClick={createNewSession}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              aria-label={t('newAnalysis')}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className={`relative ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchAnalyses')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 focus:ring-blue-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 focus:ring-blue-500 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredSessions.length === 0 ? (
            <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? t('noSearchResults') : t('noAnalyses')}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                  session.id === currentSessionId
                    ? darkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-900'
                    : darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-medium truncate">{session.title}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(session.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className={`p-1 rounded-md transition-colors ${
                    darkMode
                      ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-300 text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label={t('deleteSession')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Mobile Close Button */}
        {isMobile && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center justify-center space-x-2 p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
              <span>{t('closeSidebar')}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${sidebarOpen ? 'md:ml-80' : ''}`}>
        {currentSessionId ? (
          <>
            {/* Chat Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h2 className={`text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentSession?.title}
              </h2>
              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  aria-label={sidebarOpen ? t('hideSidebar') : t('showSidebar')}
                >
                  {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              )}
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 h-full">
              {/* Upload Section */}
              <div className="mb-6">
                <UploadSection
                  onFileUpload={handleFileUpload}
                  darkMode={darkMode}
                />
              </div>
              
              {/* Insights Section */}
              {(uploadedFile || insights.length > 0) && (
                <div className="mt-6">
                  <InsightsSection
                    insights={insights}
                    loading={loading}
                    darkMode={darkMode}
                  />
                </div>
              )}
              
              {/* Messages */}
              {currentSession?.messages.length ? (
                <div className="space-y-4 mt-6">
                  {currentSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.sender === 'user'
                          ? darkMode
                            ? 'bg-blue-900 ml-12'
                            : 'bg-blue-100 ml-12'
                          : darkMode
                          ? 'bg-gray-800 mr-12'
                          : 'bg-gray-100 mr-12'
                      }`}
                    >
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          // No session selected
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <MessageSquare className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('noActiveAnalysis')}
            </h2>
            <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('createOrSelectAnalysis')}
            </p>
            <button
              onClick={createNewSession}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>{t('newAnalysis')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
