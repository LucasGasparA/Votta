import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import Logo from '../components/Logo'

export default function Login({ aoEntrar }) {
  const navigate = useNavigate()
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando,   setCarregando]   = useState(false)
  const [erro,         setErro]         = useState('')
  const [camposComErro, setCamposComErro] = useState([])

  const aoEnviar = async (e) => {
    e.preventDefault()
    setErro('')
    setCamposComErro([])
    setCarregando(true)
    try {
      await api.post('/auth/login', { email, password: senha })
      aoEntrar()
      navigate('/painel')
    } catch (err) {
      const msg = err.message || 'E-mail ou senha incorretos'
      setErro(msg)
      setCamposComErro(['email', 'senha'])
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
          <Logo size={40} withText={true} className="justify-center mb-7" />

          <h1 className="text-xl font-semibold text-center text-primary-900 dark:text-slate-100 mb-6">Entrar</h1>

          <form onSubmit={aoEnviar} className="space-y-3">
            <div>
              <label htmlFor="email" className="sr-only">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setCamposComErro(p => p.filter(c => c !== 'email')) }}
                placeholder="E-mail"
                required
                className={`input-field py-3.5 text-sm ${camposComErro.includes('email') ? 'border-rosso-400 focus:border-rosso-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]' : ''}`}
              />
            </div>

            <div>
              <label htmlFor="senha" className="sr-only">Senha</label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setCamposComErro(p => p.filter(c => c !== 'senha')) }}
                  placeholder="Senha"
                  minLength={6}
                  required
                  className={`input-field py-3.5 pr-12 text-sm ${camposComErro.includes('senha') ? 'border-rosso-400 focus:border-rosso-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-500 transition-colors"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/esqueci-senha"
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
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
              className="w-full py-3.5 mt-1 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-500 hover:bg-primary-600 text-white"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-slate-600 dark:text-slate-400">
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-slate-800 hover:text-slate-900 underline transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
