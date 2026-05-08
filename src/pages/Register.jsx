import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

export default function Register() {
  const navigate = useNavigate()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const inputStyle = {
    border: '1.5px solid #e8e8e8',
    background: '#fafafa',
    color: '#111',
    outline: 'none',
    fontFamily: 'inherit',
  }
  const focusStyle = {
    borderColor: '#b83b3d',
    background: '#fff',
    boxShadow: '0 0 0 3px rgba(184,59,61,0.08)',
  }
  const blurStyle = {
    borderColor: '#e8e8e8',
    background: '#fafafa',
    boxShadow: 'none',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password })
      toast.success('Conta criada! Faça login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Barra superior */}
      <div className="flex items-center justify-between p-5">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#888' }}
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <Link
          to="/login"
          className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-xl border transition-colors"
          style={{ borderColor: '#e0e0e0', color: '#555' }}
        >
          Entrar
        </Link>
      </div>

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
            Criar conta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome completo"
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm transition-all"
              style={inputStyle}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e  => Object.assign(e.target.style, blurStyle)}
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm transition-all"
              style={inputStyle}
              onFocus={e => Object.assign(e.target.style, focusStyle)}
              onBlur={e  => Object.assign(e.target.style, blurStyle)}
            />
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                minLength={6}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm transition-all"
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e  => Object.assign(e.target.style, blurStyle)}
              />
              <p className="text-xs mt-1.5" style={{ color: '#bbb' }}>Mínimo 6 caracteres</p>
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
              ) : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#888' }}>
            Já tem conta?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#b83b3d' }}>
              Entrar
            </Link>
          </p>

          <p className="text-center text-xs mt-7 leading-relaxed" style={{ color: '#bbb' }}>
            Ao criar sua conta, você concorda com nossos{' '}
            <a href="#" className="underline" style={{ color: '#999' }}>Termos</a>
            {' '}e{' '}
            <a href="#" className="underline" style={{ color: '#999' }}>Política de Privacidade</a>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}