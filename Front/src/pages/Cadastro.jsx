import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import Logo from '../components/Logo'

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome,              setNome]              = useState('')
  const [email,             setEmail]             = useState('')
  const [senha,             setSenha]             = useState('')
  const [confirmacao,       setConfirmacao]       = useState('')
  const [mostrarSenha,      setMostrarSenha]      = useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const [carregando,        setCarregando]        = useState(false)

  const inputBase = 'w-full px-4 py-3.5 rounded-xl text-sm transition-all border border-primary-200 bg-white text-primary-900 dark:bg-[#232745] dark:border-[#3d4270] dark:text-slate-100 outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(61,123,204,0.12)] dark:focus:bg-[#232745]'

  const senhasNaoCoincidem = confirmacao.length > 0 && senha !== confirmacao

  const aoEnviar = async (e) => {
    e.preventDefault()
    if (senhasNaoCoincidem) {
      toast.error('As senhas não coincidem')
      return
    }
    setCarregando(true)
    try {
      await api.post('/auth/register', { name: nome, email, password: senha })
      toast.success('Conta criada! Faça login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Erro ao criar conta')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#141624] flex flex-col">

      {/* Barra superior */}
      <div className="flex items-center justify-between p-5">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors text-primary-400 dark:text-slate-500"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <Link
          to="/login"
          className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-xl border transition-colors border-primary-100 text-primary-700 dark:border-[#2d3158] dark:text-slate-300"
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
          <Logo size={40} withText={true} className="justify-center mb-7" />

          <h1 className="text-xl font-semibold text-center mb-6 text-primary-900 dark:text-slate-100">
            Criar conta
          </h1>

          <form onSubmit={aoEnviar} className="space-y-3">
            <div>
              <label htmlFor="nome" className="sr-only">Nome completo</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome completo"
                required
                className={inputBase}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className={inputBase}
              />
            </div>

            {/* Senha */}
            <div>
              <div className="relative">
                <label htmlFor="senha" className="sr-only">Senha</label>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Senha"
                  minLength={6}
                  required
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-300 dark:text-slate-500 leading-none"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs mt-1.5 text-primary-300 dark:text-slate-500">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar senha */}
            <div className="relative">
              <label htmlFor="confirmacao" className="sr-only">Confirmar senha</label>
              <input
                id="confirmacao"
                type={mostrarConfirmacao ? 'text' : 'password'}
                value={confirmacao}
                onChange={e => setConfirmacao(e.target.value)}
                placeholder="Confirmar senha"
                minLength={6}
                required
                className={`${inputBase} pr-12 ${senhasNaoCoincidem ? 'border-rosso-400 focus:border-rosso-400' : ''}`}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmacao(v => !v)}
                aria-label={mostrarConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-300 dark:text-slate-500 leading-none"
              >
                {mostrarConfirmacao ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {senhasNaoCoincidem && (
                <p className="text-xs text-rosso-500 mt-1">As senhas não coincidem.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 mt-1 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-500 hover:bg-primary-600 text-white"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                     style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-slate-600 dark:text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-slate-800 hover:text-slate-900 underline transition-colors">
              Entrar
            </Link>
          </p>

        </motion.div>
      </div>
    </div>
  )
}
