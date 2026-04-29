import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTouristAuth } from '../auth/TouristAuthContext'

export function TouristLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useTouristAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate('/guest')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 flex items-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
          <p className="text-slate-400">Access your rescue account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <a href="/register" className="text-orange-500 hover:text-orange-400">
              Register here
            </a>
          </p>
        </div>

        <div className="mt-4">
          <a 
            href="/" 
            className="block text-center text-slate-400 hover:text-slate-300 text-sm"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
