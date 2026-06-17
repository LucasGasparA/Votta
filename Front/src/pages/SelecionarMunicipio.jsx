import { MapPin, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const NOVA_VENEZA = {
  ibgeId: '4211603',
  nome: 'Nova Veneza',
  nomeOficial: 'Nova Veneza',
  uf: 'SC',
}

const SelecionarMunicipio = ({ aoSelecionar, current }) => {
  const navigate = useNavigate()
  const isSelected = current?.ibgeId === NOVA_VENEZA.ibgeId

  const aoEfetuarSelecao = () => {
    if (isSelected) return
    aoSelecionar(NOVA_VENEZA)
    toast.success('Município Nova Veneza selecionado com sucesso.', { duration: 2000 })
    navigate('/painel')
  }

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="page-title text-primary-800 dark:text-slate-100 mb-2">
          Selecionar Município
        </h1>
        <p className="text-primary-600 dark:text-slate-400">
          Escolha o município para carregar o perfil normativo local
        </p>
      </motion.div>

      {/* Município atual */}
      {current && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6 border-2 border-primary-200 bg-primary-50 dark:bg-dark-elevated"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-dark-border rounded-lg flex items-center justify-center">
              <Check className="text-primary-500" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Município Atual</p>
              <h3 className="section-heading text-primary-900 dark:text-slate-100">
                {current.nome}, {current.uf}
              </h3>
            </div>
          </div>
        </motion.div>
      )}

      {/* Card Nova Veneza */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={aoEfetuarSelecao}
        className={`card p-6 cursor-pointer transition-all duration-200 max-w-sm
          ${isSelected
            ? 'border-2 border-primary-500 shadow-lg'
            : 'hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5'
          }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary-100 dark:bg-dark-elevated">
              <MapPin className="text-primary-500" size={24} />
            </div>
            <div>
              <h3 className="section-heading text-primary-900 dark:text-slate-100">Nova Veneza</h3>
              <p className="text-sm text-primary-600 dark:text-primary-400">SC</p>
            </div>
          </div>
          {isSelected && (
            <div className="w-8 h-8 bg-primary-100 dark:bg-dark-border rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="text-primary-500" size={16} />
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-primary-100 dark:border-dark-border">
          <p className="text-xs text-primary-500 dark:text-slate-500">
            Código IBGE: <span className="font-mono font-medium">4211603</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SelecionarMunicipio
