import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, ArrowLeft, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    border: '1.5px solid #e8e8e8',
    background: '#fafafa',
    color: '#111',
    outline: 'none',
    fontFamily: 'inherit',
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
          <span className="text-lg font-semibold" style={{ color: '#111' }}>LegislaApp</span>
        </div>

        {sent ? (
          /* Estado pós-envio */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: '#fef2f2' }}>
              <Mail size={24} style={{ color: '#b83b3d' }} />
            </div>
            <h1 className="text-xl font-semibold mb-2" style={{ color: '#111' }}>
              Verifique seu e-mail
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#666' }}>
              Se <strong>{email}</strong> estiver cadastrado, você receberá
              um link de recuperação em instantes.
              <br /><br />
              Verifique também a pasta de spam.
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium"
              style={{ color: '#b83b3d' }}
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </motion.div>
        ) : (
          /* Formulário */
          <>
            <h1 className="text-xl font-semibold text-center mb-2" style={{ color: '#111' }}>
              Esqueceu sua senha?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: '#888' }}>
              Digite seu e-mail e enviaremos um link para criar uma nova senha.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm transition-all"
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
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#b83b3d', color: '#fff', marginTop: '4px' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                       style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : 'Enviar link de recuperação'}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium"
                style={{ color: '#b83b3d' }}
              >
                <ArrowLeft size={14} />
                Voltar ao login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
