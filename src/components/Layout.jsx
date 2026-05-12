import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Settings, LogOut, MapPin, Scale, Menu, X, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
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

const Layout = ({ selectedMunicipality, onLogout, user }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { path: '/dashboard',           icon: Home,       label: 'Dashboard' },
    { path: '/create-proposal',     icon: PlusCircle, label: 'Nova Proposição' },
    { path: '/select-municipality', icon: MapPin,     label: 'Município' },
    { path: '/pricing',             icon: Zap,        label: 'Planos' },
  ]

  const avatarColor = nameToColor(user?.name)

  const SidebarContent = ({ mobile = false }) => {
    const isCollapsed = collapsed && !mobile

    return (
      <>
        {/* Logo */}
        <div className={`border-b border-primary-100 flex items-center flex-shrink-0 ${isCollapsed ? 'p-3 justify-center' : 'p-5 justify-between'}`}>
          {isCollapsed ? (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <Scale className="text-white" size={20} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Scale className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-base font-display font-bold text-primary-800 leading-tight">Votta</h1>
                  <p className="text-xs text-primary-400">Assistente Legislativo</p>
                </div>
              </div>
              {mobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Município ativo */}
        {selectedMunicipality && (
          isCollapsed ? (
            <div className="px-2 pt-3">
              <div
                className="p-2 bg-primary-50 rounded-xl border border-primary-200 flex justify-center"
                title={`${selectedMunicipality.nome} — ${selectedMunicipality.uf}`}
              >
                <MapPin size={15} className="text-primary-500" />
              </div>
            </div>
          ) : (
            <div className="px-4 pt-3">
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-xs text-primary-400 font-medium mb-0.5">Município ativo</p>
                <p className="text-sm font-semibold text-primary-800 leading-tight">{selectedMunicipality.nome}</p>
                <p className="text-xs text-primary-400">{selectedMunicipality.uf}</p>
              </div>
            </div>
          )
        )}

        {/* Navegação */}
        <nav className="flex-1 p-2 space-y-0.5">
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
                    ? `justify-center p-3 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-primary-500 hover:bg-primary-50 hover:text-primary-700'}`
                    : `gap-3 py-2.5 pr-4 border-l-[3px] pl-[13px] ${isActive
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-transparent text-primary-500 hover:bg-primary-50 hover:text-primary-700'
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

        {/* Rodapé usuário */}
        <div className={`border-t border-primary-100 space-y-0.5 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {user && (
            isCollapsed ? (
              <div className="flex justify-center py-2 mb-1" title={user.name}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: avatarColor }}
                >
                  {getInitials(user.name)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: avatarColor }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-800 truncate leading-tight">{user.name}</p>
                  <p className="text-xs text-primary-400 truncate">{user.email}</p>
                </div>
              </div>
            )
          )}

          <Link
            to="/configuracoes"
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? 'Configurações' : undefined}
            className={`w-full flex items-center gap-3 text-sm text-primary-500 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-all duration-200 font-medium
              ${isCollapsed ? 'justify-center p-3' : 'px-[13px] py-2.5'}`}
          >
            <Settings size={17} />
            {!isCollapsed && <span>Configurações</span>}
          </Link>

          <button
            onClick={onLogout}
            title={isCollapsed ? 'Sair' : undefined}
            className={`w-full flex items-center gap-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 font-medium
              ${isCollapsed ? 'justify-center p-3' : 'px-[13px] py-2.5'}`}
          >
            <LogOut size={17} />
            {!isCollapsed && <span>Sair</span>}
          </button>

          {/* Botão colapsar (desktop only) */}
          {!mobile && (
            <button
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className={`w-full flex items-center gap-3 text-sm text-primary-400 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-all duration-200 mt-1
                ${isCollapsed ? 'justify-center p-3' : 'px-[13px] py-2.5'}`}
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
              {!isCollapsed && <span className="text-xs">Recolher menu</span>}
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-primary-50 print:block print:bg-white">

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex bg-white border-r border-primary-100 flex-col shadow-sm flex-shrink-0 overflow-y-auto print:hidden transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
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
          <div className="w-10" />
        </div>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          <Outlet context={{ selectedMunicipality }} />
        </main>
      </div>
    </div>
  )
}

export default Layout
