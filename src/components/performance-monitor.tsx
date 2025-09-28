'use client';

import { useState, useEffect } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export function PerformanceMonitor({ enabled = false }: PerformanceMonitorProps) {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    // Update memory info every 5 seconds
    const interval = setInterval(updateMemoryInfo, 5000);
    updateMemoryInfo(); // Initial update

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !memoryInfo) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="font-bold mb-1">Memory Usage</div>
      <div>Used: {formatBytes(memoryInfo.usedJSHeapSize)}</div>
      <div>Total: {formatBytes(memoryInfo.totalJSHeapSize)}</div>
      <div>Limit: {formatBytes(memoryInfo.jsHeapSizeLimit)}</div>
      <div className="mt-1">
        <div className="w-20 bg-gray-600 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <div className="text-center mt-1">{usagePercentage.toFixed(1)}%</div>
      </div>
    </div>
  );
}
