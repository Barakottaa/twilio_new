// src/components/resource-preloader.tsx
'use client';

import { useEffect } from 'react';

export function ResourcePreloader() {
  useEffect(() => {
    // Preload critical resources
    const preloadResources = () => {
      // Preload critical fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = '/fonts/inter-var.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);

      // Preload critical images
      const criticalImages = [
        'https://ui-avatars.com/api/?name=Agent&background=random',
        'https://ui-avatars.com/api/?name=Customer&background=random'
      ];

      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });

      // Preload critical API endpoints
      const criticalEndpoints = [
        '/api/twilio/conversations?agentId=admin_001&limit=5',
        '/api/agents'
      ];

      criticalEndpoints.forEach(endpoint => {
        fetch(endpoint, { method: 'HEAD' }).catch(() => {
          // Ignore errors for preloading
        });
      });
    };

    // Preload after initial render
    const timer = setTimeout(preloadResources, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}
