import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, FileText, PlusCircle, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  em_andamento:     { label: 'Em andamento',       color: 'bg-primary-50 text-primary-700 border-primary-100', Icon: Clock },
  pendente_revisao: { label: 'Aguardando revisão', color: 'bg-oro-50 text-oro-800 border-oro-100',             Icon: AlertTriangle },
  concluido:        { label: 'Aprovada',           color: 'bg-emerald-50 text-emerald-700 border-emerald-100', Icon: CheckCircle },
}

const ListaMinutas = ({
  proposals,
  onDelete,
  title = 'Proposições recentes',
  emptyTitle = 'Nenhuma proposição ainda',
  emptyDescription = 'Crie sua primeira proposição legislativa em minutos com o fluxo guiado.',
}) => {
  const [alvoExclusao, setAlvoExclusao] = useState(null)
  const timerRef = useRef(null)

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
      className="rounded-lg border border-slate-200 bg-white shadow-sm dark:bg-[#1c1f38] dark:border-[#2d3158]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-[#2d3158]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <Link
          to="/criar-minuta"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-[#232745] transition-colors"
        >
          <PlusCircle size={15} />
          Nova
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-[#232745] dark:text-slate-300">
            <FileText size={22} />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{emptyDescription}</p>
          <Link
            to="/criar-minuta"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <PlusCircle size={15} />
            Criar proposição
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-[#2d3158]">
          {proposals.map((proposal) => {
            const cfg = obterStatus(proposal.status)
            const StatusIcon = cfg.Icon

            return (
              <div key={proposal.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#232745]/60 transition-colors">
                <Link to={`/minuta/${proposal.id}/editar`} className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 sm:flex dark:bg-[#232745] dark:text-slate-300">
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-primary-300">
                        {proposal.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate">{proposal.type}</span>
                        <span aria-hidden="true">/</span>
                        <span>Atualizada em {proposal.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                    <StatusIcon size={12} strokeWidth={2.5} />
                    {cfg.label}
                  </span>
                  <button
                    onClick={() => setAlvoExclusao({ id: proposal.id, title: proposal.title })}
                    aria-label={`Excluir proposição: ${proposal.title}`}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 14 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1c1f38]"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-rosso-50 dark:bg-rosso-900/20">
                <Trash2 size={21} className="text-rosso-500" />
              </div>
              <h2 className="text-center text-lg font-semibold text-slate-900 dark:text-slate-100">Excluir proposição?</h2>
              <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                Esta ação remove a proposição e não pode ser desfeita.
              </p>
              <p className="mt-4 truncate rounded-md bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-800 dark:bg-[#232745] dark:text-slate-200">
                {alvoExclusao.title}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setAlvoExclusao(null)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#3d4270] dark:text-slate-300 dark:hover:bg-[#232745] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  className="flex-1 rounded-lg bg-rosso-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rosso-600 transition-colors"
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

export default ListaMinutas
