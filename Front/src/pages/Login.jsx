import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../services/api.js'
import LogoVotta from '../components/LogoVotta'

export default function Login({ aoEntrar }) {
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando,   setCarregando]   = useState(false)
  const [erro,         setErro]         = useState('')

  const aoEnviar = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await api.post('/auth/login', { email, password: senha })
      aoEntrar()
    } catch (err) {
      const msg = err.message || 'E-mail ou senha incorretos'
      setErro(msg)
      toast.error(msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#141624] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <LogoVotta className="justify-center mb-7" />

          <h1 className="text-xl font-semibold text-center text-primary-900 dark:text-slate-100 mb-6">Entrar</h1>

          <form onSubmit={aoEnviar} className="space-y-3">
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
              <label htmlFor="senha" className="sr-only">Senha</label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Senha"
                  minLength={6}
                  required
                  className="input-field py-3.5 pr-32 text-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="text-primary-400 hover:text-primary-600 dark:text-slate-500 transition-colors"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link
                    to="/esqueci-senha"
                    className="text-xs font-semibold uppercase tracking-wider text-rosso-500 hover:text-rosso-600 transition-colors"
                  >
                    Esqueceu?
                  </Link>
                </div>
              </div>
            </div>

            {erro && (
              <p role="alert" className="text-sm text-rosso-500 text-center">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 mt-1 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-rosso-500 hover:bg-rosso-600 text-white"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-primary-400 dark:text-slate-500">
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-rosso-500 hover:text-rosso-600 transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
