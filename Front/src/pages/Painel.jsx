import { useState, useEffect } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, X, MapPin, Download, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import CartaoEstatistica from '../components/ui/CartaoEstatistica'
import ListaMinutas from '../components/ui/ListaMinutas'
import { api } from '../api/client.js'
import { calcularProgresso } from '../lib/progresso.js'
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

function construirEstatisticas(proposals) {
  const total      = proposals.length
  const inProgress = proposals.filter(p => p.status === 'DRAFT').length
  const completed  = proposals.filter(p => p.status === 'APPROVED').length
  const pending    = proposals.filter(p => p.status === 'REVIEW').length
  const rate       = total > 0 ? Math.round((completed / total) * 100) : 0

  return [
    { label: 'Em Andamento',      value: String(inProgress), icon: Clock,         color: 'text-primary-500', trend: `${total} total` },
    { label: 'Concluídas',        value: String(completed),  icon: CheckCircle,   color: 'text-primary-600', trend: 'aprovadas' },
    { label: 'Pendentes Revisão', value: String(pending),    icon: AlertTriangle, color: 'text-oro-500',     trend: pending > 0 ? 'Requer atenção' : 'Tudo em dia' },
    { label: 'Taxa de Aprovação', value: `${rate}%`,         icon: TrendingUp,    color: 'text-primary-500', trend: `${total} proposições` },
  ]
}

function paraItemLista(p) {
  return {
    id:         p.id,
    title:      p.title,
    type:       TYPE_LABELS[p.type] || p.type,
    status:     STATUS_MAP[p.status] || 'em_andamento',
    lastUpdate: new Date(p.updatedAt).toLocaleDateString('pt-BR'),
    progress:   calcularProgresso(p.status),
  }
}

function obterSaudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const Painel = () => {
  const { municipioSelecionado, usuario } = useOutletContext() ?? {}
  const [estatisticas, setEstatisticas] = useState(construirEstatisticas([]))
  const [proposicoes,  setProposicoes]  = useState([])
  const [carregando,   setCarregando]   = useState(true)
  const [total,        setTotal]        = useState(0)
  const [somentePendentes, setSomentePendentes] = useState(false)

  useEffect(() => {
    api.get('/proposals?limit=50')
      .then(({ proposals }) => {
        setEstatisticas(construirEstatisticas(proposals))
        setProposicoes(proposals.map(paraItemLista))
        setTotal(proposals.length)
      })
      .catch(() => toast.error('Não foi possível carregar as proposições.'))
      .finally(() => setCarregando(false))
  }, [])

  const aoExcluir = async (proposalId) => {
    try {
      await api.del('/proposals/' + proposalId)
      setProposicoes(prev => prev.filter(p => p.id !== proposalId))
      setTotal(t => t - 1)
      toast.success('Proposição excluída.')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const navigate     = useNavigate()
  const totalPendentes = Number(estatisticas[2]?.value ?? 0)
  const primeiroNome    = usuario?.name?.split(' ')[0] ?? ''
  const listaExibida = somentePendentes
    ? proposicoes.filter(p => p.status === 'pendente_revisao')
    : proposicoes.slice(0, 5)

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {obterSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ''}
        </h1>
        {!carregando && totalPendentes > 0 && (
          <p className="text-sm text-oro-600 mt-1">
            {totalPendentes} {totalPendentes === 1 ? 'proposição aguarda' : 'proposições aguardam'} revisão
          </p>
        )}
        {!carregando && totalPendentes === 0 && total > 0 && (
          <p className="text-sm text-slate-400 mt-1">Tudo em dia.</p>
        )}
      </motion.div>

      {/* Stats — números soltos, sem cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
      >
        {carregando
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pl-4 border-l-2 border-slate-100 animate-pulse">
                <div className="h-2.5 bg-slate-100 rounded w-20 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-12 mb-2" />
                <div className="h-2 bg-slate-100 rounded w-16" />
              </div>
            ))
          : estatisticas.map((stat, index) => <CartaoEstatistica key={stat.label} stat={stat} index={index} />)
        }
      </motion.div>

      {/* Conteúdo principal */}
      {!carregando && total === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="max-w-md"
        >
          <p className="text-base font-medium text-slate-800 dark:text-slate-100 mb-1">
            Crie sua primeira proposição
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Wizard guiado com assistência jurídica — gera ementa, preâmbulo e artigos automaticamente.
          </p>
          <button
            onClick={() => navigate('/criar-minuta')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm
              rounded-lg font-medium hover:bg-primary-700 active:scale-[0.97] transition-all"
          >
            <Plus size={15} />
            Nova Proposição
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Lista */}
          <div className="lg:col-span-2">
            {carregando ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                    </div>
                    <div className="h-5 w-20 bg-slate-100 rounded-full ml-4" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Proposições recentes</h2>
                  {somentePendentes && (
                    <button
                      onClick={() => setSomentePendentes(false)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={11} /> Ver todas
                    </button>
                  )}
                </div>
                <ListaMinutas
                  proposals={listaExibida}
                  onDelete={aoExcluir}
                  title={somentePendentes ? 'Pendentes de revisão' : 'Proposições recentes'}
                  emptyTitle={somentePendentes ? 'Nenhuma pendência encontrada' : undefined}
                  emptyDescription={somentePendentes ? 'As proposições carregadas não têm revisão pendente.' : undefined}
                />
              </>
            )}
          </div>

          {/* Ações */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Ações</h2>
            <div className="space-y-1">
              <Link
                to="/criar-minuta"
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors group"
              >
                <FileText size={15} className="text-slate-400 group-hover:text-primary-500" />
                Nova Proposição
              </Link>
              <button
                onClick={() => setSomentePendentes(true)}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors group text-left"
              >
                <AlertTriangle size={15} className="text-slate-400 group-hover:text-oro-500" />
                <span>Pendentes de revisão</span>
                {totalPendentes > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-oro-100 text-oro-700 px-1.5 py-0.5 rounded-full">
                    {totalPendentes}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Painel
