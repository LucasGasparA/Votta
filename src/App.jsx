import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SelectMunicipality from './pages/SelectMunicipality'
import CreateProposal from './pages/CreateProposal'
import ProposalEditor from './pages/ProposalEditor'
import Pricing from './pages/Pricing'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Configuracoes from './pages/Configuracoes'
import { api } from './utils/api.js'
import Register from './pages/Register'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [selectedMunicipality, setSelectedMunicipality] = useState(null)

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

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}) } catch { /* ignora */ }
    setIsAuthenticated(false)
    setUser(null)
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
            element={<SelectMunicipality onSelect={setSelectedMunicipality} current={selectedMunicipality} />}
          />
          <Route path="create-proposal" element={<CreateProposal />} />
          <Route path="proposal/:id/edit" element={<ProposalEditor />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
