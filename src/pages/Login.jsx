import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

export default function Login({ onLogin }) {
  const [email,        setEmail]       = useState('')
  const [password,     setPassword]    = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/login', { email, password })
      onLogin()
    } catch (err) {
      const msg = err.message || 'E-mail ou senha incorretos'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-lg bg-rosso-600 flex items-center justify-center">
              <Scale size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-primary-900">Votta</span>
          </div>

          <h1 className="text-xl font-semibold text-center text-primary-900 mb-6">Entrar</h1>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="sr-only">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="input-field py-3.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Senha"
                  minLength={6}
                  required
                  className="input-field py-3.5 pr-32 text-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="text-primary-400 hover:text-primary-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold uppercase tracking-wider text-rosso-500 hover:text-rosso-600 transition-colors"
                  >
                    Esqueceu?
                  </Link>
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-rosso-500 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-1 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-rosso-500 hover:bg-rosso-600 text-white"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-primary-400">
            Não tem conta?{' '}
            <Link to="/register" className="font-medium text-rosso-500 hover:text-rosso-600 transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
