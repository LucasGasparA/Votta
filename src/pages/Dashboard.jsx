import { useState, useEffect } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, PlusCircle, X, MapPin, Download, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import ProposalList from '../components/ProposalList'
import { api } from '../utils/api.js'
import { calcularProgresso } from '../utils/progresso.js'
import toast from 'react-hot-toast'

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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const Dashboard = () => {
  const { selectedMunicipality, user } = useOutletContext() ?? {}
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
      .catch(() => toast.error('Não foi possível carregar as proposições.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (proposalId) => {
    try {
      await api.del('/proposals/' + proposalId)
      setProposals(prev => prev.filter(p => p.id !== proposalId))
      setTotal(t => t - 1)
      toast.success('Proposição excluída.')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const navigate     = useNavigate()
  const pendingCount = Number(stats[2]?.value ?? 0)
  const firstName    = user?.name?.split(' ')[0] ?? ''
  const listaExibida = somentePendentes
    ? proposals.filter(p => p.status === 'pendente_revisao')
    : proposals

  return (
    <div className="p-4 md:p-8">

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="text-2xl font-display font-bold text-primary-900">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        {!loading && pendingCount > 0 && (
          <p className="text-sm text-oro-600 font-medium mt-1">
            {pendingCount} {pendingCount === 1 ? 'proposição aguarda' : 'proposições aguardam'} revisão
          </p>
        )}
        {!loading && pendingCount === 0 && total > 0 && (
          <p className="text-sm text-primary-400 mt-1">Nenhuma pendência — tudo em dia.</p>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-primary-100 p-5 animate-pulse">
                <div className="h-3 bg-primary-100 rounded w-1/2 mb-4" />
                <div className="h-9 bg-primary-100 rounded w-1/3 mb-2" />
                <div className="h-2.5 bg-primary-100 rounded w-2/3" />
              </div>
            ))
          : stats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)
        }
      </motion.div>

      {/* Main Grid */}
      {!loading && total === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-primary-100 shadow-sm p-8 mt-2"
        >
          <p className="text-base font-semibold text-primary-800 mb-1">
            Comece sua primeira proposição
          </p>
          <p className="text-sm text-primary-400 mb-8 max-w-sm">
            Siga os passos abaixo para criar sua primeira minuta legislativa com conformidade normativa.
          </p>

          <div className="flex items-start gap-3 mb-8">
            {[
              { icone: MapPin,   titulo: 'Selecione o município',  desc: 'Define o perfil normativo da câmara' },
              { icone: FileText, titulo: 'Crie a proposição',      desc: 'Wizard guiado em 5 etapas' },
              { icone: Download, titulo: 'Exporte o documento',    desc: 'PDF ou DOCX com conformidade validada' },
            ].map((passo, i, arr) => (
              <div key={i} className="flex items-start gap-3 flex-1">
                <div className="flex flex-col items-center flex-1 text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <passo.icone size={18} className="text-primary-600" />
                  </div>
                  <p className="text-sm font-semibold text-primary-800">{passo.titulo}</p>
                  <p className="text-xs text-primary-400">{passo.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="mt-5 text-primary-200 text-lg flex-shrink-0">→</div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/create-proposal')}
              className="flex items-center gap-2 px-6 py-3 bg-rosso-500 text-white
                rounded-xl font-semibold hover:bg-rosso-600 active:scale-[0.97]
                transition-all duration-200 shadow-sm"
            >
              <Plus size={16} />
              Nova Proposição
            </button>
          </div>
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
              <ProposalList proposals={listaExibida} onDelete={handleDelete} />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3">Ações Rápidas</h2>
              <div className="space-y-2">
                <Link
                  to="/create-proposal"
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all group"
                >
                  <FileText className="text-white/80 flex-shrink-0" size={16} />
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Nova Proposição</p>
                    <p className="text-xs text-white/60 leading-tight mt-0.5">Iniciar pelo wizard guiado</p>
                  </div>
                </Link>

                <button
                  onClick={() => setSomentePendentes(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-primary-100 hover:border-oro-300 hover:bg-oro-50/50 active:scale-[0.98] transition-all group"
                >
                  <AlertTriangle className="text-oro-500 flex-shrink-0" size={16} />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-primary-800 leading-tight">Revisar Pendências</p>
                    <p className="text-xs text-primary-400 leading-tight mt-0.5">
                      {pendingCount > 0 ? `${pendingCount} aguardam revisão` : 'Nenhuma pendente'}
                    </p>
                  </div>
                  {pendingCount > 0 && (
                    <span className="ml-auto text-xs font-bold bg-oro-100 text-oro-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
