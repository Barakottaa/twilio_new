'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimpleAuth } from '@/hooks/use-simple-auth';
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

export default function SimpleDashboard() {
  const { user, logout, hasPermission } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/simple-login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/simple-login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      permission: 'dashboard',
      description: 'Overview and statistics'
    },
    {
      title: 'Agents',
      icon: Users,
      permission: 'agents',
      description: 'Manage team members'
    },
    {
      title: 'Contacts',
      icon: MessageSquare,
      permission: 'contacts',
      description: 'Customer communications'
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      permission: 'analytics',
      description: 'Reports and insights'
    },
    {
      title: 'Settings',
      icon: Settings,
      permission: 'settings',
      description: 'System configuration'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">TwilioChat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user.username}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {user.role}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.username}!</h2>
          <p className="text-gray-600">Choose an option below to get started.</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const hasAccess = hasPermission(item.permission);
            const Icon = item.icon;
            
            return (
              <Card 
                key={item.title}
                className={`cursor-pointer transition-all duration-200 ${
                  hasAccess 
                    ? 'hover:shadow-lg hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (hasAccess) {
                    // Navigate to the appropriate page
                    const route = item.title.toLowerCase();
                    router.push(`/simple-${route}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      hasAccess ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      {!hasAccess && (
                        <span className="text-xs text-red-500">No access</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* User Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((permission) => (
                <span 
                  key={permission}
                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                >
                  {permission}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
