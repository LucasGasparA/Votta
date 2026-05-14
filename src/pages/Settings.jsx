import { useState, useEffect, useRef } from 'react'
import { Download, Bell, Sun, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Toggle from '../components/Toggle.jsx'

const DEFAULT_SETTINGS = {
  exportFormat:          'PDF',
  includePageNumbers:    true,
  includeGenerationDate: true,
  validationAlerts:      true,
  unsavedReminder:       true,
  emailNotifications:    false,
  theme:                 'light',
}

const Settings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('legisla:settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [savedIndicator, setSavedIndicator] = useState(false)
  const isFirstRender = useRef(true)

  const set = (key, value) => setSettings(p => ({ ...p, [key]: value }))

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem('legisla:settings', JSON.stringify(settings))
        setSavedIndicator(true)
        setTimeout(() => setSavedIndicator(false), 2000)
      } catch {
        toast.error('Não foi possível salvar as preferências.')
      }
    }, 600)
    return () => clearTimeout(t)
  }, [settings])

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary-800">Configurações</h1>
          <p className="text-sm text-primary-400 mt-1">Personalize como o sistema funciona para você.</p>
        </div>
        <AnimatePresence>
          {savedIndicator && (
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
          <div className="flex items-start gap-3 p-5 border-b border-primary-100">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800">Exportação</h2>
              <p className="text-xs text-primary-400 mt-0.5">Configurações padrão para exportação de documentos</p>
            </div>
          </div>
          <div className="divide-y divide-primary-50">
            <div className="flex items-center justify-between px-5 py-4">
              <label htmlFor="exportFormat" className="text-sm text-primary-700 font-medium">
                Formato padrão
              </label>
              <select
                id="exportFormat"
                value={settings.exportFormat}
                onChange={e => set('exportFormat', e.target.value)}
                className="text-sm border border-primary-200 rounded-lg px-3 py-1.5 text-primary-700 focus:border-primary-400 focus:outline-none bg-white transition-colors"
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
              </select>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-primary-700 font-medium">
                Incluir rodapé com número de página
              </span>
              <Toggle checked={settings.includePageNumbers} onChange={v => set('includePageNumbers', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-primary-700 font-medium">
                Incluir data de geração no documento
              </span>
              <Toggle checked={settings.includeGenerationDate} onChange={v => set('includeGenerationDate', v)} />
            </div>
          </div>
        </div>

        {/* ── Card Notificações ── */}
        <div className="card">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100">
            <div className="w-8 h-8 rounded-lg bg-oro-50 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-oro-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800">Notificações</h2>
              <p className="text-xs text-primary-400 mt-0.5">Gerencie os avisos e alertas do sistema</p>
            </div>
          </div>
          <div className="divide-y divide-primary-50">
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 font-medium">Alertas de validação automática</p>
                <p className="text-xs text-primary-400 mt-0.5">Avisos de conformidade ao editar a minuta</p>
              </div>
              <Toggle checked={settings.validationAlerts} onChange={v => set('validationAlerts', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 font-medium">Lembrete de rascunho não salvo</p>
                <p className="text-xs text-primary-400 mt-0.5">Aviso ao sair com alterações pendentes</p>
              </div>
              <Toggle checked={settings.unsavedReminder} onChange={v => set('unsavedReminder', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 font-medium">Notificações por e-mail</p>
                <p className="text-xs text-primary-400 mt-0.5">Resumo semanal de proposições</p>
              </div>
              <Toggle checked={settings.emailNotifications} onChange={v => set('emailNotifications', v)} />
            </div>
          </div>
        </div>

        {/* ── Card Aparência ── */}
        <div className="card">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Sun size={16} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800">Aparência</h2>
              <p className="text-xs text-primary-400 mt-0.5">Escolha o tema visual da interface</p>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => set('theme', 'light')}
                aria-label="Tema claro"
                aria-pressed={settings.theme === 'light'}
                className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98]
                  ${settings.theme === 'light'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-primary-100 hover:border-primary-200 bg-white'
                  }`}
              >
                <div className="h-10 rounded-lg overflow-hidden flex mb-3 shadow-sm border border-primary-100">
                  <div className="w-7 bg-primary-900 flex-shrink-0" />
                  <div className="flex-1 bg-slate-100" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-700">Claro</span>
                  {settings.theme === 'light' && (
                    <span className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                </div>
              </button>

              <div className="relative rounded-xl border-2 border-primary-100 p-3 opacity-50 cursor-not-allowed bg-white">
                <div className="h-10 rounded-lg overflow-hidden flex mb-3 shadow-sm border border-primary-100">
                  <div className="w-7 bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 bg-slate-700" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-700">Escuro</span>
                  <span className="text-[10px] font-bold bg-oro-100 text-oro-700 px-1.5 py-0.5 rounded-full">
                    Em breve
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Botão salvar */}
      <div className="mt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            try {
              localStorage.setItem('legisla:settings', JSON.stringify(settings))
              setSavedIndicator(true)
              setTimeout(() => setSavedIndicator(false), 2000)
            } catch {
              toast.error('Não foi possível salvar as preferências.')
            }
          }}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Salvar preferências
        </motion.button>
      </div>
    </div>
  )
}

export default Settings
