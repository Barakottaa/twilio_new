import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance-metrics';

// API endpoint to get performance metrics
export async function GET(req: NextRequest) {
  try {
    const metrics = performanceMonitor.getMetrics();
    const latestMetrics = performanceMonitor.getLatestMetrics();
    const isMonitoring = performanceMonitor.isMonitoringActive();

    return NextResponse.json({
      success: true,
      data: {
        isMonitoring,
        latestMetrics,
        allMetrics: metrics,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// API endpoint to start/stop monitoring
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === 'start') {
      performanceMonitor.startMonitoring();
    } else if (action === 'stop') {
      performanceMonitor.stopMonitoring();
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Performance monitoring ${action}ed`,
      isMonitoring: performanceMonitor.isMonitoringActive()
    });
  } catch (error) {
    console.error('Error controlling performance monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to control performance monitoring' },
      { status: 500 }
    );
  }
}
