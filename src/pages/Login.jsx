import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      await login(credentialResponse.credential)
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardCheck size={32} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Quality Audit</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in with your company account</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4">
          {loading ? (
            <div className="text-gray-400 text-sm">Signing in...</div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              useOneTap
              theme="filled_black"
              size="large"
              width="280"
            />
          )}
          <p className="text-xs text-gray-600 text-center">
            Use your @creativepan.com.eg, @vasko.coffee, or @dukesegypt.com account
          </p>
        </div>
      </div>
    </div>
  )
}
