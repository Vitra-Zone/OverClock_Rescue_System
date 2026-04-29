import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTouristAuth } from '../auth/TouristAuthContext'
import type { RegisterTouristRequest } from '@overclock/shared/types'

const INDIA_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

export function TouristRegisterPage() {
  const [formData, setFormData] = useState<RegisterTouristRequest & { password: string }>({
    touristFirstName: '',
    touristLastName: '',
    email: '',
    phoneNumber: '',
    aadhaarNumber: '',
    homeState: '',
    homeDistrict: '',
    pinCode: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { register } = useTouristAuth()
  const navigate = useNavigate()

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await register(formData)
      navigate('/guest')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Register for emergency assistance</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={formData.touristFirstName}
                onChange={(e) => setFormData({ ...formData, touristFirstName: e.target.value })}
                placeholder="First"
                disabled={loading}
                required
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.touristLastName}
                onChange={(e) => setFormData({ ...formData, touristLastName: e.target.value })}
                placeholder="Last"
                disabled={loading}
                required
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="10 digit number"
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Aadhaar Number</label>
            <input
              type="text"
              value={formData.aadhaarNumber}
              onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
              placeholder="12 digit"
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
            <select
              value={formData.homeState}
              onChange={(e) => setFormData({ ...formData, homeState: e.target.value })}
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm disabled:opacity-50"
            >
              <option value="">Select State</option>
              {INDIA_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">District</label>
            <input
              type="text"
              value={formData.homeDistrict}
              onChange={(e) => setFormData({ ...formData, homeDistrict: e.target.value })}
              placeholder="District"
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">PIN Code</label>
            <input
              type="text"
              value={formData.pinCode}
              onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
              placeholder="6 digits"
              disabled={loading}
              required
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-orange-500 hover:text-orange-400">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
