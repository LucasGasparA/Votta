import { Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Configuracoes() {
  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-primary-800 mb-1">Configurações</h1>
        <p className="text-primary-500">Gerencie sua conta e preferências</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-primary-100 shadow-sm p-12 text-center"
      >
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings size={28} className="text-primary-400" />
        </div>
        <h2 className="text-xl font-display font-bold text-primary-800 mb-2">Em breve</h2>
        <p className="text-sm text-primary-500 max-w-sm mx-auto">
          As configurações de conta, notificações e integrações estarão disponíveis em breve.
        </p>
      </motion.div>
    </div>
  )
}
