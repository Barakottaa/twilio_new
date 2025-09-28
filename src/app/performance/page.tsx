'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, HardDrive, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  timing: {
    loadTime: number;
    renderTime: number;
    apiResponseTime: number;
  };
  bundle: {
    size: number;
    chunks: number;
  };
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  const updateMetrics = () => {
    if (typeof window === 'undefined') return;

    const newMetrics: PerformanceMetrics = {
      memory: {
        used: 0,
        total: 0,
        limit: 0,
      },
      timing: {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: 0,
      },
      bundle: {
        size: 0,
        chunks: 0,
      },
    };

    // Memory metrics
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      newMetrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }

    // Timing metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      newMetrics.timing.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      newMetrics.timing.renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    }

    // API response time (simplified)
    const apiEntries = performance.getEntriesByType('resource').filter(
      (entry: any) => entry.name.includes('/api/')
    );
    if (apiEntries.length > 0) {
      newMetrics.timing.apiResponseTime = apiEntries.reduce(
        (sum: number, entry: any) => sum + entry.duration, 0
      ) / apiEntries.length;
    }

    setMetrics(newMetrics);

    // Check for performance alerts
    const newAlerts: string[] = [];
    if (newMetrics.memory.used > 500 * 1024 * 1024) { // 500MB
      newAlerts.push('High memory usage detected (>500MB)');
    }
    if (newMetrics.timing.loadTime > 3000) { // 3 seconds
      newAlerts.push('Slow page load time (>3s)');
    }
    if (newMetrics.timing.apiResponseTime > 1000) { // 1 second
      newAlerts.push('Slow API response time (>1s)');
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    if (isMonitoring) {
      updateMetrics();
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    return ms.toFixed(0) + 'ms';
  };

  const getMemoryUsagePercentage = () => {
    if (!metrics) return 0;
    return (metrics.memory.used / metrics.memory.limit) * 100;
  };

  const getPerformanceScore = () => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // Memory penalty
    const memoryUsage = getMemoryUsagePercentage();
    if (memoryUsage > 80) score -= 30;
    else if (memoryUsage > 60) score -= 20;
    else if (memoryUsage > 40) score -= 10;
    
    // Load time penalty
    if (metrics.timing.loadTime > 3000) score -= 25;
    else if (metrics.timing.loadTime > 2000) score -= 15;
    else if (metrics.timing.loadTime > 1000) score -= 10;
    
    // API response time penalty
    if (metrics.timing.apiResponseTime > 1000) score -= 20;
    else if (metrics.timing.apiResponseTime > 500) score -= 10;
    
    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor app performance and memory usage</p>
        </div>
        <Button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          variant={isMonitoring ? "destructive" : "default"}
        >
          {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
      </div>

      {/* Performance Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(performanceScore)}>
                {performanceScore.toFixed(0)}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div className="flex-1">
              <Progress value={performanceScore} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Poor</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Used</span>
                  <span className="font-mono">{formatBytes(metrics.memory.used)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-mono">{formatBytes(metrics.memory.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Limit</span>
                  <span className="font-mono">{formatBytes(metrics.memory.limit)}</span>
                </div>
                <Progress value={getMemoryUsagePercentage()} className="h-2" />
                <div className="text-center text-sm text-muted-foreground">
                  {getMemoryUsagePercentage().toFixed(1)}% used
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Load Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Load Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Page Load</span>
                  <span className="font-mono">{formatTime(metrics.timing.loadTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Render Time</span>
                  <span className="font-mono">{formatTime(metrics.timing.renderTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>API Response</span>
                  <span className="font-mono">{formatTime(metrics.timing.apiResponseTime)}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Bundle Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Bundle Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Size</span>
                <span className="font-mono">{formatBytes(metrics?.bundle.size || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Chunks</span>
                <span className="font-mono">{metrics?.bundle.chunks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <Badge variant={isMonitoring ? "default" : "secondary"}>
                  {isMonitoring ? "Monitoring" : "Stopped"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getMemoryUsagePercentage() > 80 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Consider reducing the number of loaded conversations or implementing pagination</span>
              </div>
            )}
            {metrics && metrics.timing.loadTime > 2000 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Page load time is slow. Consider code splitting or lazy loading</span>
              </div>
            )}
            {metrics && metrics.timing.apiResponseTime > 500 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>API response times are slow. Consider optimizing database queries</span>
              </div>
            )}
            {performanceScore >= 80 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Performance is good! Keep monitoring for any regressions</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
