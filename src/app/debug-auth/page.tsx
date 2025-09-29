'use client';

import { useState } from 'react';

export default function DebugAuthPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async (username: string, password: string) => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Login
      console.log(`🔐 Testing login for ${username}...`);
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      results.login = {
        status: loginResponse.status,
        ok: loginResponse.ok,
        headers: Object.fromEntries(loginResponse.headers.entries()),
        data: await loginResponse.json()
      };

      console.log('🔐 Login result:', results.login);

      // Test 2: Check auth immediately after login
      console.log('🔍 Testing /api/auth/me immediately after login...');
      const meResponse1 = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      results.meImmediate = {
        status: meResponse1.status,
        ok: meResponse1.ok,
        headers: Object.fromEntries(meResponse1.headers.entries()),
        data: meResponse1.ok ? await meResponse1.json() : await meResponse1.text()
      };

      console.log('🔍 Immediate /api/auth/me result:', results.meImmediate);

      // Test 3: Check auth after a delay
      console.log('🔍 Testing /api/auth/me after 1 second delay...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const meResponse2 = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      results.meDelayed = {
        status: meResponse2.status,
        ok: meResponse2.ok,
        headers: Object.fromEntries(meResponse2.headers.entries()),
        data: meResponse2.ok ? await meResponse2.json() : await meResponse2.text()
      };

      console.log('🔍 Delayed /api/auth/me result:', results.meDelayed);

      // Test 4: Check cookies
      results.cookies = document.cookie;

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Test error:', error);
    }

    setResults(results);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-2 mb-4">
        <h2 className="text-lg font-semibold">Test Users:</h2>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => testLogin('admin', 'admin')} 
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Admin'}
          </button>
          <button 
            onClick={() => testLogin('agent1', 'password123')} 
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Agent1'}
          </button>
          <button 
            onClick={() => testLogin('supervisor', 'supervisor123')} 
            disabled={loading}
            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Supervisor'}
          </button>
          <button 
            onClick={() => testLogin('manager', 'manager123')} 
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Manager'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Cookies:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">{document.cookie || 'No cookies'}</pre>
      </div>
      
      {results && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
