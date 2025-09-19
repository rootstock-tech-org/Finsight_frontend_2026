'use client'

import { useState } from 'react'
import { useSupabase } from './providers/SupabaseProvider'

export default function EmailTest() {
  const { resetPassword } = useSupabase()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const testEmail = async () => {
    if (!email) {
      setError('Please enter an email address')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(`Email test failed: ${error.message}`)
      } else {
        setMessage('Password reset email sent successfully! Check your inbox.')
      }
    } catch (err) {
      setError(`Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Test Email Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={testEmail}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Test Password Reset Email'}
        </button>

        {message && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <p className="font-medium mb-2">Troubleshooting:</p>
        <ul className="list-disc list-inside space-y-1 text-yellow-800">
          <li>Check Supabase dashboard &gt; Authentication &gt; Settings</li>
          <li>Verify SMTP configuration</li>
          <li>Check email templates</li>
          <li>Ensure site URL is correct</li>
        </ul>
      </div>
    </div>
  )
}
