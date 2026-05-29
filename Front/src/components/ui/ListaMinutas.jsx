import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_CONFIG = {
  em_andamento:     { label: 'Em Andamento',    color: 'bg-primary-100 text-primary-700', bar: 'bg-primary-500', border: 'border-l-primary-400', Icon: Clock },
  pendente_revisao: { label: 'Pendente Revisão', color: 'bg-oro-100 text-oro-700',        bar: 'bg-oro-500',     border: 'border-l-oro-500',    Icon: AlertTriangle },
  concluido:        { label: 'Concluído',        color: 'bg-primary-50 text-primary-800', bar: 'bg-primary-700', border: 'border-l-primary-700', Icon: CheckCircle },
}

const EmptyStateSVG = () => (
  <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mx-auto mb-5 opacity-50">
    <rect x="20" y="15" width="80" height="70" rx="6" fill="#D5E6F9" />
    <rect x="30" y="28" width="60" height="6" rx="3" fill="#7DAEE8" />
    <rect x="30" y="40" width="45" height="4" rx="2" fill="#AACCF2" />
    <rect x="30" y="50" width="52" height="4" rx="2" fill="#AACCF2" />
    <rect x="30" y="60" width="38" height="4" rx="2" fill="#AACCF2" />
    <circle cx="88" cy="72" r="18" fill="#3D7BCC" />
    <path d="M81 72l5 5 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ListaMinutas = ({ proposals, onDelete }) => {
  const [alvoExclusao, setAlvoExclusao] = useState(null)

  const obterStatus = (status) => STATUS_CONFIG[status] ?? STATUS_CONFIG.em_andamento

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-2"
    >
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-primary-800 dark:text-slate-100">Proposições Recentes</h2>
          <Link
            to="/criar-minuta"
            className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold transition-colors"
          >
            <PlusCircle size={15} />
            Nova
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-10">
            <EmptyStateSVG />
            <p className="text-primary-700 dark:text-slate-300 font-semibold mb-1.5">Nenhuma proposição ainda</p>
            <p className="text-sm text-primary-400 dark:text-slate-500 mb-5">Crie sua primeira proposição legislativa em minutos com o wizard guiado.</p>
            <Link
              to="/criar-minuta"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-50 border border-primary-200 text-primary-700 text-sm rounded-xl hover:bg-primary-100 hover:border-primary-300 active:scale-[0.97] transition-all font-semibold"
            >
              <PlusCircle size={15} />
              Criar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {proposals.map((proposal) => {
              const cfg = obterStatus(proposal.status)
              const StatusIcon = cfg.Icon
              return (
                <div
                  key={proposal.id}
                  className={`relative border-l-4 ${cfg.border} bg-white dark:bg-[#1c1f38] rounded-xl
                    hover:bg-primary-50/50 dark:hover:bg-[#232745] transition-colors duration-150 group`}
                >
                  <Link
                    to={`/minuta/${proposal.id}/editar`}
                    className="block p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-primary-900 dark:text-slate-100 text-[15px] mb-0.5 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {proposal.title}
                        </h3>
                        <p className="text-xs text-primary-400 dark:text-slate-500 truncate">{proposal.type}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon size={11} strokeWidth={2.5} />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="w-full bg-primary-100 dark:bg-[#2d3158] rounded-full h-1.5 mb-1.5">
                      <div
                        className={`${cfg.bar} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: `${proposal.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-primary-400 dark:text-slate-500">Atualizado {proposal.lastUpdate}</p>
                  </Link>

                  <button
                    onClick={e => {
                      e.preventDefault()
                      setAlvoExclusao({ id: proposal.id, title: proposal.title })
                    }}
                    aria-label={`Excluir proposição: ${proposal.title}`}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-primary-300
                      hover:text-rosso-500 hover:bg-rosso-50
                      focus-visible:text-rosso-500 focus-visible:bg-rosso-50 focus-visible:opacity-100
                      opacity-0 group-hover:opacity-100
                      transition-all duration-150"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <AnimatePresence>
        {alvoExclusao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-[#1c1f38] rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="w-12 h-12 bg-rosso-50 dark:bg-rosso-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-rosso-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-primary-800 dark:text-slate-100 text-center mb-2">
                Excluir proposição?
              </h2>
              <p className="text-sm text-primary-500 dark:text-slate-400 text-center mb-1 leading-relaxed">
                Você está prestes a excluir:
              </p>
              <p className="text-sm font-semibold text-primary-800 dark:text-slate-200 text-center mb-6 px-2 truncate">
                "{alvoExclusao.title}"
              </p>
              <p className="text-xs text-rosso-500 text-center mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAlvoExclusao(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-primary-200 dark:border-[#3d4270]
                    text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDelete(alvoExclusao.id)
                    setAlvoExclusao(null)
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-rosso-500 text-white
                    hover:bg-rosso-600 active:scale-[0.97] transition-all"
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
