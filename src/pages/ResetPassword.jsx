import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Scale, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

export default function ResetPassword() {
  const [searchParams]                  = useSearchParams()
  const navigate                        = useNavigate()
  const token                           = searchParams.get('token') || ''

  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [done,         setDone]         = useState(false)

  const inputStyle = {
    border: '1.5px solid #e8e8e8',
    background: '#fafafa',
    color: '#111',
    outline: 'none',
    fontFamily: 'inherit',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }

    if (!token) {
      toast.error('Link inválido. Solicite um novo.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      toast.error(err.message || 'Link inválido ou expirado. Solicite um novo.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm mb-4" style={{ color: '#888' }}>
            Link de recuperação inválido ou expirado.
          </p>
          <Link to="/forgot-password" className="text-sm font-medium" style={{ color: '#b83b3d' }}>
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-16">
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
          <span className="text-lg font-semibold" style={{ color: '#111' }}>Votta</span>
        </div>

        {done ? (
          /* Sucesso */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: '#f0fdf4' }}>
              <CheckCircle size={24} style={{ color: '#16a34a' }} />
            </div>
            <h1 className="text-xl font-semibold mb-2" style={{ color: '#111' }}>
              Senha redefinida!
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#666' }}>
              Sua senha foi atualizada com sucesso.
              Agora você pode entrar com a nova senha.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95"
              style={{ background: '#b83b3d', color: '#fff' }}
            >
              Ir para o login
            </button>
          </motion.div>
        ) : (
          /* Formulário */
          <>
            <h1 className="text-xl font-semibold text-center mb-2" style={{ color: '#111' }}>
              Criar nova senha
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: '#888' }}>
              Escolha uma senha com pelo menos 6 caracteres.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Nova senha */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  minLength={6}
                  required
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm transition-all"
                  style={inputStyle}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#aaa', lineHeight: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirmar senha */}
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirmar nova senha"
                  minLength={6}
                  required
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm transition-all"
                  style={inputStyle}
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
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#aaa', lineHeight: 0 }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#b83b3d', color: '#fff', marginTop: '4px' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                       style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
