import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Lightbulb,
  Target,
  Workflow,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface CarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const CarouselModal: React.FC<CarouselModalProps> = ({ isOpen, onClose, darkMode }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const slides = [
    {
      title: t('carousel.theNeed'),
      icon: AlertCircle,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      darkGradient: 'from-orange-600 to-red-700',
      darkBgGradient: 'from-orange-950 to-red-950',
      content: t('carousel.theNeedContent'),
      details: [
        t('carousel.complexJargon'),
        t('carousel.timeConsuming'),
        t('carousel.scatteredInfo'),
        t('carousel.quickDecisions'),
      ],
    },
    {
      title: t('carousel.theSolution'),
      icon: Lightbulb,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      darkGradient: 'from-emerald-600 to-teal-700',
      darkBgGradient: 'from-emerald-950 to-teal-950',
      content: t('carousel.theSolutionContent'),
      details: [
        t('carousel.instantProcessing'),
        t('carousel.aiExtraction'),
        t('carousel.realTimeAnalysis'),
        t('carousel.multiFormat'),
      ],
    },
    {
      title: t('carousel.ourUSP'),
      icon: Target,
      gradient: 'from-teal-500 to-cyan-600',
      bgGradient: 'from-teal-50 to-cyan-50',
      darkGradient: 'from-teal-600 to-cyan-700',
      darkBgGradient: 'from-teal-950 to-cyan-950',
      content: t('carousel.ourUSPContent'),
      details: [
        t('carousel.plainLanguage'),
        t('carousel.actionableRecommendations'),
        t('carousel.userFriendly'),
        t('carousel.accessibleToAll'),
      ],
    },
    {
      title: t('carousel.howItWorks'),
      icon: Workflow,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      darkGradient: 'from-purple-600 to-pink-700',
      darkBgGradient: 'from-purple-950 to-pink-950',
      content: t('carousel.howItWorksContent'),
      details: [
        t('carousel.step1Upload'),
        t('carousel.step2Process'),
        t('carousel.step3Insights'),
        t('carousel.step4Decisions'),
      ],
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div
        className={`rounded-xl sm:rounded-3xl max-w-4xl w-full max-h-[80vh] sm:max-h-[70vh] overflow-hidden shadow-2xl ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        } mx-2 sm:mx-4`}
      >
        {/* Header */}
        <div
          className={`p-3 sm:p-6 border-b flex items-center justify-between ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl bg-gradient-to-r ${
                darkMode ? currentSlideData.darkGradient : currentSlideData.gradient
              } text-white`}
            >
              <currentSlideData.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2
              className={`text-lg sm:text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {currentSlideData.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`p-4 sm:p-8 bg-gradient-to-br ${
            darkMode ? currentSlideData.darkBgGradient : currentSlideData.bgGradient
          } min-h-[300px] sm:min-h-[400px] flex flex-col justify-center`}
        >
          <div className="text-center mb-8">
            <div
              className={`inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg bg-gradient-to-r ${
                darkMode ? currentSlideData.darkGradient : currentSlideData.gradient
              } text-white`}
            >
              <currentSlideData.icon className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>
            <p
              className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {currentSlideData.content}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {currentSlideData.details.map((detail, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-4 rounded-lg sm:rounded-xl border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                    darkMode ? currentSlideData.darkGradient : currentSlideData.gradient
                  }`}
                ></div>
                <span
                  className={`font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div
          className={`p-3 sm:p-6 flex items-center justify-between ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <button
            onClick={prevSlide}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl transition-colors shadow-sm border ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Previous</span>
          </button>

          {/* Dots */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? `bg-gradient-to-r ${
                        darkMode
                          ? currentSlideData.darkGradient
                          : currentSlideData.gradient
                      }`
                    : darkMode
                    ? 'bg-gray-600 hover:bg-gray-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={onClose}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors shadow-sm border ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              <span className="text-sm sm:text-base">Close</span>
            </button>
          ) : (
            <button
              onClick={nextSlide}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors shadow-sm border ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              <span className="text-sm sm:text-base">Next</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className={`h-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            className={`h-full transition-all duration-300 bg-gradient-to-r ${
              darkMode ? currentSlideData.darkGradient : currentSlideData.gradient
            }`}
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CarouselModal;
