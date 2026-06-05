import { useState, useEffect, useRef } from 'react'
import { Download, Bell, Sun, Moon, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Alternador from '../components/ui/Alternador.jsx'
import { api } from '../api/client.js'
import { useTema } from '../context/TemaContext'

const DEFAULT_SETTINGS = {
  exportFormat:          'PDF',
  includePageNumbers:    true,
  includeGenerationDate: true,
  validationAlerts:      true,
  unsavedReminder:       true,
  emailNotifications:    false,
  theme:                 'light',
}

const Configuracoes = () => {
  const { definirTema } = useTema()
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('legisla:settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [indicadorSalvo, setIndicadorSalvo] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const isFirstRender = useRef(true)

  useEffect(() => {
    api.get('/settings')
      .then(data => {
        const merged = { ...DEFAULT_SETTINGS, ...data }
        setSettings(merged)
        try { localStorage.setItem('legisla:settings', JSON.stringify(merged)) } catch { /* ignora */ }
      })
      .catch(() => {
        // mantém o que veio do localStorage
      })
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
        try { localStorage.setItem('legisla:settings', JSON.stringify(settings)) } catch { /* ignora */ }
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
      try { localStorage.setItem('legisla:settings', JSON.stringify(settings)) } catch { /* ignora */ }
      setIndicadorSalvo(true)
      setTimeout(() => setIndicadorSalvo(false), 2000)
    } catch {
      toast.error('Não foi possível salvar as preferências.')
    }
  }

  if (carregando) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="h-6 bg-primary-100 rounded w-40 animate-pulse mb-2" />
          <div className="h-4 bg-primary-100 rounded w-64 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-primary-100 rounded w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-primary-100 rounded" />
                <div className="h-10 bg-primary-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary-800 dark:text-slate-100">Configurações</h1>
          <p className="text-sm text-primary-400 dark:text-slate-500 mt-1">Personalize como o sistema funciona para você.</p>
        </div>
        <AnimatePresence>
          {indicadorSalvo && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-500"
            >
              <Check size={13} className="text-primary-500" />
              Salvo
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">

        {/* ── Card Exportação ── */}
        <div className="card">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100 dark:border-[#2d3158]">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-[#232745] flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800 dark:text-slate-100">Exportação</h2>
              <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Configurações padrão para exportação de documentos</p>
            </div>
          </div>
          <div className="divide-y divide-primary-50 dark:divide-[#2d3158]">
            <div className="flex items-center justify-between px-5 py-4">
              <label htmlFor="exportFormat" className="text-sm text-primary-700 dark:text-slate-300 font-medium">
                Formato padrão
              </label>
              <select
                id="exportFormat"
                value={settings.exportFormat}
                onChange={e => atualizar('exportFormat', e.target.value)}
                className="text-sm border border-primary-200 dark:border-[#3d4270] rounded-lg px-3 py-1.5 text-primary-700 dark:text-slate-200 focus:border-primary-400 focus:outline-none bg-white dark:bg-[#232745] transition-colors"
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
              </select>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-primary-700 dark:text-slate-300 font-medium">
                Incluir rodapé com número de página
              </span>
              <Alternador checked={settings.includePageNumbers} onChange={v => atualizar('includePageNumbers', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-primary-700 dark:text-slate-300 font-medium">
                Incluir data de geração no documento
              </span>
              <Alternador checked={settings.includeGenerationDate} onChange={v => atualizar('includeGenerationDate', v)} />
            </div>
          </div>
        </div>

        {/* ── Card Notificações ── */}
        <div className="card">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100 dark:border-[#2d3158]">
            <div className="w-8 h-8 rounded-lg bg-oro-50 dark:bg-[#232745] flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-oro-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800 dark:text-slate-100">Notificações</h2>
              <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Gerencie os avisos e alertas do sistema</p>
            </div>
          </div>
          <div className="divide-y divide-primary-50 dark:divide-[#2d3158]">
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 dark:text-slate-300 font-medium">Alertas de validação automática</p>
                <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Avisos de conformidade ao editar a minuta</p>
              </div>
              <Alternador checked={settings.validationAlerts} onChange={v => atualizar('validationAlerts', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 dark:text-slate-300 font-medium">Lembrete de rascunho não salvo</p>
                <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Aviso ao sair com alterações pendentes</p>
              </div>
              <Alternador checked={settings.unsavedReminder} onChange={v => atualizar('unsavedReminder', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 dark:text-slate-300 font-medium">Notificações por e-mail</p>
                <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Resumo semanal de proposições (em breve)</p>
              </div>
              <Alternador checked={false} onChange={() => {}} disabled />
            </div>
          </div>
        </div>

        {/* ── Card Aparência ── */}
        <div className="card">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100 dark:border-[#2d3158]">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-[#232745] flex items-center justify-center flex-shrink-0">
              {settings.theme === 'dark' ? <Moon size={16} className="text-primary-400" /> : <Sun size={16} className="text-primary-400" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800 dark:text-slate-100">Aparência</h2>
              <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Escolha o tema visual da interface</p>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => atualizar('theme', 'light')}
                aria-label="Tema claro"
                aria-pressed={settings.theme === 'light'}
                className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98]
                  ${settings.theme === 'light'
                    ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]'
                    : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-200 bg-white dark:bg-[#1c1f38]'
                  }`}
              >
                <div className="h-10 rounded-lg overflow-hidden flex mb-3 shadow-sm border border-primary-100">
                  <div className="w-7 bg-primary-800 flex-shrink-0" />
                  <div className="flex-1 bg-slate-100" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-700 dark:text-slate-300">Claro</span>
                  {settings.theme === 'light' && (
                    <span className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => atualizar('theme', 'dark')}
                aria-label="Tema escuro"
                aria-pressed={settings.theme === 'dark'}
                className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98]
                  ${settings.theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]'
                    : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-200 bg-white dark:bg-[#1c1f38]'
                  }`}
              >
                <div className="h-10 rounded-lg overflow-hidden flex mb-3 shadow-sm border border-[#2d3158]">
                  <div className="w-7 bg-[#191c33] flex-shrink-0" />
                  <div className="flex-1 bg-[#141624]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-700 dark:text-slate-300">Escuro</span>
                  {settings.theme === 'dark' && (
                    <span className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Botão salvar */}
      <div className="mt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={salvarAgora}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Salvar preferências
        </motion.button>
      </div>
    </div>
  )
}

export default Configuracoes
