import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Settings, LogOut, MapPin, Scale, Menu, X, Zap, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  '/dashboard':           'Dashboard',
  '/create-proposal':     'Nova Proposição',
  '/select-municipality': 'Selecionar Município',
  '/settings':            'Configurações',
  '/configuracoes':       'Configurações',
  '/pricing':             'Planos',
}

const Layout = ({ selectedMunicipality, onLogout, user }) => {
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

  const pageTitle = location.pathname.startsWith('/proposal/')
    ? 'Editor de Proposição'
    : PAGE_TITLES[location.pathname] ?? ''

  const navItems = [
    { path: '/dashboard',           icon: Home,       label: 'Dashboard' },
    { path: '/create-proposal',     icon: PlusCircle, label: 'Nova Proposição' },
    { path: '/select-municipality', icon: MapPin,      label: 'Município' },
    { path: '/pricing',             icon: Zap,         label: 'Planos' },
  ]

  const avatarColor = nameToColor(user?.name)

  const handleLogoutRequest = () => {
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
          className={`border-b border-primary-100 flex items-center flex-shrink-0 ${
            isCollapsed ? 'p-3 justify-center' : 'p-4 gap-3'
          }`}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale className="text-white" size={20} />
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-display font-bold text-primary-800 leading-tight">Votta</h1>
              </div>

              {mobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fechar menu"
                  className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
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
              to="/select-municipality"
              onClick={() => setSidebarOpen(false)}
              title={selectedMunicipality
                ? `${selectedMunicipality.nome} — ${selectedMunicipality.uf}`
                : 'Selecionar município'}
              className="p-2 bg-primary-50 rounded-xl border border-primary-200 flex justify-center hover:bg-primary-100 transition-colors"
            >
              <MapPin size={15} className={selectedMunicipality ? 'text-primary-600' : 'text-primary-400'} />
            </Link>
          </div>
        ) : (
          <div className="px-4 pt-3">
            <Link
              to="/select-municipality"
              onClick={() => setSidebarOpen(false)}
              className="block p-3 bg-primary-50 rounded-xl border border-primary-200 hover:bg-primary-100 transition-colors"
            >
              <p className="text-[11px] text-primary-500 font-medium mb-0.5">Município ativo</p>
              {selectedMunicipality ? (
                <>
                  <p className="text-sm font-semibold text-primary-800 leading-tight">
                    <span className="text-emerald-500 mr-1">●</span>
                    {selectedMunicipality.nome}
                  </p>
                  <p className="text-xs text-primary-400">{selectedMunicipality.uf}</p>
                </>
              ) : (
                <p className="text-sm text-primary-400 italic">Nenhum município selecionado</p>
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
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-primary-500 hover:bg-primary-50 hover:text-primary-700'
                      }`
                    : `gap-3 px-3 py-2.5 ${isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-primary-500 hover:bg-primary-50 hover:text-primary-700'
                      }`
                  }
                `}
              >
                <Icon size={17} className={isActive ? 'text-primary-600' : ''} />
                {!isCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.path === '/pricing' && (
                      <span className="ml-auto text-[10px] font-bold bg-oro-100 text-oro-700 px-1.5 py-0.5 rounded-full">
                        PRO
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.path === '/pricing' && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-oro-400 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Rodapé: avatar ── */}
        <div className={`border-t border-primary-100 relative flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-3'}`}>

          {/* Dropdown — apenas no mobile */}
          {mobile && (
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-lg border border-primary-100 py-1 z-50"
                >
                  <Link
                    to="/settings"
                    onClick={() => { setShowUserMenu(false); setSidebarOpen(false) }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 cursor-pointer transition-colors w-full text-left"
                  >
                    <Settings size={15} />
                    Configurações
                  </Link>
                  <div className="border-t border-primary-100 my-1" />
                  <button
                    onClick={handleLogoutRequest}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rosso-600 hover:bg-rosso-50 transition-colors text-left"
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
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all hover:bg-primary-100 hover:ring-1 hover:ring-primary-200"
              aria-label="Menu do usuário"
              title="Configurações e sair"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{ background: avatarColor }}
              >
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-primary-800 truncate leading-tight">{user?.name || '—'}</p>
                <p className="text-[10px] text-primary-400 truncate leading-tight mt-0.5">
                  {selectedMunicipality?.nome || user?.email || ''}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-primary-500 flex-shrink-0 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{ background: avatarColor }}
                title={user?.name}
              >
                {getInitials(user?.name)}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-800 truncate leading-tight">{user?.name || '—'}</p>
                  <p className="text-[10px] text-primary-400 truncate leading-tight mt-0.5">
                    {selectedMunicipality?.nome || user?.email || ''}
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
    <div className="h-screen flex overflow-hidden bg-primary-50 print:block print:bg-white">

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex bg-white border-r border-primary-100 flex-col shadow-sm flex-shrink-0 print:hidden transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
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
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-primary-100 flex flex-col shadow-xl print:hidden"
            >
              <SidebarContent mobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-primary-100 shadow-sm flex-shrink-0 print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="p-2 rounded-lg text-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
              <Scale className="text-white" size={14} />
            </div>
            <span className="font-display font-bold text-primary-800 text-sm">Votta</span>
          </div>
          {user && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu do usuário"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: avatarColor }}
              title={user.name}
            >
              {getInitials(user.name)}
            </button>
          )}
        </div>

        {/* Desktop top bar */}
        {user && (
          <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-white border-b border-primary-100 flex-shrink-0 print:hidden">
            <p className="text-sm font-semibold text-primary-700">{pageTitle}</p>

            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowUserMenu(p => !p) }}
                className="flex items-center gap-2 hover:bg-primary-50 rounded-xl px-2 py-1.5 transition-all"
                aria-label="Menu do usuário"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: avatarColor }}
                >
                  {getInitials(user.name)}
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
                    className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-primary-100 py-1 overflow-hidden z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-primary-100">
                      <p className="text-sm font-semibold text-primary-800 leading-tight truncate">{user.name}</p>
                      <p className="text-xs text-primary-400 mt-0.5 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      <Settings size={15} />
                      Configurações
                    </Link>
                    <div className="border-t border-primary-100 my-1" />
                    <button
                      onClick={handleLogoutRequest}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rosso-600 hover:bg-rosso-50 transition-colors text-left"
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
          <Outlet context={{ selectedMunicipality, user }} />
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-primary-200
                    text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setShowLogoutConfirm(false); onLogout() }}
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
