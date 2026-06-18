import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Plus,
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
  const { municipioSelecionado, usuario } = useOutletContext() ?? {}
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
    <div className="min-h-full bg-slate-50/70 dark:bg-[#141624]">
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6"
        >
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {municipioSelecionado ? `${municipioSelecionado.nome}, ${municipioSelecionado.uf}` : 'Nenhum município selecionado'}
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-950 dark:text-slate-100 mt-1">
              {obterSaudacao()}{primeiroNome ? `, ${primeiroNome}` : ''}
            </h1>
          </div>

          <button
            onClick={() => navigate('/criar-minuta')}
            className="btn-primary"
          >
            ✨ Criar minuta com IA
          </button>
        </motion.header>

        {!carregando && totalPendentes > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
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
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
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
          className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6"
        >
          {carregando
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-base p-4 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-24 mb-5" />
                  <div className="h-8 bg-slate-100 rounded w-14 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-20" />
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comece pela primeira minuta com IA</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
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
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
            <section className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {somentePendentes ? 'Fila de revisão' : 'Trabalho recente'}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {somentePendentes ? 'Itens que ainda precisam de validação.' : 'Últimas proposições editadas.'}
                  </p>
                </div>
                {somentePendentes && (
                  <button
                    onClick={() => setSomentePendentes(false)}
                    className="btn-ghost gap-1 text-xs"
                  >
                    <X size={13} />
                    Limpar filtro
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

            <aside className="space-y-3">
              <div className="card-base p-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Status do ambiente</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">Município</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {municipioSelecionado?.nome ?? 'Não definido'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">Total</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200">
                      {total}
                      {temMais && <span className="ml-1 text-xs text-slate-400">({proposicoes.length} exibidas)</span>}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default Painel
