'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap
} from 'lucide-react';

// Mock analytics data
const mockAnalytics = {
  totalConversations: 1247,
  activeConversations: 23,
  totalAgents: 8,
  onlineAgents: 5,
  avgResponseTime: '2.3m',
  customerSatisfaction: 4.7,
  messagesToday: 342,
  conversationsResolved: 89,
  conversationsEscalated: 12,
  peakHours: '2:00 PM - 4:00 PM',
  topAgent: 'Alice Johnson',
  topDepartment: 'Customer Success'
};

const mockTrends = [
  { period: 'Last 7 days', conversations: 156, change: 12, positive: true },
  { period: 'Last 30 days', conversations: 1247, change: -3, positive: false },
  { period: 'Last 90 days', conversations: 3891, change: 8, positive: true }
];

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              {mockAnalytics.onlineAgents} agents online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">
              -15% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.customerSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">
              +0.3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversation Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{trend.period}</p>
                    <p className="text-sm text-muted-foreground">{trend.conversations} conversations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {trend.positive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={trend.positive ? "default" : "destructive"}>
                      {trend.positive ? '+' : ''}{trend.change}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages Today</p>
                  <p className="text-sm text-muted-foreground">Total message volume</p>
                </div>
                <Badge variant="secondary">{mockAnalytics.messagesToday}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resolved Today</p>
                  <p className="text-sm text-muted-foreground">Successfully closed</p>
                </div>
                <Badge variant="default">{mockAnalytics.conversationsResolved}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Escalated Today</p>
                  <p className="text-sm text-muted-foreground">Requiring attention</p>
                </div>
                <Badge variant="destructive">{mockAnalytics.conversationsEscalated}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Peak Hours</p>
                  <p className="text-sm text-muted-foreground">Highest activity</p>
                </div>
                <Badge variant="outline">{mockAnalytics.peakHours}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">{mockAnalytics.topAgent}</p>
                <p className="text-sm text-muted-foreground">{mockAnalytics.topDepartment}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">Top Agent</Badge>
                  <span className="text-xs text-muted-foreground">98% satisfaction</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customer Success</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">95%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sales</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">87%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Technical Support</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">78%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
