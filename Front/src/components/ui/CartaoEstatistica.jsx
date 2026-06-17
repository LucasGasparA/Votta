import { motion } from 'framer-motion'

const CartaoEstatistica = ({ stat, index, onClick, clickable }) => {
  const Icon = stat.icon

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, type: 'spring', stiffness: 150 }}
      className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-dark-surface transition-all
        ${clickable
          ? 'border-slate-200 dark:border-dark-border cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md hover:ring-2 hover:ring-primary-100 dark:hover:ring-primary-900/40'
          : 'border-slate-200 dark:border-dark-border'
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {stat.label}
        </p>
        <Icon className={stat.color} size={17} />
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none text-slate-950 dark:text-slate-100">
        {stat.value}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.trend}</p>
    </motion.div>
  )
}

export default CartaoEstatistica
