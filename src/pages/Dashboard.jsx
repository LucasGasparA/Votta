import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, PlusCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import ProposalList from '../components/ProposalList'
import { api } from '../utils/api.js'
import { calcularProgresso } from '../utils/progresso.js'

const TYPE_LABELS = {
  pl_ordinaria:    'Projeto de Lei Ordinária',
  pl_complementar: 'Projeto de Lei Complementar',
  decreto:         'Decreto Municipal',
  indicacao:       'Indicação',
}

const STATUS_MAP = {
  DRAFT:    'em_andamento',
  REVIEW:   'pendente_revisao',
  APPROVED: 'concluido',
}

function buildStats(proposals) {
  const total      = proposals.length
  const inProgress = proposals.filter(p => p.status === 'DRAFT').length
  const completed  = proposals.filter(p => p.status === 'APPROVED').length
  const pending    = proposals.filter(p => p.status === 'REVIEW').length
  const rate       = total > 0 ? Math.round((completed / total) * 100) : 0

  return [
    { label: 'Em Andamento',      value: String(inProgress), icon: Clock,         color: 'bg-primary-500',  trend: `${total} total` },
    { label: 'Concluídas',        value: String(completed),  icon: CheckCircle,   color: 'bg-primary-700',  trend: 'aprovadas' },
    { label: 'Pendentes Revisão', value: String(pending),    icon: AlertTriangle, color: 'bg-oro-500',      trend: pending > 0 ? 'Requer atenção' : 'Tudo em dia' },
    { label: 'Taxa de Aprovação', value: `${rate}%`,         icon: TrendingUp,    color: 'bg-primary-600',  trend: `${total} proposições` },
  ]
}

function toListItem(p) {
  return {
    id:         p.id,
    title:      p.title,
    type:       TYPE_LABELS[p.type] || p.type,
    status:     STATUS_MAP[p.status] || 'em_andamento',
    lastUpdate: new Date(p.updatedAt).toLocaleDateString('pt-BR'),
    progress:   calcularProgresso(p.status),
  }
}

const Dashboard = () => {
  const [stats,      setStats]      = useState(buildStats([]))
  const [proposals,  setProposals]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [total,      setTotal]      = useState(0)
  const [somentePendentes, setSomentePendentes] = useState(false)

  useEffect(() => {
    api.get('/proposals?limit=50')
      .then(({ proposals }) => {
        setStats(buildStats(proposals))
        setProposals(proposals.slice(0, 5).map(toListItem))
        setTotal(proposals.length)
      })
      .finally(() => setLoading(false))
  }, [])

  const pendingCount  = Number(stats[2]?.value ?? 0)
  const listaExibida  = somentePendentes
    ? proposals.filter(p => p.status === 'pendente_revisao')
    : proposals

  return (
    <div className="p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-3xl font-display font-bold text-primary-800 mb-0.5">Dashboard</h1>
        <p className="text-primary-500 text-sm">Visão geral das suas proposições legislativas</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
      >
        {stats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)}
      </motion.div>

      {/* Main Grid */}
      {!loading && total === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="text-primary-400" size={36} />
          </div>
          <h2 className="text-2xl font-display font-bold text-primary-800 mb-2">Comece sua primeira proposição</h2>
          <p className="text-primary-500 mb-8 max-w-md mx-auto">
            Use o wizard guiado para criar propostas legislativas com conformidade normativa e assistência jurídica inteligente.
          </p>
          <Link to="/create-proposal" className="inline-flex items-center gap-2 btn-primary">
            <PlusCircle size={20} />
            Nova Proposição
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="lg:col-span-2 card p-6">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-primary-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-primary-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2">
              {somentePendentes && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-sm font-semibold text-oro-700">
                    Mostrando apenas pendentes de revisão
                  </span>
                  <button
                    onClick={() => setSomentePendentes(false)}
                    className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors"
                  >
                    <X size={12} /> Ver todas
                  </button>
                </div>
              )}
              <ProposalList proposals={listaExibida} />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="card p-4">
              <h2 className="text-base font-display font-bold text-primary-800 mb-3">Ações Rápidas</h2>
              <div className="space-y-2">
                <Link
                  to="/create-proposal"
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary-100 hover:border-primary-400 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="w-9 h-9 bg-primary-100 group-hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                    <FileText className="text-primary-600 group-hover:text-white transition-colors" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-800">Novo Projeto de Lei</p>
                    <p className="text-xs text-primary-400">Iniciar nova proposição</p>
                  </div>
                </Link>

                <button
                  onClick={() => setSomentePendentes(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-primary-100 hover:border-oro-400 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="w-9 h-9 bg-oro-100 group-hover:bg-oro-500 rounded-lg flex items-center justify-center transition-colors">
                    <CheckCircle className="text-oro-600 group-hover:text-white transition-colors" size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-primary-800">Revisar Pendências</p>
                    <p className="text-xs text-primary-400">
                      {pendingCount > 0 ? `${pendingCount} aguardam revisão` : 'Nenhuma pendente'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-primary-50 to-oro-50 border-primary-200">
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1.5">Dica Jurídica</p>
              <p className="text-sm text-primary-700 leading-relaxed">
                Consulte a Lei Orgânica do Município antes de iniciar uma proposição. O assistente jurídico identifica competências e requisitos formais automaticamente.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
