import { Link } from 'react-router-dom'
import { PlusCircle, FileText, ArrowRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_CONFIG = {
  em_andamento:     { label: 'Em Andamento',    color: 'bg-primary-100 text-primary-700', bar: 'bg-primary-500', border: 'border-l-primary-400', Icon: Clock },
  pendente_revisao: { label: 'Pendente Revisão', color: 'bg-oro-100 text-oro-700',        bar: 'bg-oro-500',     border: 'border-l-oro-500',    Icon: AlertTriangle },
  concluido:        { label: 'Concluído',        color: 'bg-primary-50 text-primary-800', bar: 'bg-primary-700', border: 'border-l-primary-700', Icon: CheckCircle },
}

const EmptyStateSVG = () => (
  <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mx-auto mb-5 opacity-60">
    <rect x="20" y="15" width="80" height="70" rx="6" fill="#dbeafe" />
    <rect x="30" y="28" width="60" height="6" rx="3" fill="#93c5fd" />
    <rect x="30" y="40" width="45" height="4" rx="2" fill="#bfdbfe" />
    <rect x="30" y="50" width="52" height="4" rx="2" fill="#bfdbfe" />
    <rect x="30" y="60" width="38" height="4" rx="2" fill="#bfdbfe" />
    <circle cx="88" cy="72" r="18" fill="#1d4ed8" />
    <path d="M81 72l5 5 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ProposalList = ({ proposals }) => {
  const getStatus = (status) => STATUS_CONFIG[status] ?? STATUS_CONFIG.em_andamento

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-2"
    >
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-primary-800">Proposições Recentes</h2>
          <Link
            to="/create-proposal"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors"
          >
            <PlusCircle size={15} />
            Nova
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-10">
            <EmptyStateSVG />
            <p className="text-primary-700 font-semibold mb-1.5">Nenhuma proposição ainda</p>
            <p className="text-sm text-primary-400 mb-5">Crie sua primeira proposição legislativa em minutos com o wizard guiado.</p>
            <Link
              to="/create-proposal"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 active:scale-[0.97] transition-all font-semibold shadow-md shadow-primary-200"
            >
              <PlusCircle size={15} />
              Criar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {proposals.map((proposal) => {
              const cfg = getStatus(proposal.status)
              const StatusIcon = cfg.Icon
              return (
                <Link
                  key={proposal.id}
                  to={`/proposal/${proposal.id}/edit`}
                  className={`block border border-primary-100 border-l-4 ${cfg.border} rounded-xl p-4 hover:border-primary-200 hover:shadow-md hover:-translate-y-px active:scale-[0.99] transition-all duration-200 group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-primary-800 text-sm mb-0.5 truncate group-hover:text-primary-600 transition-colors">
                        {proposal.title}
                      </h3>
                      <p className="text-xs text-primary-400 truncate">{proposal.type}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                        <StatusIcon size={11} strokeWidth={2.5} />
                        {cfg.label}
                      </span>
                      <ArrowRight size={14} className="text-primary-300 group-hover:text-primary-500 transition-colors" />
                    </div>
                  </div>

                  <div className="w-full bg-primary-100 rounded-full h-1 mb-1.5">
                    <div
                      className={`${cfg.bar} h-1 rounded-full transition-all duration-700`}
                      style={{ width: `${proposal.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-primary-400">Atualizado {proposal.lastUpdate}</p>
                    <p className="text-xs font-medium text-primary-500">{proposal.progress}%</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProposalList
