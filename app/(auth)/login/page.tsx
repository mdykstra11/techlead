'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen-safe flex flex-col items-center justify-center bg-brand-600 px-6 py-12">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-lg mb-4">
          <span className="text-4xl">🌿</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Field Service Pro</h1>
        <p className="text-brand-200 mt-1 text-sm">Capture opportunities in the field</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Spinner />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Contact your manager if you need access.
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
