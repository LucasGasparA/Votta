import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

export default function Login({ onLogin }) {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,     setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/login', { email, password })
      onLogin()
    } catch (err) {
      toast.error(err.message || 'E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Conteúdo central */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: '#b83b3d' }}>
              <Scale size={16} color="#fff" />
            </div>
            <span className="text-lg font-semibold" style={{ color: '#111' }}>LegislaApp</span>
          </div>

          <h1 className="text-xl font-semibold text-center mb-6" style={{ color: '#111' }}>
            Entrar
          </h1>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* E-mail */}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm transition-all"
              style={{
                border: '1.5px solid #e8e8e8',
                background: '#fafafa',
                color: '#111',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#b83b3d'
                e.target.style.background  = '#fff'
                e.target.style.boxShadow   = '0 0 0 3px rgba(184,59,61,0.08)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e8e8e8'
                e.target.style.background  = '#fafafa'
                e.target.style.boxShadow   = 'none'
              }}
            />

            {/* Senha + olho + Esqueceu */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                minLength={6}
                required
                className="w-full px-4 py-3.5 pr-32 rounded-xl text-sm transition-all"
                style={{
                  border: '1.5px solid #e8e8e8',
                  background: '#fafafa',
                  color: '#111',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#b83b3d'
                  e.target.style.background  = '#fff'
                  e.target.style.boxShadow   = '0 0 0 3px rgba(184,59,61,0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e8e8e8'
                  e.target.style.background  = '#fafafa'
                  e.target.style.boxShadow   = 'none'
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ color: '#aaa', lineHeight: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#b83b3d' }}
                >
                  Esqueceu?
                </Link>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#b83b3d', color: '#fff', marginTop: '4px' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                     style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : 'Entrar'}
            </button>
          </form>

          {/* Link criar conta */}
          <p className="text-center text-sm mt-5" style={{ color: '#888' }}>
            Não tem conta?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#b83b3d' }}>
              Criar conta grátis
            </Link>
          </p>

        </motion.div>
      </div>
    </div>
  )
}
