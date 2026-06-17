import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import Logo from '../components/Logo'

export default function EsqueciSenha() {
  const [email,     setEmail]     = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviado,   setEnviado]   = useState(false)

  const aoEnviar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setEnviado(true)
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar e-mail. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const inputBase = 'w-full px-4 py-3.5 rounded-xl text-sm transition-all border border-primary-200 bg-white text-primary-900 dark:bg-dark-elevated dark:border-dark-borderStrong dark:text-slate-100 outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(61,123,204,0.12)] dark:focus:bg-dark-elevated'

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <Logo size={40} withText={true} className="justify-center mb-7" />

        {enviado ? (
          /* Estado pós-envio */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-50 dark:bg-dark-elevated">
              <Mail size={24} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-primary-900 dark:text-slate-100">
              Verifique seu e-mail
            </h1>
            <p className="text-sm leading-relaxed mb-6 text-primary-700 dark:text-slate-300">
              Se <strong>{email}</strong> estiver cadastrado, você receberá
              um link de recuperação em instantes.
              <br /><br />
              Verifique também a pasta de spam.
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
            <button
              onClick={() => setEnviado(false)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Tentar com outro e-mail
            </button>
          </motion.div>
        ) : (
          /* Formulário */
          <>
            <h1 className="text-xl font-semibold text-center mb-2 text-primary-900 dark:text-slate-100">
              Esqueceu sua senha?
            </h1>
            <p className="text-sm text-center mb-6 text-primary-400 dark:text-slate-500">
              Digite seu e-mail e enviaremos um link para criar uma nova senha.
            </p>

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
                  className={inputBase}
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3.5 mt-1 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-500 hover:bg-primary-600 text-white"
              >
                {carregando ? (
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                       style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                ) : 'Enviar link de recuperação'}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
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
