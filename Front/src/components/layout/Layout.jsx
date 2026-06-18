import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Sparkles, Shield, Settings, LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../Logo'

function obterIniciais(name) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = [
  '#3D7BCC', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#ea580c',
]

function nomeParaCor(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const NAV_ITEMS = [
  { path: '/painel',    icon: Home,   label: 'Início' },
  { path: '/auditoria', icon: Shield, label: 'Auditoria' },
]

const Layout = ({ municipioSelecionado, aoSelecionarMunicipio, aoSair, usuario }) => {
  const location = useLocation()
  const [showUserMenu,      setShowUserMenu]      = useState(false)
  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (!showUserMenu) return
    const close = () => setShowUserMenu(false)
    const t = setTimeout(() => document.addEventListener('click', close, { once: true }), 0)
    return () => { clearTimeout(t); document.removeEventListener('click', close) }
  }, [showUserMenu])

  useEffect(() => {
    setShowUserMenu(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const corAvatar = nomeParaCor(usuario?.name)
  const ehAtivo = (path) => location.pathname === path

  const aoSolicitarLogout = () => {
    setShowUserMenu(false)
    setMobileMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 print:block print:bg-white">

      {/* ── Topbar desktop ── */}
      <header className="hidden lg:flex items-center gap-6 px-6 h-16 bg-white border-b border-primary-100 flex-shrink-0 print:hidden">
        <div className="flex-1 flex items-center min-w-0">
          <Link to="/painel" aria-label="Ir para o Início">
            <Logo size={24} />
          </Link>
        </div>

        <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = ehAtivo(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          {usuario && (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowUserMenu(p => !p) }}
                className="flex items-center gap-2 hover:bg-primary-50 rounded-2xl px-2 py-1.5 transition-all"
                aria-label="Menu do usuário"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: corAvatar }}
                >
                  {obterIniciais(usuario.name)}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-primary-500 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-primary-100 py-1 overflow-hidden z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-primary-100 ">
                      <p className="text-sm font-semibold text-primary-800 leading-tight truncate">{usuario.name}</p>
                      <p className="text-xs text-primary-400 mt-0.5 truncate">{usuario.email}</p>
                    </div>
                    <Link
                      to="/configuracoes"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      <Settings size={15} />
                      Configurações
                    </Link>
                    <div className="border-t border-primary-100 my-1" />
                    <button
                      onClick={aoSolicitarLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rosso-600 hover:bg-rosso-50 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* ── Topbar mobile ── */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-primary-100 flex-shrink-0 print:hidden">
        <Link to="/painel" aria-label="Ir para o Painel">
          <Logo size={28} />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          className="btn-ghost p-2 text-primary-500 hover:text-primary-700"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* ── Menu mobile ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 top-14 z-30 bg-black/30 print:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-primary-100 shadow-lg print:hidden"
            >
              {usuario && (
                <div className="px-5 py-3 border-b border-primary-100 ">
                  <p className="text-sm font-semibold text-primary-800 leading-tight truncate">{usuario.name}</p>
                  <p className="text-xs text-primary-400 mt-0.5 truncate">{usuario.email}</p>
                </div>
              )}
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon
                  const isActive = ehAtivo(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors
                        ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
                <Link
                  to="/configuracoes"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors
                    ${ehAtivo('/configuracoes') ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings size={16} className="flex-shrink-0" />
                  Configurações
                </Link>
              </nav>
              <div className="p-3 pt-0 space-y-2">
                <Link to="/criar-minuta" className="btn-primary w-full">
                  <Sparkles size={15} className="text-oro-400" />
                  Criar minuta com IA
                </Link>
                <button
                  onClick={aoSolicitarLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-rosso-600 hover:bg-rosso-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Conteúdo ── */}
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        <Outlet context={{ municipioSelecionado, usuario, aoSelecionarMunicipio }} />
      </main>

      {/* Modal de confirmação de logout */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="modal-base max-w-sm"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={22} className="text-primary-600" />
              </div>
              <h2 className="text-lg font-display font-bold text-primary-800 text-center mb-2">
                Sair do sistema?
              </h2>
              <p className="text-sm text-primary-500 text-center mb-6 leading-relaxed">
                Você será redirecionado para a tela de login.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-secondary flex-1 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); aoSair() }}
                  className="btn-danger flex-1 rounded-2xl"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout
