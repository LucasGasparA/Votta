import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
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

  return [
    { label: 'Em andamento',      value: String(inProgress), icon: Clock,         color: 'text-primary-500', trend: `${total} no total` },
    { label: 'Aprovadas',         value: String(completed),  icon: CheckCircle,   color: 'text-emerald-600', trend: 'prontas para uso' },
    { label: 'Aguardando revisão', value: String(pending),   icon: AlertTriangle, color: 'text-oro-600',     trend: pending > 0 ? 'ação recomendada' : 'sem pendências', clickable: true },
    { label: 'Total criadas',     value: String(total),      icon: FileText,      color: 'text-primary-600', trend: 'desde o início' },
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

const LIMIT = 20

const Painel = () => {
  const { usuario } = useOutletContext() ?? {}
  const [estatisticas,   setEstatisticas]   = useState(construirEstatisticas([]))
  const [rawProposals,   setRawProposals]   = useState([])
  const [proposicoes,    setProposicoes]    = useState([])
  const [carregando,     setCarregando]     = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [total,          setTotal]          = useState(0)
  const [pagina,         setPagina]         = useState(1)
  const [somentePendentes, setSomentePendentes] = useState(false)

  useEffect(() => {
    api.get(`/proposals?limit=${LIMIT}&page=1`)
      .then(({ proposals, total: t }) => {
        setEstatisticas(construirEstatisticas(proposals))
        setRawProposals(proposals)
        setProposicoes(proposals.map(paraItemLista))
        setTotal(t)
        setPagina(1)
      })
      .catch(() => toast.error('Não foi possível carregar as proposições.'))
      .finally(() => setCarregando(false))
  }, [])

  const carregarMais = useCallback(async () => {
    const next = pagina + 1
    setCarregandoMais(true)
    try {
      const { proposals } = await api.get(`/proposals?limit=${LIMIT}&page=${next}`)
      setRawProposals(prev => {
        const merged = [...prev, ...proposals]
        setEstatisticas(construirEstatisticas(merged))
        return merged
      })
      setProposicoes(prev => [...prev, ...proposals.map(paraItemLista)])
      setPagina(next)
    } catch {
      toast.error('Não foi possível carregar mais proposições.')
    } finally {
      setCarregandoMais(false)
    }
  }, [pagina])

  const aoExcluir = useCallback(async (proposalId) => {
    try {
      await api.del('/proposals/' + proposalId)
      setRawProposals(prev => {
        const next = prev.filter(p => p.id !== proposalId)
        setEstatisticas(construirEstatisticas(next))
        return next
      })
      setProposicoes(prev => prev.filter(p => p.id !== proposalId))
      setTotal(prev => prev - 1)
    } catch (e) {
      toast.error(e.message)
    }
  }, [])

  const navigate        = useNavigate()
  const totalPendentes  = Number(estatisticas[2]?.value ?? 0)
  const primeiroNome    = usuario?.name?.split(' ')[0] ?? ''
  const temMais         = proposicoes.length < total
  const listaExibida    = useMemo(
    () => somentePendentes ? proposicoes.filter(p => p.status === 'pendente_revisao') : proposicoes,
    [somentePendentes, proposicoes]
  )

  return (
    <div className="min-h-full bg-slate-50/60 ">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-9">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 overflow-hidden rounded-2xl bg-white px-6 py-8 shadow-sm md:px-8 md:py-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
                {obterSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ''}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 ">
                Crie, acompanhe e revise minutas legislativas com uma experiência guiada para o trabalho parlamentar.
              </p>
            </div>

            <button
              onClick={() => navigate('/criar-minuta')}
              className="btn-primary w-full px-5 py-3 text-sm md:w-auto"
            >
              <Sparkles size={15} className="text-oro-400" />
              Criar minuta com IA
            </button>
          </div>
        </motion.header>

        {!carregando && totalPendentes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold">
                  {totalPendentes} {totalPendentes === 1 ? 'proposição precisa' : 'proposições precisam'} de revisão.
                </p>
                <p className="text-xs text-amber-800">Revise antes de exportar ou marcar como aprovada.</p>
              </div>
            </div>
            <button
              onClick={() => setSomentePendentes(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Ver pendentes
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4"
        >
          {carregando
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ">
                  <div className="mb-5 h-1 w-10 rounded-full bg-slate-100 " />
                  <div className="mb-3 h-3 w-24 rounded bg-slate-100 " />
                  <div className="mb-3 h-9 w-16 rounded bg-slate-100 " />
                  <div className="h-3 w-20 rounded bg-slate-100 " />
                </div>
              ))
            : estatisticas.map((stat, index) => (
                <CartaoEstatistica
                  key={stat.label}
                  stat={stat}
                  index={index}
                  clickable={stat.clickable}
                  onClick={stat.clickable ? () => setSomentePendentes(true) : undefined}
                />
              ))
          }
        </motion.section>

        {!carregando && total === 0 ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-base p-8"
          >
            <FileText size={28} className="text-primary-500 mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 ">Comece pela primeira minuta com IA</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              O fluxo guiado coleta tipo, tema, competência, impacto e justificativa antes de a IA gerar uma minuta para revisão.
            </p>
            <button
              onClick={() => navigate('/criar-minuta')}
              className="btn-primary mt-5"
            >
              <Plus size={16} />
              Criar minuta com IA
            </button>
          </motion.section>
        ) : (
          <section>
            {somentePendentes && (
              <div className="mb-3 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSomentePendentes(false)}
                  className="btn-ghost gap-1 text-xs"
                >
                  <X size={13} />
                  Limpar filtro
                </button>
              </div>
            )}
            <ListaMinutas
              proposals={listaExibida}
              onDelete={aoExcluir}
              title={somentePendentes ? 'Pendentes de revisão' : 'Proposições recentes'}
              emptyTitle={somentePendentes ? 'Nenhuma pendência encontrada' : undefined}
              emptyDescription={somentePendentes ? 'As proposições carregadas não têm revisão pendente.' : undefined}
            />
            {!somentePendentes && temMais && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={carregarMais}
                  disabled={carregandoMais}
                  className="btn-secondary py-2"
                >
                  {carregandoMais ? 'Carregando...' : `Carregar mais (${total - proposicoes.length} restantes)`}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default Painel
