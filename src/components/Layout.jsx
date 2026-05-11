import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Settings, LogOut, MapPin, Scale, Menu, X, Zap } from 'lucide-react'
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
  const location   = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { path: '/dashboard',          icon: Home,       label: 'Dashboard' },
    { path: '/create-proposal',    icon: PlusCircle, label: 'Nova Proposição' },
    { path: '/select-municipality',icon: MapPin,     label: 'Município' },
    { path: '/pricing',            icon: Zap,        label: 'Planos' },
  ]

  const avatarColor = nameToColor(user?.name)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-primary-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Scale className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-primary-800 leading-tight">LegislaApp</h1>
            <p className="text-xs text-primary-400">Assistente Legislativo</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Município ativo */}
      {selectedMunicipality && (
        <div className="px-4 pt-4">
          <div className="p-3 bg-primary-50 rounded-xl border border-primary-200">
            <p className="text-xs text-primary-400 font-medium mb-0.5">Município ativo</p>
            <p className="text-sm font-semibold text-primary-800 leading-tight">{selectedMunicipality.nome}</p>
            <p className="text-xs text-primary-400">{selectedMunicipality.uf}</p>
          </div>
        </div>
      )}

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                relative flex items-center gap-3 py-2.5 pr-4 rounded-xl transition-all duration-200 text-sm font-medium
                border-l-[3px]
                ${isActive
                  ? 'border-primary-600 bg-primary-50 text-primary-700 pl-[13px]'
                  : 'border-transparent text-primary-500 hover:bg-primary-50 hover:text-primary-700 pl-[13px]'
                }
              `}
            >
              <Icon size={17} className={isActive ? 'text-primary-600' : ''} />
              <span>{item.label}</span>
              {item.path === '/pricing' && (
                <span className="ml-auto text-[10px] font-bold bg-oro-100 text-oro-700 px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé usuário */}
      <div className="p-4 border-t border-primary-100 space-y-0.5">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
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
        )}

        <Link
          to="/configuracoes"
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center gap-3 px-[13px] py-2.5 text-sm text-primary-500 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-all duration-200 font-medium"
        >
          <Settings size={17} />
          <span>Configurações</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-[13px] py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 font-medium"
        >
          <LogOut size={17} />
          <span>Sair</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-primary-50 print:block print:bg-white">

      {/* Sidebar desktop (always visible) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-primary-100 flex-col shadow-sm flex-shrink-0 print:hidden">
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
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-primary-100 flex flex-col shadow-xl print:hidden"
            >
              <SidebarContent />
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
            <span className="font-display font-bold text-primary-800 text-sm">LegislaApp</span>
          </div>
          <div className="w-10" />
        </div>

        <main className="flex-1 overflow-auto print:overflow-visible">
          <Outlet context={{ selectedMunicipality }} />
        </main>
      </div>
    </div>
  )
}

export default Layout
