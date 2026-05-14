import { motion } from 'framer-motion'

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, type: 'spring', stiffness: 120 }}
      className="bg-white rounded-xl border border-primary-100 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide leading-none">
          {stat.label}
        </p>
        <div className={`${stat.color} w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="text-white" size={13} />
        </div>
      </div>
      <p className="text-4xl font-display font-bold text-primary-900 leading-none mb-2">
        {stat.value}
      </p>
      <p className="text-xs text-primary-400">{stat.trend}</p>
    </motion.div>
  )
}

export default StatCard
