import { useState, useEffect, useCallback } from 'react'
import { Shield, LogIn, FilePlus, FileEdit, Trash2, Zap, Download, Activity } from 'lucide-react'
import { api } from '../api/client.js'
import { formatDate } from '../lib/formatDate.js'

const ACTION_ICONS = {
  LOGIN:              LogIn,
  PROPOSAL_CREATED:   FilePlus,
  PROPOSAL_UPDATED:   FileEdit,
  PROPOSAL_DELETED:   Trash2,
  PROPOSAL_GENERATED: Zap,
  PROPOSAL_EXPORTED:  Download,
}

const ACTION_LABELS = {
  LOGIN:              'Acesso ao sistema',
  PROPOSAL_CREATED:   'Proposição criada',
  PROPOSAL_UPDATED:   'Proposição atualizada',
  PROPOSAL_DELETED:   'Proposição excluída',
  PROPOSAL_GENERATED: 'Minuta gerada pela IA',
  PROPOSAL_EXPORTED:  'Documento exportado',
}

function rotuloAcao(action) {
  return ACTION_LABELS[action] ?? action.toLowerCase().replace(/_/g, ' ')
}

function interpretarDetalhe(raw) {
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

function textoSecundario(log) {
  const detail = interpretarDetalhe(log.detail)
  if (detail?.title) return detail.title
  if (log.entityId)  return `ID: ${log.entityId.slice(0, 8)}…`
  return null
}


const LogAuditoria = () => {
  const [logs, setLogs]       = useState([])
  const [status, setStatus]   = useState('loading') // loading | success | empty | error

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="page-title mb-1">Trilha de Auditoria</h1>
      <p className="text-sm text-primary-400 mb-6">Registro de todas as ações realizadas na sua conta</p>

      {status === 'loading' && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-14 rounded-2xl bg-primary-100 " />
          ))}
        </div>
      )}

      {status === 'empty' && (
        <div className="flex flex-col items-center justify-center py-20 text-primary-400 ">
          <Shield size={40} className="mb-4 opacity-40" />
          <p className="text-sm">Nenhuma ação registrada ainda</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 text-primary-400 ">
          <p className="text-sm mb-4">Não foi possível carregar o histórico.</p>
          <button
            onClick={buscarLogs}
            className="px-4 py-2 text-sm rounded-2xl border border-primary-200 text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-2">
          {logs.map(log => {
            const Icon = ACTION_ICONS[log.action] ?? Activity
            const sub  = textoSecundario(log)
            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-primary-100 px-5 py-4 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-800 ">{rotuloAcao(log.action)}</p>
                  {sub && <p className="text-xs text-primary-400 truncate mt-0.5">{sub}</p>}
                </div>
                <p className="text-xs text-primary-400 ml-auto flex-shrink-0">{formatDate(log.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LogAuditoria
