import { motion } from 'framer-motion'

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, type: 'spring', stiffness: 120 }}
      className="bg-white rounded-xl border border-primary-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${stat.color} w-9 h-9 rounded-xl flex items-center justify-center`}>
          <Icon className="text-white" size={18} />
        </div>
      </div>
      <p className="text-2xl font-display font-bold text-primary-800 mb-0.5 leading-none">{stat.value}</p>
      <p className="text-sm font-semibold text-primary-600 mb-0.5">{stat.label}</p>
      <p className="text-xs text-primary-400">{stat.trend}</p>
    </motion.div>
  )
}

export default StatCard
