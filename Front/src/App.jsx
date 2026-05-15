import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Layout from './components/Layout'
import { api } from './services/api.js'
import { TemaProvider } from './context/TemaContext'

const Login               = lazy(() => import('./pages/Login'))
const Painel              = lazy(() => import('./pages/Painel'))
const SelecionarMunicipio = lazy(() => import('./pages/SelecionarMunicipio'))
const CriarMinuta         = lazy(() => import('./pages/CriarMinuta'))
const EditorMinuta        = lazy(() => import('./pages/EditorMinuta'))
const Planos              = lazy(() => import('./pages/Planos'))
const EsqueciSenha        = lazy(() => import('./pages/EsqueciSenha'))
const RedefinirSenha      = lazy(() => import('./pages/RedefinirSenha'))
const Configuracoes       = lazy(() => import('./pages/Configuracoes'))
const Cadastro            = lazy(() => import('./pages/Cadastro'))
const LogAuditoria        = lazy(() => import('./pages/LogAuditoria'))

function App() {
  const [estaAutenticado, definirAutenticado]          = useState(false)
  const [usuario, setUsuario]                          = useState(null)
  const [carregando, setCarregando]                    = useState(true)
  const [municipioSelecionado, setMunicipioSelecionado] = useState(() => {
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
        definirAutenticado(true)
        setUsuario(user)
      })
      .catch(() => {
        definirAutenticado(false)
      })
      .finally(() => setCarregando(false))
  }, [])

  const aoEntrar = () => {
    api.get('/auth/me')
      .then(({ user }) => {
        definirAutenticado(true)
        setUsuario(user)
      })
      .catch(() => {
        definirAutenticado(false)
      })
  }

  const aoSelecionarMunicipio = (municipio) => {
    setMunicipioSelecionado(municipio)
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

  const aoSair = async () => {
    try { await api.post('/auth/logout', {}) } catch { /* ignora */ }
    definirAutenticado(false)
    setUsuario(null)
    setMunicipioSelecionado(null)
    try { localStorage.removeItem('legisla:municipality') } catch { /* ignora */ }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50 dark:bg-[#141624]">
        <div className="flex items-center gap-3 text-primary-600">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <TemaProvider>
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-primary-50 dark:bg-[#141624]">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
      <Routes>
        <Route
          path="/login"
          element={estaAutenticado ? <Navigate to="/painel" /> : <Login aoEntrar={aoEntrar} />}
        />
        <Route
          path="/cadastro"
          element={estaAutenticado ? <Navigate to="/painel" /> : <Cadastro />}
        />
        <Route path="/esqueci-senha"   element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        <Route
          path="/"
          element={
            estaAutenticado
              ? <Layout municipioSelecionado={municipioSelecionado} aoSair={aoSair} usuario={usuario} />
              : <Navigate to="/login" />
          }
        >
          <Route index element={<Navigate to="/painel" />} />
          <Route path="painel" element={<Painel />} />
          <Route
            path="selecionar-municipio"
            element={<SelecionarMunicipio aoSelecionar={aoSelecionarMunicipio} current={municipioSelecionado} />}
          />
          <Route path="criar-minuta"           element={<CriarMinuta />} />
          <Route path="minuta/:id/editar"      element={<EditorMinuta />} />
          <Route path="planos"                 element={<Planos />} />
          <Route path="configuracoes"          element={<Configuracoes />} />
          <Route path="auditoria"              element={<LogAuditoria />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      </Suspense>
    </Router>
    </TemaProvider>
  )
}

export default App
