import { useState, useRef, useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, FileText, PlusCircle, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  em_andamento:     { label: 'Em andamento',       color: 'bg-primary-50 text-primary-700', Icon: Clock },
  pendente_revisao: { label: 'Aguardando revisão', color: 'bg-oro-50 text-oro-800',         Icon: AlertTriangle },
  concluido:        { label: 'Aprovada',           color: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle },
}

const ListaMinutas = ({
  proposals,
  onDelete,
  title = 'Proposições recentes',
  emptyTitle = 'Nenhuma minuta legislativa ainda',
  emptyDescription = 'Crie sua primeira minuta legislativa com apoio da IA e revise antes de exportar.',
}) => {
  const [alvoExclusao, setAlvoExclusao] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const obterStatus = (status) => STATUS_CONFIG[status] ?? STATUS_CONFIG.em_andamento

  const confirmarExclusao = () => {
    const { id } = alvoExclusao
    setAlvoExclusao(null)

    let cancelado = false

    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-700">Proposição excluída.</span>
          <button
            onClick={() => { cancelado = true; clearTimeout(timerRef.current); toast.dismiss(t.id) }}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
          >
            Desfazer
          </button>
        </div>
      ),
      { duration: 4000 }
    )

    timerRef.current = setTimeout(() => {
      if (!cancelado) onDelete(id)
      toast.dismiss(toastId)
    }, 4000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-2xl bg-white shadow-sm "
    >
      <div className="px-6 pb-3 pt-6">
        <h2 className="text-base font-semibold text-slate-950 ">{title}</h2>
        <p className="mt-1 text-xs text-slate-500 ">
          Acervo de minutas legislativas em elaboração e revisão.
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-primary-500 ">
            <FileText size={22} />
          </div>
          <p className="font-semibold text-slate-900 ">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 ">{emptyDescription}</p>
          <Link
            to="/criar-minuta"
            className="btn-primary mt-5 py-2"
          >
            <PlusCircle size={15} />
            Criar minuta com IA
          </Link>
        </div>
      ) : (
        <div className="space-y-3 px-4 pb-4">
          {proposals.map((proposal) => {
            const cfg = obterStatus(proposal.status)
            const StatusIcon = cfg.Icon
            const tituloExibido = proposal.title || 'Sem título'

            return (
              <div key={proposal.id} className="grid grid-cols-[1fr_auto] gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-slate-50 ">
                <Link to={`/minuta/${proposal.id}/editar`} className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-primary-500 sm:flex ">
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950 hover:text-primary-700 ">
                        {tituloExibido}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500 ">
                        <span className="truncate">{proposal.type}</span>
                        <span aria-hidden="true">/</span>
                        <span>Atualizada em {proposal.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                    <StatusIcon size={12} strokeWidth={2.5} />
                    {cfg.label}
                  </span>
                  <button
                    onClick={() => setAlvoExclusao({ id: proposal.id, title: tituloExibido })}
                    aria-label={`Excluir proposição: ${tituloExibido}`}
                    className="rounded-md p-2 text-slate-400 hover:bg-rosso-50 hover:text-rosso-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {alvoExclusao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 14 }}
              className="modal-base max-w-sm"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rosso-50 ">
                <Trash2 size={21} className="text-rosso-500" />
              </div>
              <h2 className="text-center text-lg font-semibold text-slate-900 ">Excluir proposição?</h2>
              <p className="mt-2 text-center text-sm text-slate-500 ">
                Esta ação remove a proposição e não pode ser desfeita.
              </p>
              <p className="mt-4 truncate rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-800 ">
                {alvoExclusao.title}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setAlvoExclusao(null)}
                  className="btn-secondary flex-1 px-3"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  className="btn-danger flex-1 px-3"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Painel.jsx precisa de dois ajustes para este memo ser eficaz:
// 1. aoExcluir → useCallback(async (id) => { ... }, [])  (usa functional updates, deps vazia)
// 2. listaExibida → useMemo(() => somentePendentes ? proposicoes.filter(...) : proposicoes, [somentePendentes, proposicoes])
export default memo(ListaMinutas)
