import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import LogoVotta from '../components/layout/LogoVotta'

export default function RedefinirSenha() {
  const [searchParams]                       = useSearchParams()
  const navigate                             = useNavigate()
  const token                                = searchParams.get('token') || ''

  const [senha,              setSenha]              = useState('')
  const [confirmacao,        setConfirmacao]        = useState('')
  const [mostrarSenha,       setMostrarSenha]       = useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const [carregando,         setCarregando]         = useState(false)
  const [concluido,          setConcluido]          = useState(false)

  const inputBase = 'w-full px-4 py-3.5 rounded-xl text-sm transition-all border border-[#e8e8e8] bg-[#fafafa] text-[#111] dark:bg-[#232745] dark:border-[#3d4270] dark:text-slate-100 outline-none focus:border-[#b83b3d] focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,59,61,0.08)] dark:focus:bg-[#232745]'

  const aoEnviar = async (e) => {
    e.preventDefault()

    if (senha !== confirmacao) {
      toast.error('As senhas não coincidem')
      return
    }

    if (!token) {
      toast.error('Link inválido. Solicite um novo.')
      return
    }

    setCarregando(true)
    try {
      await api.post('/auth/reset-password', { token, password: senha })
      setConcluido(true)
    } catch (err) {
      toast.error(err.message || 'Link inválido ou expirado. Solicite um novo.')
    } finally {
      setCarregando(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#141624] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm mb-4 text-primary-400 dark:text-slate-500">
            Link de recuperação inválido ou expirado.
          </p>
          <Link to="/esqueci-senha" className="text-sm font-medium text-rosso-500 hover:text-rosso-600 transition-colors">
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#141624] flex flex-col items-center justify-center px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <LogoVotta className="justify-center mb-7" />

        {concluido ? (
          /* Sucesso */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#f0fdf4] dark:bg-[#232745]">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-primary-900 dark:text-slate-100">
              Senha redefinida!
            </h1>
            <p className="text-sm leading-relaxed mb-6 text-primary-700 dark:text-slate-300">
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
            <h1 className="text-xl font-semibold text-center mb-2 text-primary-900 dark:text-slate-100">
              Criar nova senha
            </h1>
            <p className="text-sm text-center mb-6 text-primary-400 dark:text-slate-500">
              Escolha uma senha com pelo menos 6 caracteres.
            </p>

            <form onSubmit={aoEnviar} className="space-y-3">
              {/* Nova senha */}
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Nova senha"
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

              {/* Confirmar senha */}
              <div className="relative">
                <input
                  type={mostrarConfirmacao ? 'text' : 'password'}
                  value={confirmacao}
                  onChange={e => setConfirmacao(e.target.value)}
                  placeholder="Confirmar nova senha"
                  minLength={6}
                  required
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacao(v => !v)}
                  aria-label={mostrarConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-300 dark:text-slate-500 leading-none"
                >
                  {mostrarConfirmacao ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#b83b3d', color: '#fff', marginTop: '4px' }}
              >
                {carregando ? (
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
