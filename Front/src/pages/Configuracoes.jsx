import { Download, Bell, Check, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import Alternador from '../components/ui/Alternador.jsx'
import { useSettings } from '../hooks/useSettings.js'

const NOVA_VENEZA = {
  ibgeId: '4211603',
  nome: 'Nova Veneza',
  nomeOficial: 'Nova Veneza',
  uf: 'SC',
}

const Configuracoes = () => {
  const { settings, atualizar, salvarAgora, carregando, indicadorSalvo } = useSettings()
  const { municipioSelecionado, aoSelecionarMunicipio } = useOutletContext() ?? {}

  const municipioAtivo = municipioSelecionado?.ibgeId === NOVA_VENEZA.ibgeId

  const aoEfetuarSelecao = () => {
    if (municipioAtivo) return
    aoSelecionarMunicipio(NOVA_VENEZA)
    toast.success('Município Nova Veneza selecionado com sucesso.', { duration: 2000 })
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
            <div key={i} className="card-base p-6 animate-pulse">
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
          <h1 className="text-xl font-display font-bold text-primary-800 ">Configurações</h1>
          <p className="text-sm text-primary-400 mt-1">Personalize como o sistema funciona para você.</p>
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
        <div className="card-base">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100 ">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800 ">Exportação</h2>
              <p className="text-xs text-primary-400 mt-0.5">Configurações padrão para exportação de documentos</p>
            </div>
          </div>
          <div className="divide-y divide-primary-50 ">
            <div className="flex items-center justify-between px-5 py-4">
              <label htmlFor="exportFormat" className="text-sm text-primary-700 font-medium">
                Formato padrão
              </label>
              <select
                id="exportFormat"
                value={settings.exportFormat}
                onChange={e => atualizar('exportFormat', e.target.value)}
                className="select-base"
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
              </select>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-primary-700 font-medium">
                Incluir rodapé com número de página
              </span>
              <Alternador checked={settings.includePageNumbers} onChange={v => atualizar('includePageNumbers', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-primary-700 font-medium">
                Incluir data de geração no documento
              </span>
              <Alternador checked={settings.includeGenerationDate} onChange={v => atualizar('includeGenerationDate', v)} />
            </div>
          </div>
        </div>

        {/* ── Card Notificações ── */}
        <div className="card-base">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100 ">
            <div className="w-8 h-8 rounded-lg bg-oro-50 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-oro-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800 ">Notificações</h2>
              <p className="text-xs text-primary-400 mt-0.5">Gerencie os avisos e alertas do sistema</p>
            </div>
          </div>
          <div className="divide-y divide-primary-50 ">
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 font-medium">Alertas de validação automática</p>
                <p className="text-xs text-primary-400 mt-0.5">Avisos de conformidade ao editar a minuta</p>
              </div>
              <Alternador checked={settings.validationAlerts} onChange={v => atualizar('validationAlerts', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 font-medium">Lembrete de rascunho não salvo</p>
                <p className="text-xs text-primary-400 mt-0.5">Aviso ao sair com alterações pendentes</p>
              </div>
              <Alternador checked={settings.unsavedReminder} onChange={v => atualizar('unsavedReminder', v)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 gap-6">
              <div>
                <p className="text-sm text-primary-700 font-medium">Notificações por e-mail</p>
                <p className="text-xs text-primary-400 mt-0.5">Resumo semanal de proposições (em breve)</p>
              </div>
              <Alternador checked={false} onChange={() => {}} disabled />
            </div>
          </div>
        </div>

        {/* ── Card Município ── */}
        <div className="card-base">
          <div className="flex items-start gap-3 p-5 border-b border-primary-100 ">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary-800 ">Município</h2>
              <p className="text-xs text-primary-400 mt-0.5">Município ativo para carregar o perfil normativo local</p>
            </div>
          </div>
          <div className="p-5">
            <button
              type="button"
              onClick={aoEfetuarSelecao}
              aria-pressed={municipioAtivo}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99]
                ${municipioAtivo
                  ? 'border-primary-500 bg-primary-50 '
                  : 'border-primary-100 hover:border-primary-300 '
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-100 flex-shrink-0">
                  <MapPin className="text-primary-500" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-800 ">Nova Veneza, SC</p>
                  <p className="text-xs text-primary-400 ">Código IBGE: <span className="font-mono font-medium">4211603</span></p>
                </div>
              </div>
              {municipioAtivo && (
                <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-white" />
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Botão salvar */}
      <div className="mt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={salvarAgora}
          className="btn-primary rounded-2xl px-6"
        >
          Salvar preferências
        </motion.button>
      </div>
    </div>
  )
}

export default Configuracoes
