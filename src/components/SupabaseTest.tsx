'use client'

import React, { useState } from 'react'
import { useSupabase } from './providers/SupabaseProvider'
import { supabase } from '@/lib/supabase'

export default function SupabaseTest() {
  const { signUp, signIn, user, signOut } = useSupabase()
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setLoading(prev => ({ ...prev, [testName]: true }))
    setMessages(prev => ({ ...prev, [testName]: 'Running test...' }))
    
    try {
      const result = await testFn()
      setTestResults(prev => ({ ...prev, [testName]: result }))
      setMessages(prev => ({ 
        ...prev, 
        [testName]: result ? 'Test passed!' : 'Test failed!' 
      }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: false }))
      setMessages(prev => ({ 
        ...prev, 
        [testName]: `Error: ${error}` 
      }))
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }))
    }
  }

  const testConnection = async () => {
    try {
      // First test basic client creation
      if (!supabase) {
        setMessages(prev => ({ ...prev, 'Connection': 'Supabase client not initialized' }))
        return false
      }

      // Test basic connection by checking if we can access the client
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist yet - this is normal for new projects
          setMessages(prev => ({ ...prev, 'Connection': 'Connected! Table user_profiles does not exist yet (normal for new projects)' }))
          return true
        }
        if (error.message.includes('Invalid API key')) {
          setMessages(prev => ({ ...prev, 'Connection': 'Invalid API key - check your Supabase credentials' }))
          return false
        }
        if (error.code === 'PGRST301') {
          setMessages(prev => ({ ...prev, 'Connection': '401 Unauthorized - check API key and project status' }))
          return false
        }
        setMessages(prev => ({ ...prev, 'Connection': `Connection error: ${error.message} (Code: ${error.code})` }))
        return false
      }
      
      setMessages(prev => ({ ...prev, 'Connection': 'Connection successfully!' }))
      return true
    } catch (error) {
      setMessages(prev => ({ ...prev, 'Connection': `Connection failed: ${error}` }))
      return false
    }
  }

  const testAuth = async () => {
    try {
      // Test if auth is working by checking current user
      if (user) {
        setMessages(prev => ({ ...prev, 'Auth': `Auth working! User: ${user.email}` }))
        return true
      } else {
        setMessages(prev => ({ ...prev, 'Auth': 'Auth working! No user logged in' }))
        return true
      }
    } catch (error) {
      setMessages(prev => ({ ...prev, 'Auth': `Auth test failed: ${error}` }))
      return false
    }
  }

  const testSignUp = async () => {
    try {
      const testEmail = `test${Date.now()}@gmail.com`
      const { user, error } = await signUp(testEmail, 'testpassword123', 'Test', 'User', '1234567890', 'whatsapp', 'daily')
      
      if (error) {
        console.error('Signup error:', error)
        setMessages(prev => ({ ...prev, 'Sign Up': `Error: ${error.message}` }))
        return false
      }
      
      if (user) {
        setMessages(prev => ({ ...prev, 'Sign Up': 'User created successfully!' }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Signup exception:', error)
      setMessages(prev => ({ ...prev, 'Sign Up': `Exception: ${error}` }))
      return false
    }
  }

  const testDirectSignUp = async () => {
    try {
      const testEmail = `direct${Date.now()}@gmail.com`
      const { user, error } = await signUp(testEmail, 'testpassword123', 'Direct', 'Test', '1234567890', 'whatsapp', 'daily')
      
      if (error) {
        console.error('Direct signup error:', error)
        setMessages(prev => ({ ...prev, 'Direct Sign Up': `Error: ${error.message}` }))
        return false
      }
      
      if (user) {
        setMessages(prev => ({ ...prev, 'Direct Sign Up': 'User created successfully!' }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Direct signup exception:', error)
      setMessages(prev => ({ ...prev, 'Direct Sign Up': `Exception: ${error}` }))
      return false
    }
  }

  const testRealEmailSignUp = async () => {
    try {
      const testEmail = `realtest${Date.now()}@testdomain.org`
      const { user, error } = await signUp(testEmail, 'testpassword123', 'Real', 'Test', '1234567890', 'whatsapp', 'daily')
      
      if (error) {
        console.error('Real email signup error:', error)
        setMessages(prev => ({ ...prev, 'Real Email Sign Up': `Error: ${error.message}` }))
        return false
      }
      
      if (user) {
        setMessages(prev => ({ ...prev, 'Real Email Sign Up': 'User created successfully!' }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Real email signup exception:', error)
      setMessages(prev => ({ ...prev, 'Real Email Sign Up': `Exception: ${error}` }))
      return false
    }
  }

  const testLogin = async () => {
    try {
      // Try to sign in with a test account
      const testEmail = `logintest${Date.now()}@gmail.com`
      const password = 'testpassword123'
      
      // First create the account
      const { user: signupUser, error: signupError } = await signUp(testEmail, password, 'Login', 'Test', '1234567890', 'whatsapp', 'daily')
      if (signupError || !signupUser) {
        console.error('Login test signup failed:', signupError)
        setMessages(prev => ({ ...prev, 'Login': `Signup failed: ${signupError?.message || 'Unknown error'}` }))
        return false
      }
      
      // Then try to sign in
      const { user: signinUser, error: signinError } = await signIn(testEmail, password)
      if (signinError) {
        console.error('Login test signin failed:', signinError)
        setMessages(prev => ({ ...prev, 'Login': `Signin failed: ${signinError.message}` }))
        return false
      }
      
      if (signinUser) {
        setMessages(prev => ({ ...prev, 'Login': 'Login successful!' }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login test exception:', error)
      setMessages(prev => ({ ...prev, 'Login': `Exception: ${error}` }))
      return false
    }
  }

  const testDatabaseTables = async () => {
    try {
      // Test if we can access database tables
      const { data, error } = await supabase.from('user_profiles').select('*').limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist yet - this is normal for new projects
          setMessages(prev => ({ ...prev, 'Database Tables': 'Database accessible! Table user_profiles does not exist yet (run schema first)' }))
          return true
        }
        setMessages(prev => ({ ...prev, 'Database Tables': `Database error: ${error.message}` }))
        return false
      }
      
      setMessages(prev => ({ ...prev, 'Database Tables': 'Database accessible! Found user profiles' }))
      return true
    } catch (error) {
      setMessages(prev => ({ ...prev, 'Database Tables': `Database test failed: ${error}` }))
      return false
    }
  }

  const checkAuthUsers = async () => {
    try {
      // Check if we can access auth information
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setMessages(prev => ({ ...prev, 'Check Auth Users': `Auth check failed: ${error.message}` }))
        return false
      }
      
      setMessages(prev => ({ ...prev, 'Check Auth Users': 'Auth system accessible!' }))
      return true
    } catch (error) {
      setMessages(prev => ({ ...prev, 'Check Auth Users': `Auth check failed: ${error}` }))
      return false
    }
  }

  const testPing = async () => {
    try {
      // Simple ping test to check basic connectivity
      console.log('Testing ping with supabase client:', supabase)
      
      // Test with a simple query that doesn't require auth
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
      
      if (error) {
        console.error('Ping error details:', error)
        if (error.message.includes('Invalid API key')) {
          setMessages(prev => ({ ...prev, 'Ping': 'Invalid API key - check credentials' }))
          return false
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setMessages(prev => ({ ...prev, 'Ping': '401 Unauthorized - check API key and project status' }))
          return false
        }
        if (error.code === 'PGRST116') {
          // Table doesn't exist yet - this is normal for new projects
          setMessages(prev => ({ ...prev, 'Ping': 'Ping successful! Table user_profiles does not exist yet (normal)' }))
          return true
        }
        setMessages(prev => ({ ...prev, 'Ping': `Ping failed: ${error.message}` }))
        return false
      }
      
      setMessages(prev => ({ ...prev, 'Ping': 'Ping successful!' }))
      return true
    } catch (error) {
      console.error('Ping exception:', error)
      setMessages(prev => ({ ...prev, 'Ping': `Ping failed: ${error}` }))
      return false
    }
  }

  const testCredentials = async () => {
    try {
      // Test if we can make a basic request to verify credentials
      const response = await fetch('https://pfbcpqifhbqpymnagzss.supabase.co/rest/v1/user_profiles?select=count&limit=1', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYmNwcWlmaGJxcHltbmFnbnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTk3MjYsImV4cCI6MjA3MTc3NTcyNn0.GrGMT7osZzP56sJzF5cNp620e2eLJrv2veIjCbaQiVA',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYmNwcWlmaGJxcHltbmFnbnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTk3MjYsImV4cCI6MjA3MTc3NTcyNn0.GrGMT7osZzP56sJzF5cNp620e2eLJrv2veIjCbaQiVA'
        }
      })
      
      if (response.status === 401) {
        setMessages(prev => ({ ...prev, 'Credentials': '401 Unauthorized - API key is invalid or project is paused' }))
        return false
      }
      
      if (response.status === 200) {
        setMessages(prev => ({ ...prev, 'Credentials': 'Credentials are valid!' }))
        return true
      }
      
      setMessages(prev => ({ ...prev, 'Credentials': `Unexpected status: ${response.status}` }))
      return false
    } catch (error) {
      setMessages(prev => ({ ...prev, 'Credentials': `Credential test failed: ${error}` }))
      return false
    }
  }

  const tests = [
    { name: 'Credentials', test: testCredentials },
    { name: 'Ping', test: testPing },
    { name: 'Connection', test: testConnection },
    { name: 'Auth', test: testAuth },
    { name: 'Sign Up', test: testSignUp },
    { name: 'Direct Sign Up', test: testDirectSignUp },
    { name: 'Real Email Sign Up', test: testRealEmailSignUp },
    { name: 'Login', test: testLogin },
    { name: 'Database Tables', test: testDatabaseTables },
    { name: 'Check Auth Users', test: checkAuthUsers },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Supabase Integration Tests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(({ name, test }) => (
          <div key={name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{name}</h3>
              <div className="flex items-center space-x-2">
                {loading[name] && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
                {testResults[name] !== undefined && (
                  <span className={testResults[name] ? 'text-green-500' : 'text-red-500'}>
                    {testResults[name] ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {messages[name] || 'Click to run test'}
            </p>
            
            <button
              onClick={() => runTest(name, test)}
              disabled={loading[name]}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading[name] ? 'Running...' : `Test ${name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current User Status:</h3>
        {user ? (
          <div className="text-green-600">
            ✅ Logged in as: {user.email}
            <button
              onClick={() => signOut()}
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-gray-600">❌ Not logged in</div>
        )}
      </div>

             <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
         <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
         <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
           <li>If signup fails, check Supabase dashboard for email confirmation settings</li>
           <li>Ensure your Supabase project URL and API key are correct</li>
           <li>Check browser console for any JavaScript errors</li>
           <li>Verify database schema is properly set up</li>
         </ul>
       </div>

       <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
         <h3 className="font-semibold mb-2">Next Steps:</h3>
         <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
           <li>Run the database schema in Supabase SQL Editor (use supabase-schema.sql)</li>
           <li>Create storage bucket 'finsight-files' in Supabase Storage</li>
           <li>Configure email settings in Authentication → Settings</li>
           <li>Test signup/login functionality</li>
         </ol>
       </div>
    </div>
  )
}
