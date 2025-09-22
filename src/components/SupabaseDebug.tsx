'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseDebug() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing connection...');
    
    try {
      console.log('=== SUPABASE DEBUG INFO ===');
      console.log('Supabase client:', supabase);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Public URL env:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Public key env:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
      
      // Test basic connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Connection error:', error);
        setTestResult(`❌ Connection failed: ${error.message}`);
      } else {
        console.log('Connection successful:', data);
        setTestResult('✅ Connection successful!');
        
        // Test a simple query
        const { data: testData, error: testError } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
          
        if (testError) {
          if (testError.code === 'PGRST116') {
            setTestResult('✅ Connection successful! Table user_profiles does not exist yet (normal for new projects)');
          } else {
            setTestResult(`⚠️ Connection OK but table access failed: ${testError.message}`);
          }
        } else {
          setTestResult('✅ Connection and table access successful!');
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setTestResult('Testing signup...');
    
    try {
      const testEmail = `test${Date.now()}@example.com`;
      console.log('Testing signup with:', testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            name: 'Test User',
          },
        },
      });

      if (error) {
        console.error('Signup test error:', error);
        setTestResult(`❌ Signup test failed: ${error.message} (Code: ${error.status})`);
      } else {
        console.log('Signup test successful:', data);
        setTestResult('✅ Signup test successful! Check your email for confirmation.');
      }
    } catch (error) {
      console.error('Signup test exception:', error);
      setTestResult(`❌ Signup test exception: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Supabase Debug Tool</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        <div>
          <button
            onClick={testSignup}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <p className="text-sm">{testResult || 'Click a test button to start...'}</p>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm">
            Check your browser console (F12) for detailed debug information.
          </p>
        </div>
      </div>
    </div>
  );
}
