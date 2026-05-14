import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Layout from './components/Layout'
import { api } from './utils/api.js'

const Login              = lazy(() => import('./pages/Login'))
const Dashboard          = lazy(() => import('./pages/Dashboard'))
const SelectMunicipality = lazy(() => import('./pages/SelectMunicipality'))
const CreateProposal     = lazy(() => import('./pages/CreateProposal'))
const ProposalEditor     = lazy(() => import('./pages/ProposalEditor'))
const Pricing            = lazy(() => import('./pages/Pricing'))
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword      = lazy(() => import('./pages/ResetPassword'))
const Configuracoes      = lazy(() => import('./pages/Configuracoes'))
const Settings           = lazy(() => import('./pages/Settings'))
const Register           = lazy(() => import('./pages/Register'))

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [selectedMunicipality, setSelectedMunicipality] = useState(() => {
    try {
      const saved = localStorage.getItem('legisla:municipality')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    api.get('/auth/me')
      .then(({ user }) => {
        setIsAuthenticated(true)
        setUser(user)
      })
      .catch(() => {
        setIsAuthenticated(false)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = () => {
    api.get('/auth/me').then(({ user }) => {
      setIsAuthenticated(true)
      setUser(user)
    })
  }

  const handleSelectMunicipality = (municipio) => {
    setSelectedMunicipality(municipio)
    try {
      if (municipio) {
        localStorage.setItem('legisla:municipality', JSON.stringify(municipio))
      } else {
        localStorage.removeItem('legisla:municipality')
      }
    } catch {
      // localStorage indisponível — silencioso
    }
  }

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}) } catch { /* ignora */ }
    setIsAuthenticated(false)
    setUser(null)
    setSelectedMunicipality(null)
    try { localStorage.removeItem('legisla:municipality') } catch { /* ignora */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="flex items-center gap-3 text-primary-600">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-primary-50">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        <Route
          path="/"
          element={
            isAuthenticated
              ? <Layout selectedMunicipality={selectedMunicipality} onLogout={handleLogout} user={user} />
              : <Navigate to="/login" />
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="select-municipality"
            element={<SelectMunicipality onSelect={handleSelectMunicipality} current={selectedMunicipality} />}
          />
          <Route path="create-proposal" element={<CreateProposal />} />
          <Route path="proposal/:id/edit" element={<ProposalEditor />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="configuracoes" element={<Navigate to="/settings" />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      </Suspense>
    </Router>
  )
}

export default App
