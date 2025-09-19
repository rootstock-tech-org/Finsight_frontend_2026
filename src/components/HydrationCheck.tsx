'use client';

import React, { useEffect, useState } from 'react';

/**
 * Component that monitors for hydration mismatches and attempts to recover
 * This is particularly useful for handling browser extension interference
 */
export const HydrationCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasHydrationIssue, setHasHydrationIssue] = useState(false);

  useEffect(() => {
    // Check for common hydration mismatch indicators
    const checkForHydrationIssues = () => {
      try {
        // Check if there are any __processed_ attributes (common with browser extensions)
        const processedElements = document.querySelectorAll('[__processed_]');
        if (processedElements.length > 0) {
          console.warn('Detected browser extension interference with __processed_ attributes');
          setHasHydrationIssue(true);
          
          // Try to clean up the attributes
          processedElements.forEach(el => {
            const attrs = el.getAttributeNames();
            attrs.forEach(attr => {
              if (attr.startsWith('__processed_')) {
                el.removeAttribute(attr);
              }
            });
          });
          
          // Reset the flag after cleanup
          setTimeout(() => setHasHydrationIssue(false), 100);
        }
      } catch (error) {
        console.warn('Error checking for hydration issues:', error);
      }
    };

    // Run check after a short delay to allow for browser extensions to finish
    const timer = setTimeout(() => {
      setIsHydrated(true);
      checkForHydrationIssues();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // If there's a hydration issue, show a minimal fallback
  if (hasHydrationIssue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Recovering from hydration issue...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default HydrationCheck;
