'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { performanceMonitor, type PerformanceMetrics } from '@/lib/performance-metrics';

interface PerformanceWidgetProps {
  className?: string;
  compact?: boolean;
}

export function PerformanceWidget({ className, compact = false }: PerformanceWidgetProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

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

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      const latestMetrics = performanceMonitor.getLatestMetrics();
      if (latestMetrics) {
        setMetrics(latestMetrics);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

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

  const getMetricStatus = (value: number, good: number, poor: number) => {
    if (value <= good) return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    if (value <= poor) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-600', icon: XCircle };
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = getPerformanceScore();

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="flex items-center gap-2">
              {score && (
                <Badge variant={score.grade === 'A' ? 'default' : score.grade === 'B' ? 'secondary' : 'destructive'}>
                  {score.score}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? "default" : "secondary"} className="text-xs">
                {isMonitoring ? "Live" : "Off"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Overall Score */}
          {score && (
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{score.score}</div>
              <div className="text-xs text-muted-foreground">Overall Score ({score.grade})</div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* TTFB */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">TTFB</span>
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getMetricStatus(metrics.ttfb, 800, 1800);
                  const Icon = status.icon;
                  return (
                    <>
                      <Icon className={`h-3 w-3 ${status.color}`} />
                      <span className={status.color}>{formatTime(metrics.ttfb)}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* FCP */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">FCP</span>
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getMetricStatus(metrics.fcp, 1800, 3000);
                  const Icon = status.icon;
                  return (
                    <>
                      <Icon className={`h-3 w-3 ${status.color}`} />
                      <span className={status.color}>{formatTime(metrics.fcp)}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* LCP */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">LCP</span>
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getMetricStatus(metrics.lcp, 2500, 4000);
                  const Icon = status.icon;
                  return (
                    <>
                      <Icon className={`h-3 w-3 ${status.color}`} />
                      <span className={status.color}>{formatTime(metrics.lcp)}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* API Response */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-600">{formatTime(metrics.apiResponseTime)}</span>
              </div>
            </div>
          </div>

          {/* API Stats */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Requests</span>
              <span className="font-medium">{metrics.apiRequests}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Errors</span>
              <span className={`font-medium ${metrics.apiErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.apiErrors}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
