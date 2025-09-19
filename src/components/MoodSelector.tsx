import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useAuthStore, MoodType } from '@/lib/store/auth-store';

interface MoodSelectorProps {
  darkMode: boolean;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ darkMode }) => {
  const { mood, setMood } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const moods: { type: MoodType; icon: string; label: string; description: string; frequency: string }[] = [
    {
      type: 'normal',
      icon: '😊',
      label: 'Normal',
      description: 'Regular updates',
      frequency: 'Daily notifications'
    },
    {
      type: 'busy',
      icon: '😰',
      label: 'Busy',
      description: 'Important updates only',
      frequency: 'Weekly summary'
    },
    {
      type: 'vacation',
      icon: '🏖️',
      label: 'Vacation',
      description: 'Minimal notifications',
      frequency: 'Monthly digest'
    },
    {
      type: 'focus',
      icon: '🎯',
      label: 'Focus Mode',
      description: 'Critical alerts only',
      frequency: 'Emergency only'
    },
    {
      type: 'available',
      icon: '😄',
      label: 'Available',
      description: 'All updates welcome',
      frequency: 'Real-time alerts'
    },
    {
      type: 'away',
      icon: '😴',
      label: 'Away',
      description: 'Reduced notifications',
      frequency: 'Bi-weekly updates'
    }
  ];

  const currentMood = moods.find(m => m.type === mood) || moods[0];

  const handleMoodSelect = (newMood: MoodType) => {
    setMood(newMood);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Current Mood Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          darkMode
            ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
        }`}
        title={`Current mood: ${currentMood.label} - ${currentMood.frequency}`}
      >
        <span className="text-lg">{currentMood.icon}</span>
        <span className="font-medium hidden sm:inline text-sm">{currentMood.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mood Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-50 ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}>
            <div className="p-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold text-sm ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                  Communication Mood
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                {moods.map((moodOption) => (
                  <button
                    key={moodOption.type}
                    onClick={() => handleMoodSelect(moodOption.type)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      mood === moodOption.type
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-800"
                        : darkMode
                          ? "hover:bg-gray-700 text-gray-200"
                          : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-xl">{moodOption.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{moodOption.label}</div>
                      <div className={`text-xs ${
                        mood === moodOption.type
                          ? darkMode ? "text-blue-100" : "text-blue-600"
                          : darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {moodOption.frequency}
                      </div>
                    </div>
                    {mood === moodOption.type && (
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className={`mt-3 p-2 rounded-lg text-xs ${
                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"
              }`}>
                <p>Your mood affects notification frequency and message tone.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MoodSelector;
