import { motion } from 'framer-motion'

const CartaoEstatistica = ({ stat, index, onClick, clickable }) => {
  const barColor = stat.color.replace('text-', 'bg-')

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, type: 'spring', stiffness: 150 }}
      className={`rounded-2xl bg-white p-5 shadow-sm transition-all 
        ${clickable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
          : ''
        }`}
    >
      <span className={`block h-1 w-10 rounded-full ${barColor}`} />
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500 ">
        {stat.label}
      </p>
      <p className="mt-3 text-3xl font-semibold leading-none tracking-normal text-slate-950 md:text-4xl">
        {stat.value}
      </p>
      <p className="mt-3 text-sm text-slate-500 ">{stat.trend}</p>
    </motion.div>
  )
}

export default CartaoEstatistica
