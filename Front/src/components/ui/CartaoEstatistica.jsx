import { motion } from 'framer-motion'

const CartaoEstatistica = ({ stat, index }) => {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, type: 'spring', stiffness: 120 }}
      className="bg-white dark:bg-[#1c1f38] rounded-xl border border-primary-100 dark:border-[#2d3158] p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-primary-400 dark:text-slate-500 uppercase tracking-wider leading-none">
          {stat.label}
        </p>
        <div className="bg-primary-50 dark:bg-[#232745] w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className={stat.color} size={13} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-primary-900 dark:text-slate-100 leading-none mb-1.5">
        {stat.value}
      </p>
      <p className="text-xs text-primary-300 dark:text-slate-500">{stat.trend}</p>
    </motion.div>
  )
}

export default CartaoEstatistica
