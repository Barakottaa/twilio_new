// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Performance timer "${label}" was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`🐌 Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.log(`⏱️ Operation: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label);
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => this.end(label));
    } else {
      this.end(label);
      return result;
    }
  }
}

// Performance metrics collection
export class MetricsCollector {
  private static metrics = new Map<string, number[]>();

  static record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push(value);
  }

  static getAverage(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static getStats(metric: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  static clear(metric?: string): void {
    if (metric) {
      this.metrics.delete(metric);
    } else {
      this.metrics.clear();
    }
  }
}
