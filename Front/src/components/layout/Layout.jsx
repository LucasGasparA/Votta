import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Sparkles, Settings, LogOut, MapPin, Menu, X, Shield, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
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

const PAGE_TITLES = {
  '/painel':                'Painel',
  '/criar-minuta':          'Nova minuta com IA',
  '/selecionar-municipio':  'Selecionar Município',
  '/configuracoes':         'Configurações',
  '/auditoria':             'Trilha de Auditoria',
}

const Layout = ({ municipioSelecionado, aoSair, usuario }) => {
  const location = useLocation()
  const [sidebarOpen,       setSidebarOpen]       = useState(false)
  const [collapsed,         setCollapsed]         = useState(false)
  const [showUserMenu,      setShowUserMenu]      = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (!showUserMenu) return
    const close = () => setShowUserMenu(false)
    const t = setTimeout(() => document.addEventListener('click', close, { once: true }), 0)
    return () => { clearTimeout(t); document.removeEventListener('click', close) }
  }, [showUserMenu])

  useEffect(() => {
    setShowUserMenu(false)
  }, [location.pathname])

  const pageTitle = location.pathname.startsWith('/minuta/')
    ? 'Editor de Proposição'
    : PAGE_TITLES[location.pathname] ?? ''

  const navGroups = [
    {
      label: 'Trabalho',
      items: [
        { path: '/painel',       icon: Home,       label: 'Painel' },
        { path: '/criar-minuta', icon: Sparkles, label: 'Nova minuta com IA', highlight: true },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { path: '/selecionar-municipio', icon: MapPin,  label: 'Município' },
        { path: '/auditoria',            icon: Shield,  label: 'Auditoria' },
      ],
    },
  ]

  const corAvatar = nomeParaCor(usuario?.name)

  const aoSolicitarLogout = () => {
    setShowUserMenu(false)
    setSidebarOpen(false)
    setShowLogoutConfirm(true)
  }

  const SidebarContent = ({ mobile = false }) => {
    const isCollapsed = collapsed && !mobile

    return (
      <>
        {/* ── Cabeçalho: logo + botão recolher ── */}
        <div className="border-b border-primary-100 dark:border-[#2d3158] flex items-center flex-shrink-0 p-4 gap-3">
          {isCollapsed && !mobile ? (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menu"
              title="Expandir menu"
              className="mx-auto"
            >
              <Logo size={28} />
            </button>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <Logo size={36} withText={true} />
                <p className="mt-1 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Minutas legislativas com IA
                </p>
              </div>

              {mobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fechar menu"
                  className="btn-ghost p-1.5 text-primary-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-slate-300 flex-shrink-0"
                >
                  <X size={18} />
                </button>
              )}

              {!mobile && (
                <button
                  onClick={() => setCollapsed(c => !c)}
                  aria-label="Recolher menu"
                  title="Recolher menu"
                  className="btn-ghost p-1.5 text-primary-400 hover:text-primary-600 flex-shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Município ativo ── */}
        {!isCollapsed && municipioSelecionado && (
          <div className="px-5 pt-4">
            <Link
              to="/selecionar-municipio"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-600 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {municipioSelecionado.nome}, {municipioSelecionado.uf}
            </Link>
          </div>
        )}

        {/* ── Navegação ── */}
        <nav className="flex-1 overflow-y-auto min-h-0 px-3 pt-4 space-y-1">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && (
                <div className={`${isCollapsed ? 'my-2' : 'my-3'} border-t border-primary-100 dark:border-[#2d3158]`} />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path

                  if (item.highlight) {
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        title={isCollapsed ? item.label : undefined}
                        className={`
                          relative flex items-center transition-all duration-150 text-sm rounded-lg
                          ${isCollapsed
                            ? `justify-center p-3 ${isActive ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-700'}`
                            : `gap-3 pl-3 pr-3 py-2 font-medium ${isActive ? 'bg-primary-600 text-white hover:bg-primary-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#232745]'}`
                          }
                        `}
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    )
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        flex items-center transition-all duration-150 text-sm rounded-lg
                        ${isCollapsed
                          ? `justify-center p-3 ${isActive ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-700'}`
                          : `gap-3 px-3 py-2 font-medium ${isActive ? 'bg-primary-600 text-white hover:bg-primary-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#232745]'}`
                        }
                      `}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>


      </>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-[#141624] print:block print:bg-white">

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex bg-white dark:bg-[#191c33] border-r border-primary-100 dark:border-[#2d3158] flex-col shadow-sm flex-shrink-0 print:hidden transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: overlay + drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/30"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-[#191c33] border-r border-primary-100 dark:border-[#2d3158] flex flex-col shadow-xl print:hidden"
            >
              <SidebarContent mobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#191c33] border-b border-primary-100 dark:border-[#2d3158] shadow-sm flex-shrink-0 print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="btn-ghost p-2 text-primary-500 dark:text-slate-400 hover:text-primary-700"
          >
            <Menu size={22} />
          </button>
          <Logo size={28} />
          {usuario && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu do usuário"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: corAvatar }}
              title={usuario.name}
            >
              {obterIniciais(usuario.name)}
            </button>
          )}
        </div>

        {/* Desktop top bar */}
        {usuario && (
          <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-white dark:bg-[#191c33] border-b border-primary-100 dark:border-[#2d3158] flex-shrink-0 print:hidden">
            <p className="text-sm font-semibold text-primary-700 dark:text-slate-300">{pageTitle}</p>

            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowUserMenu(p => !p) }}
                className="flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-[#232745] rounded-xl px-2 py-1.5 transition-all"
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
                    className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-[#1c1f38] rounded-xl shadow-lg border border-primary-100 dark:border-[#2d3158] py-1 overflow-hidden z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-primary-100 dark:border-[#2d3158]">
                      <p className="text-sm font-semibold text-primary-800 dark:text-slate-100 leading-tight truncate">{usuario.name}</p>
                      <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5 truncate">{usuario.email}</p>
                    </div>
                    <Link
                      to="/configuracoes"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] transition-colors"
                    >
                      <Settings size={15} />
                      Configurações
                    </Link>
                    <div className="border-t border-primary-100 dark:border-[#2d3158] my-1" />
                    <button
                      onClick={aoSolicitarLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rosso-600 hover:bg-rosso-50 dark:hover:bg-rosso-900/20 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          <Outlet context={{ municipioSelecionado, usuario }} />
        </main>
      </div>

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
              <div className="w-12 h-12 bg-primary-50 dark:bg-[#232745] rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={22} className="text-primary-600" />
              </div>
              <h2 className="text-lg font-display font-bold text-primary-800 dark:text-slate-100 text-center mb-2">
                Sair do sistema?
              </h2>
              <p className="text-sm text-primary-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                Você será redirecionado para a tela de login.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-secondary flex-1 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); aoSair() }}
                  className="btn-danger flex-1 rounded-xl"
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
