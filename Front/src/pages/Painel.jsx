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
        setProposicoes(proposals.slice(0, 5).map(paraItemLista))
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
    : proposicoes

  return (
    <div className="p-4 md:p-8">

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="text-2xl font-display font-bold text-primary-900 dark:text-slate-100">
          {obterSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ''}
        </h1>
        {!carregando && totalPendentes > 0 && (
          <p className="text-sm text-oro-600 font-medium mt-1">
            {totalPendentes} {totalPendentes === 1 ? 'proposição aguarda' : 'proposições aguardam'} revisão
          </p>
        )}
        {!carregando && totalPendentes === 0 && total > 0 && (
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
        {carregando
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1c1f38] rounded-xl border border-primary-100 dark:border-[#2d3158] p-5 animate-pulse">
                <div className="h-3 bg-primary-100 dark:bg-[#2d3158] rounded w-1/2 mb-4" />
                <div className="h-9 bg-primary-100 dark:bg-[#2d3158] rounded w-1/3 mb-2" />
                <div className="h-2.5 bg-primary-100 dark:bg-[#2d3158] rounded w-2/3" />
              </div>
            ))
          : estatisticas.map((stat, index) => <CartaoEstatistica key={stat.label} stat={stat} index={index} />)
        }
      </motion.div>

      {/* Main Grid */}
      {!carregando && total === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1c1f38] rounded-2xl border border-primary-100 dark:border-[#2d3158] shadow-sm p-8 mt-2"
        >
          <p className="text-base font-semibold text-primary-800 dark:text-slate-100 mb-1">
            Comece sua primeira proposição
          </p>
          <p className="text-sm text-primary-400 dark:text-slate-500 mb-8 max-w-sm">
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
                  <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-[#232745] flex items-center justify-center flex-shrink-0">
                    <passo.icone size={18} className="text-primary-600" />
                  </div>
                  <p className="text-sm font-semibold text-primary-800 dark:text-slate-200">{passo.titulo}</p>
                  <p className="text-xs text-primary-400 dark:text-slate-500">{passo.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="mt-5 text-primary-200 text-lg flex-shrink-0">→</div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/criar-minuta')}
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
          {carregando ? (
            <div className="lg:col-span-2 card p-6">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-primary-100 dark:bg-[#2d3158] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-primary-100 dark:bg-[#2d3158] rounded w-1/2" />
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
                    className="flex items-center gap-1 text-xs text-primary-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <X size={12} /> Ver todas
                  </button>
                </div>
              )}
              <ListaMinutas proposals={listaExibida} onDelete={aoExcluir} />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-primary-400 dark:text-slate-500 uppercase tracking-wide mb-3">Ações Rápidas</h2>
              <div className="space-y-2">
                <Link
                  to="/criar-minuta"
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-200 hover:bg-primary-100 hover:border-primary-300 active:scale-[0.98] transition-all group"
                >
                  <FileText className="text-primary-500 flex-shrink-0" size={16} />
                  <div>
                    <p className="text-sm font-semibold text-primary-800 dark:text-slate-200 leading-tight">Nova Proposição</p>
                    <p className="text-xs text-primary-400 leading-tight mt-0.5">Iniciar pelo wizard guiado</p>
                  </div>
                </Link>

                <button
                  onClick={() => setSomentePendentes(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-primary-100 dark:border-[#2d3158] hover:border-oro-300 hover:bg-oro-50/50 dark:hover:bg-[#232745] active:scale-[0.98] transition-all group"
                >
                  <AlertTriangle className="text-oro-500 flex-shrink-0" size={16} />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-primary-800 dark:text-slate-200 leading-tight">Revisar Pendências</p>
                    <p className="text-xs text-primary-400 dark:text-slate-500 leading-tight mt-0.5">
                      {totalPendentes > 0 ? `${totalPendentes} aguardam revisão` : 'Nenhuma pendente'}
                    </p>
                  </div>
                  {totalPendentes > 0 && (
                    <span className="ml-auto text-xs font-bold bg-oro-100 text-oro-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      {totalPendentes}
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

export default Painel
