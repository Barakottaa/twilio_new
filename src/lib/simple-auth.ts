// Simple authentication for local use only
export interface SimpleUser {
  id: string;
  username: string;
  role: 'admin' | 'agent';
  permissions: string[];
}

// Simple user database (in memory)
const users: Record<string, SimpleUser> = {
  admin: {
    id: 'admin',
    username: 'admin',
    role: 'admin',
    permissions: ['dashboard', 'agents', 'contacts', 'analytics', 'settings']
  },
  agent1: {
    id: 'agent1',
    username: 'agent1',
    role: 'agent',
    permissions: ['dashboard', 'contacts']
  },
  supervisor: {
    id: 'supervisor',
    username: 'supervisor',
    role: 'agent',
    permissions: ['dashboard', 'agents', 'contacts', 'analytics']
  },
  manager: {
    id: 'manager',
    username: 'manager',
    role: 'admin',
    permissions: ['dashboard', 'agents', 'contacts', 'analytics', 'settings']
  }
};

// Simple passwords (for local use only)
const passwords: Record<string, string> = {
  admin: 'admin',
  agent1: 'password123',
  supervisor: 'supervisor123',
  manager: 'manager123'
};

export function login(username: string, password: string): SimpleUser | null {
  const user = users[username];
  const correctPassword = passwords[username];
  
  if (user && password === correctPassword) {
    // Store in localStorage (simple session management)
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  
  return null;
}

export function getCurrentUser(): SimpleUser | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('currentUser');
}

export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  return user.permissions.includes(permission) || user.permissions.includes('all');
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}
