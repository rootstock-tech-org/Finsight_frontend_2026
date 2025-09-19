import React, { useState } from "react";
import {
  LogOut,
  HelpCircle,
  ArrowLeft,
  Moon,
  Sun,
  Menu,
  X,
  User,
} from "lucide-react";
import { useTranslation } from "../context/LanguageContext";
import Image from "next/image";
import MoodSelector from "./MoodSelector";

interface HeaderProps {
  onInfoClick: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  onHomeClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onInfoClick,
  showBackButton,
  onBackClick,
  darkMode,
  toggleDarkMode,
  onLogout,
  onHomeClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  

  const commonButtonClasses = darkMode
    ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600"
    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
        darkMode 
          ? "bg-gray-900 text-white border-b border-gray-700 shadow-lg" 
          : "bg-white text-gray-900 border-b border-gray-200 shadow-sm"
      }`}
    >
      <div className="container px-3 sm:px-4 md:px-8 py-1">
        <div className="flex items-center justify-between">
          {/* Logo - Left side */}
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={onBackClick}
                className={`mr-2 p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={onHomeClick}
            >
              <div className="flex items-center justify-center">
                <img
                  src="/navbar.png"
                  alt="FinSight Logo"
                  className="h-8 sm:h-10 md:h-12 object-contain"
                />
              </div>
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                FinSight
              </h1>
            </div>
          </div>

          {/* Navigation Options - Right side */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
              }`}
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Mood Selector */}
            <MoodSelector darkMode={darkMode} />


            <button
              onClick={onInfoClick}
              className={`flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${commonButtonClasses}`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">{t('learnMore')}</span>
            </button>

            <button
              onClick={() => window.location.href = '/profile'}
              className={`flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${commonButtonClasses}`}
            >
              <User className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Profile</span>
            </button>

            <button
              onClick={onLogout}
              className={`flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${commonButtonClasses}`}
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">{t('logout')}</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center space-x-3">
            <button
              className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden mt-2 py-3 border-t ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
          }`}>
            <div className="flex flex-col space-y-3">
              {/* Mood Selector for Mobile */}
              <div className="px-3">
                <MoodSelector darkMode={darkMode} />
              </div>

              <button
                onClick={() => {
                  toggleDarkMode();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors text-base ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                    : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                <span>{darkMode ? t('lightMode') : t('darkMode')}</span>
              </button>


              <button
                onClick={() => {
                  onInfoClick();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors text-base ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                    : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                <span>{t('learnMore')}</span>
              </button>

              <button
                onClick={onLogout}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors text-base ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                    : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
