import React, { createContext, useState, useContext, ReactNode } from 'react';

// English translations
const enTranslations = {
  // Carousel translations
  'carousel.theNeed': 'The Need',
  'carousel.theNeedContent': 'Financial documents are often complex and difficult to understand, especially for non-experts.',
  'carousel.complexJargon': 'Complex jargon and terminology',
  'carousel.timeConsuming': 'Time-consuming analysis',
  'carousel.scatteredInfo': 'Scattered information across documents',
  'carousel.quickDecisions': 'Need for quick investment decisions',
  
  'carousel.theSolution': 'The Solution',
  'carousel.theSolutionContent': 'FinSight leverages AI to simplify financial document analysis and make insights accessible to everyone.',
  'carousel.instantProcessing': 'Instant document processing',
  'carousel.aiExtraction': 'AI-powered data extraction',
  'carousel.realTimeAnalysis': 'Real-time market analysis',
  'carousel.multiFormat': 'Support for multiple document formats',
  
  'carousel.ourUSP': 'Our USP',
  'carousel.ourUSPContent': 'What sets FinSight apart is our focus on making financial insights truly accessible to everyone.',
  'carousel.plainLanguage': 'Plain language explanations',
  'carousel.actionableRecommendations': 'Actionable recommendations',
  'carousel.userFriendly': 'User-friendly interface',
  'carousel.accessibleToAll': 'Accessible to all investors',
  
  'carousel.howItWorks': 'How It Works',
  'carousel.howItWorksContent': 'Our streamlined process makes financial analysis quick and painless.',
  'carousel.step1Upload': 'Step 1: Upload your document',
  'carousel.step2Process': 'Step 2: AI processes the information',
  'carousel.step3Insights': 'Step 3: Review insights and analysis',
  'carousel.step4Decisions': 'Step 4: Make informed decisions',

  // Header translations
  'learnMore': 'Learn More',
  'logout': 'Logout',
  'darkMode': 'Dark Mode',
  'lightMode': 'Light Mode',
  'english': 'English',
  'hindi': 'Hindi',
  'addStockList': 'Watchlist',

  // Login translations
  'login.motto': 'See what others miss',
  'login.subtitle': 'The only companion that turn complexity into confidence',
  'login.email': 'Email Address',
  'login.emailPlaceholder': 'Enter your email',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.rememberMe': 'Remember me',
  'login.forgotPassword': 'Forgot password?',
  'login.signIn': 'Sign In',
  'login.createAccount': 'Create Account',
          'login.noAccount': "Don't have an account?",
  'login.backToLogin': 'Back to Login',
  'login.resetEmailSent': 'Password reset email sent! Check your inbox.',
  'login.resetInstructions': 'Enter your email address and we will send you a link to reset your password.',
  'login.sendResetLink': 'Send Reset Link',
  'login.continueWithGoogle': 'Continue with Google',
  'login.orContinueWith': 'Or continue with',
  'login.processing': 'Processing...',
  'login.termsAgreement': 'By continuing, you agree to our',
  'login.termsOfService': 'Terms of Service',
  'login.copyright': '© 2024 FinSight. All rights reserved.',
  'login.poweredBy': 'Powered by',
  'login.transformData': 'Transform Data',
  'login.transformDescription': 'Your AI-powered financial document analysis platform',
  // Missing keys used in login page
  'login.signInWithGoogle': 'Sign in with Google',
  'login.signUpWithGoogle': 'Sign up with Google',
          'login.dontHaveAccount': "Don't have an account?",
  'login.signUp': 'Sign Up',
  'login.backToRegister': 'Back to Register',
  'login.resetPassword': 'Reset Password',

  // Subscription translations
  'subscription.viewPlans': 'View Plans',

  // Chat interface translations
  'analysisHistory': 'Analysis History',
  'history': 'History',
  'newAnalysis': 'New Analysis',
  'searchHistory': 'Search history...',
  'noAnalysisHistory': 'No analysis history yet',
  'viewHistory': 'View History',
  'hideHistory': 'Hide History',
  
  // Stock selection translations
  'selectStocks': 'Select Your Stocks',
  'selectStocksDescription': 'Choose stocks and mutual funds for your watchlist',
  'continue': 'Continue',
  'skipForNow': 'Skip for now',
  'stocks': 'Stocks',
  'mutualFunds': 'Mutual Funds',
  'searchStocks': 'Search stocks...',
  'searchMutualFunds': 'Search mutual funds...',
  'yourWatchlist': 'Your Watchlist',
  'remaining': 'remaining',
  'noResultsFound': 'No results found',
  
  // Analysis translations
  'analyzingDocument': 'Analyzing Document',
  'aiProcessingMessage': 'Our AI is processing your document. This may take a few moments...',
  'fromImageToInsight': 'From Image to Insight',
  'uploadFinancialDocument': 'Upload your financial document or chart for instant AI-powered analysis',
  'dropArea': 'Drop area for files',
  'fileReady': 'File Ready',
  'clickAnalyzeForInsights': 'Click analyze to get insights',
  'chooseDocument': 'Choose Document',
  'changeDocument': 'Change Document',
  'orPasteWebLink': 'Or paste a web link',
  'analyzeDocument': 'Analyze Document',
  'whatDocumentsCanIAnalyze': 'What documents can I analyze?',
  'marketImages': 'Market Images',
  'chartNews': 'Chart News',
  'financialData': 'Financial Data',
  'screenshots': 'Screenshots',
  'chartImages': 'Chart Images',
  'quarterlyReports': 'Quarterly Reports',

  // Register translations
  'register.motto': 'AI-Powered Financial Analysis',
  'register.subtitle': 'Transform your financial documents into actionable insights',
  'register.backToLogin': 'Back to Login',
  'register.firstName': 'First Name',
  'register.firstNamePlaceholder': 'Enter your first name',
  'register.lastName': 'Last Name',
  'register.lastNamePlaceholder': 'Enter your last name',
  'register.mobileNumber': 'Mobile Number',
  'register.mobileNumberPlaceholder': 'Enter your mobile number',
  'register.mobileNumberHelp': 'Enter 10-digit Indian mobile number',
  'register.email': 'Email Address',
  'register.emailPlaceholder': 'Enter your email',
  'register.password': 'Password',
  'register.passwordPlaceholder': 'Create a strong password',
  'register.confirmPassword': 'Confirm Password',
  'register.confirmPasswordPlaceholder': 'Confirm your password',
  'register.communicationPreference': 'Communication Preference',
  'register.communicationPreferenceDetail': 'Choose your preferred communication channel',
  'register.stockUpdateFrequency': 'Stock Update Frequency',
  'register.rememberMe': 'Remember me',
  'register.processing': 'Processing...',
  'register.createAccount': 'Create Account',
  'register.alreadyHaveAccount': 'Already have an account?',
  'register.signIn': 'Sign In',
  'register.copyright': '© 2024 FinSight. All rights reserved.',
  'register.poweredBy': 'Powered by',
  'register.transformData': 'Transform Data',
  'register.transformDescription': 'Your AI-powered financial document analysis platform',
  'register.termsAgreement': 'By creating an account, you agree to our',
  'register.termsOfService': 'Terms of Service',
  'register.firstNameRequired': 'First name is required',
  'register.lastNameRequired': 'Last name is required',
  'register.mobileNumberRequired': 'Mobile number is required',
  'register.mobileNumberInvalid': 'Please enter a valid 10-digit mobile number',
  'register.passwordsDoNotMatch': 'Passwords do not match',
  'register.passwordTooShort': 'Password must be at least 8 characters long',
  'register.passwordNoUppercase': 'Password must contain at least one uppercase letter',
  'register.passwordNoLowercase': 'Password must contain at least one lowercase letter',
  'register.passwordNoNumber': 'Password must contain at least one number',
  'register.passwordNoSpecial': 'Password must contain at least one special character',
  'register.passwordTooWeak': 'Password is too weak. Please choose a stronger password',
  'register.passwordStrong': 'Password is strong',
  'register.daily': 'Daily',
  'register.weekly': 'Weekly',
  'register.monthly': 'Monthly'
};

// Hindi translations
const hiTranslations = {
  // Carousel translations
  'carousel.theNeed': 'आवश्यकता',
  'carousel.theNeedContent': 'वित्तीय दस्तावेज अक्सर जटिल होते हैं और समझने में कठिन होते हैं, विशेष रूप से गैर-विशेषज्ञों के लिए।',
  'carousel.complexJargon': 'जटिल शब्दजाल और शब्दावली',
  'carousel.timeConsuming': 'समय लेने वाला विश्लेषण',
  'carousel.scatteredInfo': 'दस्तावेजों में बिखरी जानकारी',
  'carousel.quickDecisions': 'त्वरित निवेश निर्णयों की आवश्यकता',
  
  'carousel.theSolution': 'समाधान',
  'carousel.theSolutionContent': 'FinSight AI का उपयोग करके वित्तीय दस्तावेज विश्लेषण को सरल बनाता है और अंतर्दृष्टि को सभी के लिए सुलभ बनाता है।',
  'carousel.instantProcessing': 'तत्काल दस्तावेज़ प्रसंस्करण',
  'carousel.aiExtraction': 'AI-संचालित डेटा निष्कर्षण',
  'carousel.realTimeAnalysis': 'रीयल-टाइम मार्केट एनालिसिस',
  'carousel.multiFormat': 'कई दस्तावेज़ प्रारूपों के लिए समर्थन',
  
  'carousel.ourUSP': 'हमारी विशेषता',
  'carousel.ourUSPContent': 'जो FinSight को अलग करता है, वह है वित्तीय अंतर्दृष्टि को वास्तव में सभी के लिए सुलभ बनाने पर हमारा ध्यान।',
  'carousel.plainLanguage': 'सरल भाषा स्पष्टीकरण',
  'carousel.actionableRecommendations': 'कार्रवाई योग्य सिफारिशें',
  'carousel.userFriendly': 'उपयोगकर्ता के अनुकूल इंटरफेस',
  'carousel.accessibleToAll': 'सभी निवेशकों के लिए सुलभ',
  
  'carousel.howItWorks': 'यह कैसे काम करता है',
  'carousel.howItWorksContent': 'हमारी सुव्यवस्थित प्रक्रिया वित्तीय विश्लेषण को त्वरित और दर्द रहित बनाती है।',
  'carousel.step1Upload': 'चरण 1: अपना दस्तावेज़ अपलोड करें',
  'carousel.step2Process': 'चरण 2: AI जानकारी को संसाधित करता है',
  'carousel.step3Insights': 'चरण 3: अंतर्दृष्टि और विश्लेषण की समीक्षा करें',
  'carousel.step4Decisions': 'चरण 4: सूचित निर्णय लें',

  // Header translations
  'learnMore': 'अधिक जानें',
  'logout': 'लॉग आउट',
  'darkMode': 'डार्क मोड',
  'lightMode': 'लाइट मोड',
  'english': 'अंग्रेज़ी',
  'hindi': 'हिंदी',
  'addStockList': 'वॉचलिस्ट',

  // Login translations
  'login.motto': 'AI-संचालित वित्तीय विश्लेषण',
  'login.subtitle': 'अपने वित्तीय दस्तावेजों को कार्रवाई योग्य अंतर्दृष्टि में बदलें',
  'login.email': 'ईमेल पता',
  'login.emailPlaceholder': 'अपना ईमेल दर्ज करें',
  'login.password': 'पासवर्ड',
  'login.passwordPlaceholder': 'अपना पासवर्ड दर्ज करें',
  'login.rememberMe': 'मुझे याद रखें',
  'login.forgotPassword': 'पासवर्ड भूल गए?',
  'login.signIn': 'साइन इन करें',
  'login.createAccount': 'खाता बनाएं',
  'login.noAccount': 'खाता नहीं है?',
  'login.backToLogin': 'लॉगिन पर वापस जाएं',
  'login.resetEmailSent': 'पासवर्ड रीसेट ईमेल भेज दिया गया! अपना इनबॉक्स देखें।',
  'login.resetInstructions': 'अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे।',
  'login.sendResetLink': 'रीसेट लिंक भेजें',
  'login.continueWithGoogle': 'Google के साथ जारी रखें',
  'login.orContinueWith': 'या इसके साथ जारी रखें',
  'login.processing': 'प्रसंस्करण...',
  'login.termsAgreement': 'जारी रखकर, आप हमारी',
  'login.termsOfService': 'सेवा की शर्तें',
  'login.copyright': '© 2024 FinSight. सर्वाधिकार सुरक्षित।',
  'login.poweredBy': 'द्वारा संचालित',
  'login.transformData': 'डेटा को बदलें',
  'login.transformDescription': 'आपका AI-संचालित वित्तीय दस्तावेज विश्लेषण प्लेटफॉर्म',
  // Missing keys used in login page
  'login.signInWithGoogle': 'Google से साइन इन करें',
  'login.signUpWithGoogle': 'Google से साइन अप करें',
  'login.dontHaveAccount': 'खाता नहीं है?',
  'login.signUp': 'साइन अप करें',
  'login.backToRegister': 'रजिस्टर पर वापस जाएं',
  'login.resetPassword': 'पासवर्ड रीसेट करें',

  // Subscription translations
  'subscription.viewPlans': 'योजनाएं देखें',

  // Chat interface translations
  'analysisHistory': 'विश्लेषण इतिहास',
  'history': 'इतिहास',
  'newAnalysis': 'नया विश्लेषण',
  'searchHistory': 'इतिहास खोजें...',
  'noAnalysisHistory': 'अभी तक कोई विश्लेषण इतिहास नहीं',
  'viewHistory': 'इतिहास देखें',
  'hideHistory': 'इतिहास छुपाएं',
  'fromImageToInsight': 'छवि से अंतर्दृष्टि तक',
  'uploadFinancialDocument': 'त्वरित AI-संचालित विश्लेषण के लिए अपने वित्तीय दस्तावेज़ या चार्ट अपलोड करें',
  'dropArea': 'फ़ाइलों के लिए ड्रॉप क्षेत्र',
  'fileReady': 'फ़ाइल तैयार',
  'clickAnalyzeForInsights': 'अंतर्दृष्टि प्राप्त करने के लिए विश्लेषण पर क्लिक करें',
  'chooseDocument': 'दस्तावेज़ चुनें',
  'changeDocument': 'दस्तावेज़ बदलें',
  'orPasteWebLink': 'या वेब लिंक पेस्ट करें',
  'analyzeDocument': 'दस्तावेज़ का विश्लेषण करें',
  'whatDocumentsCanIAnalyze': 'मैं किन दस्तावेज़ों का विश्लेषण कर सकता हूं?',
  'marketImages': 'बाज़ार छवियां',
  'chartNews': 'चार्ट समाचार',
  'financialData': 'वित्तीय डेटा',
  'screenshots': 'स्क्रीनशॉट',
  'chartImages': 'चार्ट छवियां',
  'quarterlyReports': 'त्रैमासिक रिपोर्ट',

  // Register translations
  'register.motto': 'AI-संचालित वित्तीय विश्लेषण',
  'register.subtitle': 'अपने वित्तीय दस्तावेजों को कार्रवाई योग्य अंतर्दृष्टि में बदलें',
  'register.backToLogin': 'लॉगिन पर वापस जाएं',
  'register.firstName': 'पहला नाम',
  'register.firstNamePlaceholder': 'अपना पहला नाम दर्ज करें',
  'register.lastName': 'अंतिम नाम',
  'register.lastNamePlaceholder': 'अपना अंतिम नाम दर्ज करें',
  'register.mobileNumber': 'मोबाइल नंबर',
  'register.mobileNumberPlaceholder': 'अपना मोबाइल नंबर दर्ज करें',
  'register.mobileNumberHelp': '10 अंकों का भारतीय मोबाइल नंबर दर्ज करें',
  'register.email': 'ईमेल पता',
  'register.emailPlaceholder': 'अपना ईमेल दर्ज करें',
  'register.password': 'पासवर्ड',
  'register.passwordPlaceholder': 'एक मजबूत पासवर्ड बनाएं',
  'register.confirmPassword': 'पासवर्ड की पुष्टि करें',
  'register.confirmPasswordPlaceholder': 'अपने पासवर्ड की पुष्टि करें',
  'register.communicationPreference': 'संचार वरीयता',
  'register.communicationPreferenceDetail': 'अपना पसंदीदा संचार चैनल चुनें',
  'register.stockUpdateFrequency': 'स्टॉक अपडेट आवृत्ति',
  'register.rememberMe': 'मुझे याद रखें',
  'register.processing': 'प्रसंस्करण...',
  'register.createAccount': 'खाता बनाएं',
  'register.alreadyHaveAccount': 'पहले से खाता है?',
  'register.signIn': 'साइन इन करें',
  'register.copyright': '© 2024 FinSight. सर्वाधिकार सुरक्षित।',
  'register.poweredBy': 'द्वारा संचालित',
  'register.transformData': 'डेटा को बदलें',
  'register.transformDescription': 'आपका AI-संचालित वित्तीय दस्तावेज विश्लेषण प्लेटफॉर्म',
  'register.termsAgreement': 'खाता बनाकर, आप हमारी',
  'register.termsOfService': 'सेवा की शर्तें',
  'register.firstNameRequired': 'पहला नाम आवश्यक है',
  'register.lastNameRequired': 'अंतिम नाम आवश्यक है',
  'register.mobileNumberRequired': 'मोबाइल नंबर आवश्यक है',
  'register.mobileNumberInvalid': 'कृपया एक वैध 10-अंकीय मोबाइल नंबर दर्ज करें',
  'register.passwordsDoNotMatch': 'पासवर्ड मेल नहीं खाते',
  'register.passwordTooShort': 'पासवर्ड कम से कम 8 अक्षर लंबा होना चाहिए',
  'register.passwordNoUppercase': 'पासवर्ड में कम से कम एक बड़ा अक्षर होना चाहिए',
  'register.passwordNoLowercase': 'पासवर्ड में कम से कम एक छोटा अक्षर होना चाहिए',
  'register.passwordNoNumber': 'पासवर्ड में कम से कम एक संख्या होनी चाहिए',
  'register.passwordNoSpecial': 'पासवर्ड में कम से कम एक विशेष अक्षर होना चाहिए',
  'register.passwordTooWeak': 'पासवर्ड बहुत कमजोर है। कृपया एक मजबूत पासवर्ड चुनें',
  'register.passwordStrong': 'पासवर्ड मजबूत है',
  'register.daily': 'दैनिक',
  'register.weekly': 'साप्ताहिक',
  'register.monthly': 'मासिक',

  // Stock selection translations
  'selectStocks': 'अपने स्टॉक चुनें',
  'selectStocksDescription': 'अपनी वॉचलिस्ट के लिए स्टॉक और म्यूचुअल फंड चुनें',
  'continue': 'जारी रखें',
  'skipForNow': 'अभी के लिए छोड़ें',
  'stocks': 'स्टॉक',
  'mutualFunds': 'म्यूचुअल फंड',
  'searchStocks': 'स्टॉक खोजें...',
  'searchMutualFunds': 'म्यूचुअल फंड खोजें...',
  'yourWatchlist': 'आपकी वॉचलिस्ट',
  'remaining': 'शेष',
  'noResultsFound': 'कोई परिणाम नहीं मिला',

  // Analysis translations
  'analyzingDocument': 'दस्तावेज़ का विश्लेषण',
  'aiProcessingMessage': 'हमारा एआई आपके दस्तावेज़ को प्रोसेस कर रहा है। इसमें कुछ समय लग सकता है...'
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const useTranslation = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key: string): string => {
    const translations = language === 'en' ? enTranslations : hiTranslations;
    return translations[key as keyof typeof enTranslations] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
