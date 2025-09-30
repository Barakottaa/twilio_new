'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Zap, 
  Eye, 
  MousePointer, 
  Layout, 
  Wifi, 
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { performanceMonitor, type PerformanceMetrics } from '@/lib/performance-metrics';

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Start monitoring
    performanceMonitor.startMonitoring();
    setIsMonitoring(performanceMonitor.isMonitoringActive());

    // Subscribe to metrics updates
    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Get initial metrics
    const initialMetrics = performanceMonitor.getLatestMetrics();
    if (initialMetrics) {
      setMetrics(initialMetrics);
    }

    // Auto-refresh every 5 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        const latestMetrics = performanceMonitor.getLatestMetrics();
        if (latestMetrics) {
          setMetrics(latestMetrics);
        }
      }, 5000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleRefresh = () => {
    const latestMetrics = performanceMonitor.getLatestMetrics();
    if (latestMetrics) {
      setMetrics(latestMetrics);
    }
  };

  const getPerformanceScore = () => {
    if (!metrics) return null;
    return performanceMonitor.getPerformanceScore(metrics);
  };

  const getMetricColor = (value: number, good: number, poor: number) => {
    if (value <= good) return 'text-green-600';
    if (value <= poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricIcon = (value: number, good: number, poor: number) => {
    if (value <= good) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (value <= poor) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading performance metrics...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = getPerformanceScore();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Overview
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? "Monitoring" : "Stopped"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {score && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{score.score}</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1 text-primary">{score.grade}</div>
                <div className="text-sm text-muted-foreground">Grade</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {metrics.apiRequests}
                </div>
                <div className="text-sm text-muted-foreground">API Requests</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* TTFB */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">TTFB</span>
                </div>
                {getMetricIcon(metrics.ttfb, 800, 1800)}
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.ttfb, 800, 1800)}`}>
                {formatTime(metrics.ttfb)}
              </div>
              <div className="text-xs text-muted-foreground">Time to First Byte</div>
            </div>

            {/* FCP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">FCP</span>
                </div>
                {getMetricIcon(metrics.fcp, 1800, 3000)}
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.fcp, 1800, 3000)}`}>
                {formatTime(metrics.fcp)}
              </div>
              <div className="text-xs text-muted-foreground">First Contentful Paint</div>
            </div>

            {/* LCP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span className="text-sm font-medium">LCP</span>
                </div>
                {getMetricIcon(metrics.lcp, 2500, 4000)}
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.lcp, 2500, 4000)}`}>
                {formatTime(metrics.lcp)}
              </div>
              <div className="text-xs text-muted-foreground">Largest Contentful Paint</div>
            </div>

            {/* FID */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  <span className="text-sm font-medium">FID</span>
                </div>
                {getMetricIcon(metrics.fid, 100, 300)}
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.fid, 100, 300)}`}>
                {formatTime(metrics.fid)}
              </div>
              <div className="text-xs text-muted-foreground">First Input Delay</div>
            </div>

            {/* CLS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span className="text-sm font-medium">CLS</span>
                </div>
                {getMetricIcon(metrics.cls, 0.1, 0.25)}
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.cls, 0.1, 0.25)}`}>
                {metrics.cls.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">Cumulative Layout Shift</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Response Time</div>
              <div className="text-2xl font-bold text-primary">
                {formatTime(metrics.apiResponseTime)}
              </div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Requests</div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.apiRequests}
              </div>
              <div className="text-xs text-muted-foreground">Since page load</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Errors</div>
              <div className="text-2xl font-bold text-red-600">
                {metrics.apiErrors}
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.apiRequests > 0 
                  ? `${((metrics.apiErrors / metrics.apiRequests) * 100).toFixed(1)}% error rate`
                  : 'No requests'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Memory Usage</div>
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  <span className="text-sm">
                    {formatBytes(metrics.memoryUsed)} / {formatBytes(metrics.memoryTotal)}
                  </span>
                </div>
                <Progress 
                  value={(metrics.memoryUsed / metrics.memoryTotal) * 100} 
                  className="mt-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Network</div>
                <div className="space-y-1 text-sm">
                  <div>Type: {metrics.connectionType}</div>
                  <div>Speed: {metrics.effectiveType}</div>
                  <div>Downlink: {metrics.downlink} Mbps</div>
                  <div>RTT: {metrics.rtt}ms</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Load Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Page Load Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">DOM Load</div>
              <div className="text-xl font-bold text-green-600">
                {formatTime(metrics.domLoad)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Window Load</div>
              <div className="text-xl font-bold text-blue-600">
                {formatTime(metrics.windowLoad)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Updated</div>
              <div className="text-sm text-muted-foreground">
                {new Date(metrics.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
