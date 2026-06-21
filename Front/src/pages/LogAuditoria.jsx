import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LogIn, FilePlus, FileEdit, Trash2, Zap, Download,
  Activity, ChevronDown, Search, ExternalLink,
} from 'lucide-react'
import { api } from '../api/client.js'
import { formatDate } from '../lib/formatDate.js'
import { relativeTime } from '../lib/relativeTime.js'

const ACTION_META = {
  LOGIN: {
    icon: LogIn, label: 'Acesso ao sistema',
    iconBg: 'bg-primary-50', iconFg: 'text-primary-500',
  },
  PROPOSAL_CREATED: {
    icon: FilePlus, label: 'Proposição criada',
    iconBg: 'bg-primary-100', iconFg: 'text-primary-600',
  },
  PROPOSAL_UPDATED: {
    icon: FileEdit, label: 'Proposição atualizada',
    iconBg: 'bg-primary-50', iconFg: 'text-primary-500',
  },
  PROPOSAL_DELETED: {
    icon: Trash2, label: 'Proposição excluída',
    iconBg: 'bg-rosso-100', iconFg: 'text-rosso-500',
  },
  PROPOSAL_GENERATED: {
    icon: Zap, label: 'Minuta gerada pela IA',
    iconBg: 'bg-oro-100', iconFg: 'text-oro-500',
  },
  PROPOSAL_EXPORTED: {
    icon: Download, label: 'Documento exportado',
    iconBg: 'bg-primary-100', iconFg: 'text-primary-700',
  },
}

const FILTERS = [
  { key: 'all',                label: 'Todos' },
  { key: 'LOGIN',              label: 'Acessos' },
  { key: 'PROPOSAL_CREATED',   label: 'Criações' },
  { key: 'PROPOSAL_UPDATED',   label: 'Edições' },
  { key: 'PROPOSAL_DELETED',   label: 'Exclusões' },
  { key: 'PROPOSAL_GENERATED', label: 'IA' },
  { key: 'PROPOSAL_EXPORTED',  label: 'Exportações' },
]

const DEFAULT_META = { icon: Activity, label: null, iconBg: 'bg-primary-50', iconFg: 'text-primary-500' }

function metaFor(action) {
  return ACTION_META[action] ?? { ...DEFAULT_META, label: action.toLowerCase().replace(/_/g, ' ') }
}

function interpretarDetalhe(raw) {
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

function textoSecundario(log, detail) {
  if (detail?.title) return detail.title
  if (log.entityId)  return `ID: ${log.entityId.slice(0, 8)}…`
  return null
}

function rotuloGrupo(dateStr) {
  const d = new Date(dateStr)
  const hoje = new Date()
  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)

  if (d.toDateString() === hoje.toDateString())  return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function agruparPorDia(logs) {
  const grupos = []
  const indice = new Map()

  for (const log of logs) {
    const chave = new Date(log.createdAt).toDateString()
    if (!indice.has(chave)) {
      const grupo = { chave, rotulo: rotuloGrupo(log.createdAt), itens: [] }
      indice.set(chave, grupo)
      grupos.push(grupo)
    }
    indice.get(chave).itens.push(log)
  }
  return grupos
}


function EventoExpansivel({ log, isLast }) {
  const [aberto, setAberto] = useState(false)
  const meta   = metaFor(log.action)
  const detail = useMemo(() => interpretarDetalhe(log.detail), [log.detail])
  const sub    = textoSecundario(log, detail)
  const Icon   = meta.icon

  const temLinkMinuta = log.entityType === 'PROPOSAL'
    && log.action !== 'PROPOSAL_DELETED'
    && Boolean(log.entityId)

  const camposDetalhe = []
  if (log.ip)        camposDetalhe.push(['Endereço IP', log.ip])
  if (log.entityId)  camposDetalhe.push(['Identificador', log.entityId])
  if (detail?.title) camposDetalhe.push(['Título', detail.title])

  return (
    <div className="flex gap-4">
      {/* Coluna da timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center`}>
          <Icon size={16} className={meta.iconFg} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-primary-100 my-1.5" />}
      </div>

      {/* Card do evento */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="bg-white rounded-xl border border-primary-100 shadow-sm hover:shadow-md transition-all duration-200">
          <button
            type="button"
            onClick={() => setAberto(v => !v)}
            aria-expanded={aberto}
            className="w-full flex items-center gap-3 px-4 py-3 text-left active:scale-[0.99] transition-transform duration-200"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-800">{meta.label}</p>
              {sub && <p className="text-xs text-primary-400 truncate mt-0.5">{sub}</p>}
            </div>
            <span className="text-xs text-primary-400 flex-shrink-0" title={formatDate(log.createdAt)}>
              {relativeTime(log.createdAt)}
            </span>
            <ChevronDown
              size={16}
              className={`text-primary-400 flex-shrink-0 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {aberto && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 border-t border-primary-50 space-y-2.5">
                  <dl className="space-y-2 pt-2.5">
                    {camposDetalhe.map(([rotulo, valor]) => (
                      <div key={rotulo} className="flex gap-3 text-xs">
                        <dt className="w-28 flex-shrink-0 text-primary-400">{rotulo}</dt>
                        <dd className="flex-1 min-w-0 text-primary-700 break-words font-mono">{valor}</dd>
                      </div>
                    ))}
                    <div className="flex gap-3 text-xs">
                      <dt className="w-28 flex-shrink-0 text-primary-400">Data e hora</dt>
                      <dd className="flex-1 min-w-0 text-primary-700">{formatDate(log.createdAt)}</dd>
                    </div>
                  </dl>

                  {temLinkMinuta && (
                    <Link
                      to={`/minuta/${log.entityId}/editar`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 active:scale-[0.97] transition-all duration-200"
                    >
                      <ExternalLink size={14} />
                      Abrir minuta
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}


const LogAuditoria = () => {
  const [logs, setLogs]     = useState([])
  const [status, setStatus] = useState('loading') // loading | success | empty | error
  const [filtro, setFiltro] = useState('all')
  const [busca, setBusca]   = useState('')

  const buscarLogs = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await api.get('/audit')
      const list = data.logs ?? []
      setLogs(list)
      setStatus(list.length === 0 ? 'empty' : 'success')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => { buscarLogs() }, [buscarLogs])

  const logsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return logs.filter(log => {
      if (filtro !== 'all' && log.action !== filtro) return false
      if (!termo) return true
      const detail = interpretarDetalhe(log.detail)
      const alvo = [metaFor(log.action).label, detail?.title, log.entityId, log.ip]
        .filter(Boolean).join(' ').toLowerCase()
      return alvo.includes(termo)
    })
  }, [logs, filtro, busca])

  const grupos = useMemo(() => agruparPorDia(logsFiltrados), [logsFiltrados])

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-display font-bold text-primary-800 mb-1">Trilha de Auditoria</h1>
      <p className="text-sm text-primary-400 mb-6">Registro de todas as ações realizadas na sua conta</p>

      {/* Filtros */}
      {status === 'success' && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => {
              const ativo = filtro === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFiltro(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full active:scale-[0.97] transition-all duration-200 ${
                    ativo
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white border border-primary-200 text-primary-600 hover:border-primary-400 hover:bg-primary-50'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
            <label htmlFor="busca-auditoria" className="sr-only">Buscar nos registros</label>
            <input
              id="busca-auditoria"
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título, IP ou identificador…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-primary-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-14 rounded-xl bg-primary-100" />
          ))}
        </div>
      )}

      {status === 'empty' && (
        <div className="flex flex-col items-center justify-center py-20 text-primary-400">
          <Shield size={40} className="mb-4 opacity-40" />
          <p className="text-sm">Nenhuma ação registrada ainda</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 text-primary-400">
          <p className="text-sm mb-4">Não foi possível carregar o histórico. Tente novamente.</p>
          <button
            onClick={buscarLogs}
            className="px-4 py-2 text-sm rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all duration-200"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'success' && grupos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-primary-400">
          <Search size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhum registro corresponde ao filtro</p>
        </div>
      )}

      {status === 'success' && grupos.length > 0 && (
        <div className="space-y-6">
          {grupos.map(grupo => (
            <div key={grupo.chave}>
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-3">{grupo.rotulo}</p>
              <div>
                {grupo.itens.map((log, idx) => (
                  <EventoExpansivel
                    key={log.id}
                    log={log}
                    isLast={idx === grupo.itens.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LogAuditoria
