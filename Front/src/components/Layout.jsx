import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Settings, LogOut, MapPin, Menu, X, Zap, Shield, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import LogoVotta from './LogoVotta'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#ea580c',
]

function nameToColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const PAGE_TITLES = {
  '/painel':                'Painel',
  '/criar-minuta':          'Nova Proposição',
  '/selecionar-municipio':  'Selecionar Município',
  '/configuracoes':         'Configurações',
  '/planos':                'Planos',
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

  const navItems = [
    { path: '/painel',               icon: Home,       label: 'Painel' },
    { path: '/criar-minuta',         icon: PlusCircle, label: 'Nova Proposição' },
    { path: '/selecionar-municipio', icon: MapPin,      label: 'Município' },
    { path: '/auditoria',            icon: Shield,      label: 'Auditoria' },
    { path: '/planos',               icon: Zap,         label: 'Planos' },
  ]

  const corAvatar = nameToColor(usuario?.name)

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
        <div
          className={`border-b border-primary-100 dark:border-[#2d3158] flex items-center flex-shrink-0 ${
            isCollapsed ? 'p-3 justify-center' : 'p-4 gap-3'
          }`}
        >
          <LogoVotta alturaIcone={28} semTexto={isCollapsed} classeTexto="text-base font-bold" className={isCollapsed ? '' : 'flex-1 min-w-0'} />

          {!isCollapsed && (
            <>

              {mobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fechar menu"
                  className="p-1.5 rounded-lg text-primary-400 dark:text-slate-500 hover:bg-primary-50 dark:hover:bg-[#232745] hover:text-primary-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={18} />
                </button>
              )}

              {!mobile && (
                <button
                  onClick={() => setCollapsed(c => !c)}
                  aria-label="Recolher menu"
                  title="Recolher menu"
                  className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </>
          )}

          {isCollapsed && !mobile && (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menu"
              title="Expandir menu"
              className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* ── Município ativo ── */}
        {isCollapsed ? (
          <div className="px-2 pt-3">
            <Link
              to="/selecionar-municipio"
              onClick={() => setSidebarOpen(false)}
              title={municipioSelecionado
                ? `${municipioSelecionado.nome} — ${municipioSelecionado.uf}`
                : 'Selecionar município'}
              className="p-2 bg-primary-50 rounded-xl border border-primary-200 flex justify-center hover:bg-primary-100 transition-colors"
            >
              <MapPin size={15} className={municipioSelecionado ? 'text-primary-600' : 'text-primary-400'} />
            </Link>
          </div>
        ) : (
          <div className="px-4 pt-3">
            <Link
              to="/selecionar-municipio"
              onClick={() => setSidebarOpen(false)}
              className="block p-3 bg-primary-50 dark:bg-[#232745] rounded-xl border border-primary-200 dark:border-[#3d4270] hover:bg-primary-100 dark:hover:bg-[#2d3158] transition-colors"
            >
              <p className="text-[11px] text-primary-500 dark:text-slate-500 font-medium mb-0.5">Município ativo</p>
              {municipioSelecionado ? (
                <>
                  <p className="text-sm font-semibold text-primary-800 dark:text-slate-100 leading-tight">
                    <span className="text-emerald-500 mr-1">●</span>
                    {municipioSelecionado.nome}
                  </p>
                  <p className="text-xs text-primary-400 dark:text-slate-500">{municipioSelecionado.uf}</p>
                </>
              ) : (
                <p className="text-sm text-primary-400 dark:text-slate-500 italic">Nenhum município selecionado</p>
              )}
            </Link>
          </div>
        )}

        {/* ── Navegação ── */}
        <nav className="flex-1 overflow-y-auto min-h-0 p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  relative flex items-center rounded-xl transition-all duration-200 text-sm font-medium
                  ${isCollapsed
                    ? `justify-center p-3 ${isActive
                        ? 'bg-primary-50 dark:bg-[#232745] text-primary-700 dark:text-slate-200'
                        : 'text-primary-500 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-[#232745] hover:text-primary-700 dark:hover:text-slate-200'
                      }`
                    : `gap-3 px-3 py-2.5 ${isActive
                        ? 'bg-primary-50 dark:bg-[#232745] text-primary-700 dark:text-slate-200'
                        : 'text-primary-500 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-[#232745] hover:text-primary-700 dark:hover:text-slate-200'
                      }`
                  }
                `}
              >
                <Icon size={17} className={isActive ? 'text-primary-600' : ''} />
                {!isCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.path === '/planos' && (
                      <span className="ml-auto text-[10px] font-bold bg-oro-100 text-oro-700 px-1.5 py-0.5 rounded-full">
                        PRO
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.path === '/planos' && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-oro-400 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Rodapé: avatar ── */}
        <div className={`border-t border-primary-100 dark:border-[#2d3158] relative flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-3'}`}>

          {/* Dropdown — apenas no mobile */}
          {mobile && (
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-[#1c1f38] rounded-xl shadow-lg border border-primary-100 dark:border-[#2d3158] py-1 z-50"
                >
                  <Link
                    to="/configuracoes"
                    onClick={() => { setShowUserMenu(false); setSidebarOpen(false) }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] cursor-pointer transition-colors w-full text-left"
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
          )}

          {mobile ? (
            <button
              onClick={e => { e.stopPropagation(); setShowUserMenu(p => !p) }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all hover:bg-primary-100 dark:hover:bg-[#232745] hover:ring-1 hover:ring-primary-200 dark:hover:ring-[#3d4270]"
              aria-label="Menu do usuário"
              title="Configurações e sair"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{ background: corAvatar }}
              >
                {getInitials(usuario?.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-primary-800 dark:text-slate-100 truncate leading-tight">{usuario?.name || '—'}</p>
                <p className="text-[10px] text-primary-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                  {municipioSelecionado?.nome || usuario?.email || ''}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-primary-500 dark:text-slate-500 flex-shrink-0 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{ background: corAvatar }}
                title={usuario?.name}
              >
                {getInitials(usuario?.name)}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-800 dark:text-slate-100 truncate leading-tight">{usuario?.name || '—'}</p>
                  <p className="text-[10px] text-primary-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                    {municipioSelecionado?.nome || usuario?.email || ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-primary-50 dark:bg-[#141624] print:block print:bg-white">

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
            className="p-2 rounded-lg text-primary-500 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-[#232745] hover:text-primary-700 transition-colors"
          >
            <Menu size={22} />
          </button>
          <LogoVotta alturaIcone={22} classeTexto="text-sm font-bold" />
          {usuario && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu do usuário"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: corAvatar }}
              title={usuario.name}
            >
              {getInitials(usuario.name)}
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
                  {getInitials(usuario.name)}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-[#1c1f38] rounded-2xl shadow-2xl w-full max-w-sm p-6"
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-primary-200 dark:border-[#3d4270]
                    text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); aoSair() }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-rosso-500 text-white
                    hover:bg-rosso-600 active:scale-[0.97] transition-all"
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
