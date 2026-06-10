import { createContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import { useTema } from './TemaContext'

export const DEFAULT_SETTINGS = {
  exportFormat:          'PDF',
  includePageNumbers:    true,
  includeGenerationDate: true,
  validationAlerts:      true,
  unsavedReminder:       true,
  emailNotifications:    false,
  theme:                 'light',
}

export const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const { definirTema } = useTema()

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('legisla:settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [carregando, setCarregando] = useState(true)
  const [indicadorSalvo, setIndicadorSalvo] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    api.get('/settings')
      .then(data => {
        const merged = { ...DEFAULT_SETTINGS, ...data }
        setSettings(merged)
        try { localStorage.setItem('legisla:settings', JSON.stringify(merged)) } catch { /* noop */ }
      })
      .catch(() => { /* mantém localStorage */ })
      .finally(() => {
        setCarregando(false)
        isFirstRender.current = false
      })
  }, [])

  const atualizar = (key, value) => {
    setSettings(p => ({ ...p, [key]: value }))
    if (key === 'theme') definirTema(value)
  }

  useEffect(() => {
    if (isFirstRender.current || carregando) return
    const t = setTimeout(async () => {
      try {
        await api.put('/settings', settings)
        try { localStorage.setItem('legisla:settings', JSON.stringify(settings)) } catch { /* noop */ }
        setIndicadorSalvo(true)
        setTimeout(() => setIndicadorSalvo(false), 2000)
      } catch {
        toast.error('Não foi possível salvar as preferências.')
      }
    }, 600)
    return () => clearTimeout(t)
  }, [settings, carregando])

  const salvarAgora = async () => {
    try {
      await api.put('/settings', settings)
      try { localStorage.setItem('legisla:settings', JSON.stringify(settings)) } catch { /* noop */ }
      setIndicadorSalvo(true)
      setTimeout(() => setIndicadorSalvo(false), 2000)
    } catch {
      toast.error('Não foi possível salvar as preferências.')
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, atualizar, salvarAgora, carregando, indicadorSalvo }}>
      {children}
    </SettingsContext.Provider>
  )
}
