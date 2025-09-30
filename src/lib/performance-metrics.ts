// Comprehensive performance metrics monitoring system

export interface PerformanceMetrics {
  // Core Web Vitals
  ttfb: number; // Time To First Byte
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Additional metrics
  domLoad: number; // DOM Content Loaded
  windowLoad: number; // Window Load
  resourceLoad: number; // Resource Load Time
  
  // API Performance
  apiResponseTime: number;
  apiRequests: number;
  apiErrors: number;
  
  // Memory Usage
  memoryUsed: number;
  memoryTotal: number;
  
  // Network
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  
  // Timestamp
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface PerformanceThresholds {
  ttfb: { good: number; poor: number }; // ms
  fcp: { good: number; poor: number }; // ms
  lcp: { good: number; poor: number }; // ms
  fid: { good: number; poor: number }; // ms
  cls: { good: number; poor: number }; // score
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 }
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private isMonitoring = false;
  private apiRequestTimes: number[] = [];
  private apiErrorCount = 0;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;
    
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor API performance
    this.interceptFetch();
    
    // Monitor memory usage
    this.observeMemory();
    
    // Monitor network information
    this.observeNetwork();
    
    // Monitor page load events
    this.observePageLoad();
    
    this.isMonitoring = true;
  }

  private observeWebVitals() {
    // TTFB (Time To First Byte)
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric('ttfb', ttfb);
      }
    }

    // FCP (First Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            this.recordMetric('fcp', fcpEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP monitoring not supported:', e);
      }

      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.recordMetric('lcp', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP monitoring not supported:', e);
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime;
              this.recordMetric('fid', fid);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID monitoring not supported:', e);
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          this.recordMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS monitoring not supported:', e);
      }
    }
  }

  private interceptFetch() {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      this.apiRequests++;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.apiRequestTimes.push(responseTime);
        
        if (!response.ok) {
          this.apiErrorCount++;
        }
        
        return response;
      } catch (error) {
        this.apiErrorCount++;
        throw error;
      }
    };
  }

  private observeMemory() {
    if ('memory' in performance) {
      const updateMemoryMetrics = () => {
        const memory = (performance as any).memory;
        this.recordMetric('memoryUsed', memory.usedJSHeapSize);
        this.recordMetric('memoryTotal', memory.totalJSHeapSize);
      };
      
      // Update memory metrics every 5 seconds
      setInterval(updateMemoryMetrics, 5000);
      updateMemoryMetrics();
    }
  }

  private observeNetwork() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('connectionType', connection.type || 'unknown');
      this.recordMetric('effectiveType', connection.effectiveType || 'unknown');
      this.recordMetric('downlink', connection.downlink || 0);
      this.recordMetric('rtt', connection.rtt || 0);
    }
  }

  private observePageLoad() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('DOMContentLoaded', () => {
      const domLoad = performance.now();
      this.recordMetric('domLoad', domLoad);
    });
    
    window.addEventListener('load', () => {
      const windowLoad = performance.now();
      this.recordMetric('windowLoad', windowLoad);
    });
  }

  private recordMetric(key: keyof PerformanceMetrics, value: number | string) {
    // Get or create current metrics
    let currentMetrics = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : this.getCurrentMetrics();
    
    // Update the specific metric
    (currentMetrics as any)[key] = value;
    currentMetrics.timestamp = Date.now();
    
    // Store the updated metrics
    if (this.metrics.length === 0) {
      this.metrics.push(currentMetrics);
    } else {
      this.metrics[this.metrics.length - 1] = currentMetrics;
    }
    
    // Notify observers
    this.observers.forEach(observer => observer(currentMetrics));
  }

  private getCurrentMetrics(): PerformanceMetrics {
    const now = performance.now();
    const apiResponseTime = this.apiRequestTimes.length > 0 
      ? this.apiRequestTimes.reduce((a, b) => a + b, 0) / this.apiRequestTimes.length 
      : 0;
    
    // Get current metric values from stored data
    const currentMetrics = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    
    return {
      ttfb: currentMetrics?.ttfb || 0,
      fcp: currentMetrics?.fcp || 0,
      lcp: currentMetrics?.lcp || 0,
      fid: currentMetrics?.fid || 0,
      cls: currentMetrics?.cls || 0,
      domLoad: currentMetrics?.domLoad || 0,
      windowLoad: currentMetrics?.windowLoad || 0,
      resourceLoad: currentMetrics?.resourceLoad || 0,
      apiResponseTime,
      apiRequests: this.apiRequests,
      apiErrors: this.apiErrorCount,
      memoryUsed: currentMetrics?.memoryUsed || 0,
      memoryTotal: currentMetrics?.memoryTotal || 0,
      connectionType: currentMetrics?.connectionType || 'unknown',
      effectiveType: currentMetrics?.effectiveType || 'unknown',
      downlink: currentMetrics?.downlink || 0,
      rtt: currentMetrics?.rtt || 0,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  // Public methods
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  public getPerformanceScore(metrics: PerformanceMetrics): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    details: Record<string, { score: number; grade: string; value: number }>;
  } {
    const details: Record<string, { score: number; grade: string; value: number }> = {};
    let totalScore = 0;
    let metricCount = 0;

    // TTFB Score
    if (metrics.ttfb > 0) {
      const ttfbScore = this.calculateScore(metrics.ttfb, DEFAULT_THRESHOLDS.ttfb);
      details.ttfb = { score: ttfbScore, grade: this.getGrade(ttfbScore), value: metrics.ttfb };
      totalScore += ttfbScore;
      metricCount++;
    }

    // FCP Score
    if (metrics.fcp > 0) {
      const fcpScore = this.calculateScore(metrics.fcp, DEFAULT_THRESHOLDS.fcp);
      details.fcp = { score: fcpScore, grade: this.getGrade(fcpScore), value: metrics.fcp };
      totalScore += fcpScore;
      metricCount++;
    }

    // LCP Score
    if (metrics.lcp > 0) {
      const lcpScore = this.calculateScore(metrics.lcp, DEFAULT_THRESHOLDS.lcp);
      details.lcp = { score: lcpScore, grade: this.getGrade(lcpScore), value: metrics.lcp };
      totalScore += lcpScore;
      metricCount++;
    }

    // FID Score
    if (metrics.fid > 0) {
      const fidScore = this.calculateScore(metrics.fid, DEFAULT_THRESHOLDS.fid);
      details.fid = { score: fidScore, grade: this.getGrade(fidScore), value: metrics.fid };
      totalScore += fidScore;
      metricCount++;
    }

    // CLS Score
    if (metrics.cls > 0) {
      const clsScore = this.calculateScore(metrics.cls, DEFAULT_THRESHOLDS.cls);
      details.cls = { score: clsScore, grade: this.getGrade(clsScore), value: metrics.cls };
      totalScore += clsScore;
      metricCount++;
    }

    const averageScore = metricCount > 0 ? totalScore / metricCount : 0;

    return {
      score: Math.round(averageScore),
      grade: this.getGrade(averageScore),
      details
    };
  }

  private calculateScore(value: number, thresholds: { good: number; poor: number }): number {
    if (value <= thresholds.good) return 100;
    if (value <= thresholds.poor) return 50;
    return 0;
  }

  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public startMonitoring(): void {
    if (!this.isMonitoring) {
      this.initializeMonitoring();
    }
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
