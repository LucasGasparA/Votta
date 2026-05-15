import { useState, useEffect, useCallback } from 'react'
import { Search, MapPin, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { buscarMunicipiosPorUF } from '../utils/ibge.js'

const SelecionarMunicipio = ({ aoSelecionar, current }) => {
  const navigate = useNavigate()
  const [busca,       setBusca]       = useState('')
  const [municipios,  setMunicipios]  = useState([])
  const [carregando,  setCarregando]  = useState(true)
  const [erro,        setErro]        = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(false)
    try {
      const dados = await buscarMunicipiosPorUF('SC')
      setMunicipios(dados)
    } catch {
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = municipios.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.uf.toLowerCase().includes(busca.toLowerCase())
  )

  const aoEfetuarSelecao = (municipio) => {
    aoSelecionar(municipio)
    toast.success(`Município ${municipio.nome} selecionado com sucesso.`, { duration: 2000 })
    navigate('/painel')
  }

  return (
    <div className="p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-primary-800 mb-2">
          Selecionar Município
        </h1>
        <p className="text-primary-600">
          Escolha o município para carregar o perfil normativo local
        </p>
      </motion.div>

      {/* Busca */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-field pl-12"
            placeholder="Buscar por município ou estado..."
            disabled={carregando}
          />
        </div>
      </motion.div>

      {/* Município atual */}
      {current && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-6 border-2 border-primary-500 bg-gradient-to-br from-primary-50 to-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Check className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Município Atual</p>
              <h3 className="text-xl font-display font-bold text-primary-900">
                {current.nome}, {current.uf}
              </h3>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {carregando && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-primary-100 rounded w-28" />
                  <div className="h-3 bg-primary-100 rounded w-8" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-primary-100 rounded w-full" />
                <div className="h-3 bg-primary-100 rounded w-3/4" />
                <div className="h-3 bg-primary-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erro com retry */}
      {!carregando && erro && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center"
        >
          <div className="w-14 h-14 bg-oro-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-oro-600" />
          </div>
          <h2 className="text-lg font-semibold text-primary-800 mb-1">
            Não foi possível carregar os municípios
          </h2>
          <p className="text-sm text-primary-500 mb-6">
            Verifique sua conexão com a internet e tente novamente.
          </p>
          <button
            onClick={carregar}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 active:scale-[0.97] transition-all font-semibold"
          >
            <RefreshCw size={15} />
            Tentar novamente
          </button>
        </motion.div>
      )}

      {/* Grid de municípios */}
      {!carregando && !erro && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map((municipio, index) => {
              const isSelected = current?.ibgeId === municipio.ibgeId
              return (
                <motion.div
                  key={municipio.ibgeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index }}
                  onClick={() => !isSelected && aoEfetuarSelecao(municipio)}
                  className={`card p-6 cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-2 border-primary-500 shadow-lg'
                      : 'hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary-600' : 'bg-primary-100'}`}>
                        <MapPin className={isSelected ? 'text-white' : 'text-primary-600'} size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold text-primary-900">{municipio.nomeOficial}</h3>
                        <p className="text-sm text-primary-600">{municipio.uf}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="text-white" size={16} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-primary-100">
                    <p className="text-xs text-primary-500">
                      Código IBGE: <span className="font-mono font-medium">{municipio.ibgeId}</span>
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {filtrados.length === 0 && municipios.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <MapPin size={48} className="text-primary-300 mx-auto mb-4" />
              <p className="text-primary-700 text-lg font-semibold">Nenhum município encontrado</p>
              <p className="text-primary-500 text-sm mt-2">Tente outro termo de busca</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default SelecionarMunicipio
