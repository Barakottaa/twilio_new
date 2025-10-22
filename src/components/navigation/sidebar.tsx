'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Users, 
  UserCheck, 
  Settings, 
  BarChart3,
  Activity,
  Bug,
  Menu,
  X,
  Home,
  LogOut,
  Loader2,
  Send
} from 'lucide-react';
import type { Agent } from '@/types';

interface SidebarProps {
  loggedInAgent: Agent;
  className?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Main chat interface',
    permission: 'dashboard'
  },
  {
    name: 'Agents',
    href: '/agents',
    icon: Users,
    description: 'Agent management',
    permission: 'agents'
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: UserCheck,
    description: 'Contact information',
    permission: 'contacts'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance metrics',
    permission: 'analytics'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App configuration',
    permission: 'settings'
  }
];

export function Sidebar({ loggedInAgent, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [isHovered, setIsHovered] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Clear loading state when pathname changes (navigation completed)
  useEffect(() => {
    setLoadingItem(null);
    setClickedItem(null);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300 ease-out",
        (isCollapsed && !isHovered) ? "w-16" : "w-64",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {(isHovered || !isCollapsed) && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TwilioChat</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 transition-all duration-100 hover:scale-105 active:scale-95"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const hasPermission = loggedInAgent.permissions[item.permission as keyof typeof loggedInAgent.permissions];
          
          if (!hasPermission) return null;
          
          const isClicked = clickedItem === item.href;
          
          const handleNavigation = (href: string) => {
            if (href === pathname) return; // Don't navigate if already on the page
            
            setClickedItem(href);
            setLoadingItem(href);
            router.push(href);
          };

          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10 transition-all duration-200",
                (isCollapsed && !isHovered) && "justify-center px-2",
                isClicked && "scale-95 bg-primary/10",
                loadingItem === item.href && "opacity-70"
              )}
              title={(isCollapsed && !isHovered) ? item.name : undefined}
              onClick={() => handleNavigation(item.href)}
              disabled={loadingItem === item.href}
            >
                {loadingItem === item.href ? (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                ) : (
                  <Icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-100",
                    isClicked && "scale-110"
                  )} />
                )}
                {(isHovered || !isCollapsed) && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                )}
              </Button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className={cn(
          "flex items-center gap-3",
          (isCollapsed && !isHovered) && "justify-center"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarFallback>{loggedInAgent.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {(isHovered || !isCollapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{loggedInAgent.username}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{loggedInAgent.role}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  loggedInAgent.role === 'admin' && "bg-purple-500",
                  loggedInAgent.role === 'agent' && "bg-blue-500"
                )} />
                <span className="text-xs text-muted-foreground capitalize">{loggedInAgent.role}</span>
              </div>
            </div>
          )}
        </div>
        {(isHovered || !isCollapsed) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
        {isCollapsed && !isHovered && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
