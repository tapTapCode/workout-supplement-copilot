'use client';

import { useEffect } from 'react';

/**
 * Client component to enforce dark mode after hydration
 * This prevents hydration mismatches by running only on the client
 */
export function ThemeEnforcer() {
  useEffect(() => {
    // Only run on client after hydration
    const html = document.documentElement;
    html.classList.remove('light');
    html.classList.add('dark');
    
    // Watch for any attempts to remove dark class
    const observer = new MutationObserver(() => {
      if (!html.classList.contains('dark')) {
        html.classList.remove('light');
        html.classList.add('dark');
      }
    });
    
    observer.observe(html, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
}

