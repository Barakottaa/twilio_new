'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('🔐 Testing login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: 'admin', password: 'admin' }),
      });

      console.log('🔐 Login response status:', response.status);
      console.log('🔐 Login response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('🔐 Login response data:', data);

      setResult({
        login: {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: data
        }
      });

      // Test /api/auth/me immediately after login
      console.log('🔍 Testing /api/auth/me...');
      const meResponse = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      console.log('🔍 /api/auth/me response status:', meResponse.status);
      const meData = await meResponse.json();
      console.log('🔍 /api/auth/me response data:', meData);

      setResult(prev => ({
        ...prev,
        me: {
          status: meResponse.status,
          ok: meResponse.ok,
          headers: Object.fromEntries(meResponse.headers.entries()),
          data: meData
        }
      }));

    } catch (error) {
      console.error('❌ Test error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login Test</h1>
      
      <button 
        onClick={testLogin} 
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test Admin Login'}
      </button>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Cookies:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">{document.cookie || 'No cookies'}</pre>
      </div>
      
      {result && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
