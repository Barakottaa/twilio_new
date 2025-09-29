'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function DiagnosePage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Simple Auth System
      console.log('🔍 Testing Simple Auth System...');
      try {
        const { login, getCurrentUser } = await import('@/lib/simple-auth');
        const testUser = login('admin', 'admin');
        diagnostics.tests.simpleAuth = {
          status: testUser ? 'PASS' : 'FAIL',
          message: testUser ? 'Simple auth working' : 'Simple auth failed',
          user: testUser
        };
      } catch (error) {
        diagnostics.tests.simpleAuth = {
          status: 'ERROR',
          message: `Simple auth error: ${error}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 2: Complex Auth System (Database)
      console.log('🔍 Testing Complex Auth System...');
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin' })
        });
        const data = await response.json();
        diagnostics.tests.complexAuth = {
          status: response.ok ? 'PASS' : 'FAIL',
          message: response.ok ? 'Complex auth working' : 'Complex auth failed',
          statusCode: response.status,
          data: data
        };
      } catch (error) {
        diagnostics.tests.complexAuth = {
          status: 'ERROR',
          message: `Complex auth error: ${error}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Database Status
      console.log('🔍 Testing Database...');
      try {
        const response = await fetch('/api/reset-database', { method: 'POST' });
        const data = await response.json();
        diagnostics.tests.database = {
          status: response.ok ? 'PASS' : 'FAIL',
          message: response.ok ? 'Database working' : 'Database failed',
          data: data
        };
      } catch (error) {
        diagnostics.tests.database = {
          status: 'ERROR',
          message: `Database error: ${error}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 4: Browser Environment
      console.log('🔍 Testing Browser Environment...');
      diagnostics.tests.browser = {
        status: 'PASS',
        message: 'Browser environment OK',
        localStorage: typeof localStorage !== 'undefined',
        cookies: document.cookie,
        userAgent: navigator.userAgent
      };

      // Test 5: Simple Login Page
      console.log('🔍 Testing Simple Login Page...');
      try {
        const response = await fetch('/simple-login');
        diagnostics.tests.simpleLoginPage = {
          status: response.ok ? 'PASS' : 'FAIL',
          message: response.ok ? 'Simple login page accessible' : 'Simple login page failed',
          statusCode: response.status
        };
      } catch (error) {
        diagnostics.tests.simpleLoginPage = {
          status: 'ERROR',
          message: `Simple login page error: ${error}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 6: Complex Login Page
      console.log('🔍 Testing Complex Login Page...');
      try {
        const response = await fetch('/login');
        diagnostics.tests.complexLoginPage = {
          status: response.ok ? 'PASS' : 'FAIL',
          message: response.ok ? 'Complex login page accessible' : 'Complex login page failed',
          statusCode: response.status
        };
      } catch (error) {
        diagnostics.tests.complexLoginPage = {
          status: 'ERROR',
          message: `Complex login page error: ${error}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

    } catch (error) {
      diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setResults(diagnostics);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
      
      <Button 
        onClick={runDiagnostics} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
      </Button>

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results.tests || {}).map(([testName, testResult]: [string, any]) => (
                  <div key={testName} className="flex items-center space-x-3 p-3 border rounded">
                    {getStatusIcon(testResult.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h3>
                      <p className="text-sm text-gray-600">{testResult.message}</p>
                      {testResult.error && (
                        <p className="text-sm text-red-600 mt-1">Error: {testResult.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Diagnostic Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>For Local Use:</strong> Use the Simple Authentication System at <code>/simple-login</code>
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>For Production:</strong> Use the Complex Authentication System at <code>/login</code>
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Database Issues:</strong> Run <code>POST /api/reset-database</code> to reset the database
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
