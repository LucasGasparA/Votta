import { motion } from 'framer-motion'

const CartaoEstatistica = ({ stat, index }) => {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, type: 'spring', stiffness: 140 }}
      className="pl-4 border-l-2 border-primary-200"
    >
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Icon className={stat.color} size={12} />
        {stat.label}
      </p>
      <p className="text-4xl font-semibold text-slate-900 dark:text-slate-100 leading-none">
        {stat.value}
      </p>
      <p className="text-xs text-slate-400 mt-1.5">{stat.trend}</p>
    </motion.div>
  )
}

export default CartaoEstatistica
