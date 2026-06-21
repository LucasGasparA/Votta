import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles, Zap, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-white">

      {/* ───────── Lado esquerdo — formulário ───────── */}
      <div className="flex flex-col min-h-screen lg:min-h-0 px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-sm mx-auto"
          >
            <img
              src={VottaLogo}
              alt="Votta"
              style={{ height: 52, width: 'auto' }}
              draggable={false}
              className="mb-10"
            />

            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-slate-500 mt-2 mb-8">
              Entre para criar, revisar e exportar minutas legislativas com apoio da IA.
            </p>

            <form onSubmit={aoEnviar} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setCamposComErro(p => p.filter(c => c !== 'email')) }}
                  placeholder="E-mail"
                  required
                  className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${camposComErro.includes('email') ? 'border-rosso-400 focus:border-rosso-400 focus:ring-rosso-100' : 'border-slate-200'}`}
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-xs font-medium text-slate-600 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => { setSenha(e.target.value); setCamposComErro(p => p.filter(c => c !== 'senha')) }}
                    placeholder="Senha"
                    minLength={6}
                    required
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${camposComErro.includes('senha') ? 'border-rosso-400 focus:border-rosso-400 focus:ring-rosso-100' : 'border-slate-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link
                    to="/esqueci-senha"
                    className="text-xs text-slate-500 hover:text-primary-600 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>

              {erro && (
                <p role="alert" className="text-sm text-rosso-500">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-slate-600">
              Não tem conta?{' '}
              <Link to="/cadastro" className="font-medium text-primary-600 hover:underline transition-colors">
                Solicitar acesso
              </Link>
            </p>
          </motion.div>
        </div>

        <footer className="text-center lg:text-left text-xs text-slate-400 pt-8 max-w-sm mx-auto w-full">
          © 2026 Votta · Privacidade · Termos de uso
        </footer>
      </div>

      {/* ───────── Lado direito — institucional ───────── */}
      <div className="relative hidden lg:flex lg:h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-12 xl:px-16 py-12">
        {/* Padrão geométrico de pontos */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
        {/* Glows suaves */}
        <div aria-hidden="true" className="absolute -top-28 -right-28 w-[28rem] h-[28rem] rounded-full bg-primary-400/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />

        {/* Bloco 1 — Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="relative max-w-md"
        >
          <h2 className="font-display text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-white">
            Acelere a elaboração legislativa sem abrir mão da segurança jurídica.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Criada para gabinetes, câmaras municipais e assessorias legislativas.
          </p>
        </motion.div>

        {/* Bloco 2 — Cards do produto em ação */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.25 }}
          className="relative my-6"
        >
          <div className="relative mx-auto w-full max-w-[20rem]">

            {/* Card 1 — Minuta em geração */}
            <div className="relative z-10 -rotate-1 rounded-2xl bg-white p-5 shadow-2xl shadow-primary-950/40">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-600">
                <motion.span
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Sparkles size={13} />
                </motion.span>
                Gerando minuta...
              </div>
              <p className="mt-3 font-display text-sm font-bold tracking-tight text-slate-900">
                PROJETO DE LEI Nº 014/2026
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Dispõe sobre a regulamentação do uso de bicicletas elétricas no município...
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Art. 1º — Fica instituído o programa...
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    initial={{ width: '18%' }}
                    animate={{ width: ['18%', '70%'] }}
                    transition={{ duration: 2.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400">70%</span>
              </div>
            </div>

            {/* Card 3 — Badge de revisão */}
            <div className="absolute -top-5 -left-7 z-20 -rotate-3 rounded-xl bg-white px-3.5 py-2.5 shadow-lg shadow-primary-950/30">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900">
                <CheckCircle2 size={13} className="text-primary-500" />
                Revisão humana
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">Pronta para exportação</p>
            </div>

            {/* Card 2 — Métricas institucionais */}
            <div className="absolute -bottom-8 -right-8 z-20 w-56 rotate-2 rounded-xl bg-white p-3.5 shadow-xl shadow-primary-950/30">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900">
                <Zap size={13} className="text-oro-500" />
                IA Legislativa
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Minuta gerada em <span className="font-semibold text-slate-700">47 segundos</span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 size={12} className="flex-shrink-0 text-primary-500" />
                Conformidade: Lei Orgânica Municipal
              </p>
            </div>

          </div>

          {/* Bloco 3 — Números com impacto */}
          <div className="mt-16 flex">
            <div>
              <p className="font-display text-4xl xl:text-5xl font-bold leading-none text-white">4h</p>
              <p className="mt-2 text-xs leading-snug text-white/60">economizadas<br />por proposição</p>
            </div>
            <div className="ml-10 border-l border-white/15 pl-10 xl:ml-12 xl:pl-12">
              <p className="font-display text-4xl xl:text-5xl font-bold leading-none text-white">127</p>
              <p className="mt-2 text-xs leading-snug text-white/60">minutas geradas<br />por assessorias</p>
            </div>
          </div>
        </motion.div>

        {/* Bloco 4 — Rodapé do painel */}
        <p className="relative text-xs text-white/40">
          Votta · Assistente Legislativo Municipal
        </p>
      </div>
    </div>
  )
}
