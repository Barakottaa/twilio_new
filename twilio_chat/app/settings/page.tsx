'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  MessageSquare, 
  Users, 
  Globe, 
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface SettingsData {
  // General Settings
  appName: string;
  appVersion: string;
  environment: string;
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: string;
  passwordPolicy: string;
  
  // Integration Settings
  twilioAccountSid: string;
  twilioAuthToken: string;
  webhookUrl: string;
  
  // Chat Settings
  autoAssignChats: boolean;
  maxConcurrentChats: number;
  defaultAgentStatus: string;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  
  // Database Settings
  databaseType: string;
  connectionPool: number;
  queryTimeout: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    // General Settings
    appName: 'TwilioChat',
    appVersion: '1.0.0',
    environment: 'development',
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '8h',
    passwordPolicy: 'strong',
    
    // Integration Settings
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: '••••••••••••••••••••••••••••••••',
    webhookUrl: process.env.WEBHOOK_URL || 'https://your-domain.com/api/twilio/webhook',
    
    // Chat Settings
    autoAssignChats: true,
    maxConcurrentChats: 5,
    defaultAgentStatus: 'online',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: false,
    soundNotifications: true,
    
    // Database Settings
    databaseType: 'sqlite',
    connectionPool: 10,
    queryTimeout: 30
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      appName: 'TwilioChat',
      appVersion: '1.0.0',
      environment: 'development',
      twoFactorAuth: false,
      sessionTimeout: '8h',
      passwordPolicy: 'strong',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: '••••••••••••••••••••••••••••••••',
      webhookUrl: process.env.WEBHOOK_URL || 'https://your-domain.com/api/twilio/webhook',
      autoAssignChats: true,
      maxConcurrentChats: 5,
      defaultAgentStatus: 'online',
      emailNotifications: true,
      pushNotifications: false,
      soundNotifications: true,
      databaseType: 'sqlite',
      connectionPool: 10,
      queryTimeout: 30
    });
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Save className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'success':
        return 'Saved successfully';
      case 'error':
        return 'Save failed';
      default:
        return 'Save Settings';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
        </Button>
      </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                    onChange={(e) => setSettings({...settings, appName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
                  <Label htmlFor="appVersion">Version</Label>
                  <Input
                    id="appVersion"
                    value={settings.appVersion}
                    disabled
            />
          </div>
          </div>
          <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select value={settings.environment} onValueChange={(value) => setSettings({...settings, environment: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
            />
          </div>
              <Separator />
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <Select value={settings.sessionTimeout} onValueChange={(value) => setSettings({...settings, sessionTimeout: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="8h">8 Hours</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">Password Policy</Label>
                <Select value={settings.passwordPolicy} onValueChange={(value) => setSettings({...settings, passwordPolicy: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="very-strong">Very Strong</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
            <Input
              id="twilioAccountSid"
              value={settings.twilioAccountSid}
                  onChange={(e) => setSettings({...settings, twilioAccountSid: e.target.value})}
                  placeholder="Enter your Twilio Account SID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
            <Input
              id="twilioAuthToken"
              type="password"
              value={settings.twilioAuthToken}
                  onChange={(e) => setSettings({...settings, twilioAuthToken: e.target.value})}
                  placeholder="Enter your Twilio Auth Token"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={settings.webhookUrl}
                  onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                  placeholder="https://your-domain.com/api/twilio/webhook"
            />
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
            Chat Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-assign Chats</Label>
                  <p className="text-sm text-muted-foreground">Automatically assign incoming chats to available agents</p>
            </div>
            <Switch
              checked={settings.autoAssignChats}
                  onCheckedChange={(checked) => setSettings({...settings, autoAssignChats: checked})}
            />
          </div>
              <Separator />
            <div className="space-y-2">
                <Label htmlFor="maxConcurrentChats">Max Concurrent Chats per Agent</Label>
              <Input
                id="maxConcurrentChats"
                type="number"
                min="1"
                max="20"
                  value={settings.maxConcurrentChats}
                  onChange={(e) => setSettings({...settings, maxConcurrentChats: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultAgentStatus">Default Agent Status</Label>
                <Select value={settings.defaultAgentStatus} onValueChange={(value) => setSettings({...settings, defaultAgentStatus: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send push notifications to browser</p>
            </div>
            <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Notifications</Label>
                  <p className="text-sm text-muted-foreground">Play sound for new messages</p>
            </div>
            <Switch
                  checked={settings.soundNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, soundNotifications: checked})}
            />
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="databaseType">Database Type</Label>
                <Select value={settings.databaseType} onValueChange={(value) => setSettings({...settings, databaseType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="memory">In-Memory (Development)</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="connectionPool">Connection Pool Size</Label>
                <Input
                  id="connectionPool"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.connectionPool}
                  onChange={(e) => setSettings({...settings, connectionPool: parseInt(e.target.value)})}
                />
            </div>
              <div className="space-y-2">
                <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
                <Input
                  id="queryTimeout"
                  type="number"
                  min="5"
                  max="300"
                  value={settings.queryTimeout}
                  onChange={(e) => setSettings({...settings, queryTimeout: parseInt(e.target.value)})}
                />
          </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Database settings require a server restart to take effect.
                </AlertDescription>
              </Alert>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
