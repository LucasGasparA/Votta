import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import VottaLogo from '../assets/Votta-logo.svg'

export default function Login({ aoEntrar }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [camposComErro, setCamposComErro] = useState([])

  const aoEnviar = async (e) => {
    e.preventDefault()
    setErro('')
    setCamposComErro([])
    setCarregando(true)
    try {
      await api.post('/auth/login', { email, password: senha })
      await aoEntrar()
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
    <>
      <div className="h-screen overflow-hidden bg-[#F8F9FA] dark:bg-dark-bg flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-xs"
        >
          <div className="flex justify-center mb-6">
            <img
              src={VottaLogo}
              alt="Votta"
              style={{ height: 62, width: 'auto' }}
              draggable={false}
            />
          </div>

          <p className="text-sm text-center text-slate-400 dark:text-slate-500 mb-7">
            Acesse sua conta para criar proposições
          </p>

          <div className="bg-white dark:bg-[#1e2235] rounded-2xl border border-slate-200 dark:border-[#2d3150] px-6 py-7 shadow-md">
            <form onSubmit={aoEnviar} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setCamposComErro(p => p.filter(c => c !== 'email')) }}
                  placeholder="seu@email.com"
                  required
                  className={`input-field py-3.5 text-sm bg-[#F8F9FA] dark:bg-dark-bg ${camposComErro.includes('email') ? 'border-rosso-400 focus:border-rosso-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]' : ''}`}
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => { setSenha(e.target.value); setCamposComErro(p => p.filter(c => c !== 'senha')) }}
                    placeholder="Senha"
                    minLength={6}
                    required
                    className={`input-field py-3.5 pr-12 text-sm bg-[#F8F9FA] dark:bg-dark-bg ${camposComErro.includes('senha') ? 'border-rosso-400 focus:border-rosso-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]' : ''}`}
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
                className="w-full py-3.5 mt-1 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 hover:bg-primary-700 text-white"
              >
                {carregando ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm mt-5 text-slate-600 dark:text-slate-400">
              Não tem conta?{' '}
              <Link to="/cadastro" className="font-medium text-primary-500 hover:underline transition-colors">
                Solicitar acesso
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 text-center py-4 text-xs text-slate-400 dark:text-slate-600">
        © 2026 Votta · Privacidade · Termos de uso
      </footer>
    </>
  )
}
