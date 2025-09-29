'use client';

import { useState, useEffect } from 'react';
import { SimpleUser, login, getCurrentUser, logout, hasPermission } from '@/lib/simple-auth';

export function useSimpleAuth() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const loginUser = async (username: string, password: string) => {
    const loggedInUser = login(username, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const logoutUser = () => {
    logout();
    setUser(null);
  };

  const checkPermission = (permission: string) => {
    return hasPermission(permission);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: loginUser,
    logout: logoutUser,
    hasPermission: checkPermission
  };
}
