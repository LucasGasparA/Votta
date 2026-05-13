import { useState, useEffect } from 'react'
import { FileText, ArrowRight, ArrowLeft, Check, Scale, AlertCircle, X, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link, useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'

const LOADING_STEPS = [
  { icon: '📋', text: 'Registrando sua proposição...' },
  { icon: '🔍', text: 'Analisando competência municipal...' },
  { icon: '⚖️',  text: 'Consultando a Lei Orgânica Municipal...' },
  { icon: '✍️',  text: 'Redigindo ementa e preâmbulo...' },
  { icon: '📜', text: 'Estruturando os artigos...' },
  { icon: '✅', text: 'Finalizando a minuta...' },
]

const CreateProposal = () => {
  const navigate = useNavigate()
  const { selectedMunicipality } = useOutletContext() ?? {}

  useEffect(() => {
    if (!selectedMunicipality) {
      toast.error('Selecione um município antes de criar uma proposição.')
      navigate('/select-municipality')
    }
  }, [selectedMunicipality, navigate])
  const [currentStep, setCurrentStep]     = useState(0)
  const [direction, setDirection]         = useState(1)
  const [submitting, setSubmitting]       = useState(false)
  const [triedNext, setTriedNext]         = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [generatingStep, setGeneratingStep] = useState(0)
  const [formData, setFormData]       = useState({
    type: '',
    theme: '',
    objective: '',
    competence: '',
    hasFinancialImpact: null,
    estimatedImpact: '',
    justification: '',
  })

  const proposalTypes = [
    { value: 'pl_ordinaria',    label: 'Projeto de Lei Ordinária',    description: 'Lei municipal de competência do município (maioria simples)',     icon: '📜' },
    { value: 'pl_complementar', label: 'Projeto de Lei Complementar', description: 'Complementa a LOM em matérias específicas (maioria absoluta)',     icon: '📋' },
    { value: 'decreto',         label: 'Decreto Municipal',           description: 'Ato administrativo do Executivo para regulamentar leis',           icon: '📄' },
    { value: 'indicacao',       label: 'Indicação',                   description: 'Sugestão ao Executivo para realização de melhorias ou serviços',   icon: '💡' },
  ]

  const steps = [
    { id: 0, title: 'Tipo de Proposição',   description: 'Escolha o tipo de documento legislativo' },
    { id: 1, title: 'Tema e Objetivo',      description: 'Defina o assunto e objetivo' },
    { id: 2, title: 'Competência',          description: 'Verifique competência municipal' },
    { id: 3, title: 'Impacto Orçamentário', description: 'Avalie impactos financeiros' },
    { id: 4, title: 'Justificativa',        description: 'Fundamente a proposição' },
  ]

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

  const nextStep = () => {
    if (!canProceed()) { setTriedNext(true); return }
    setTriedNext(false)
    setDirection(1)
    setCurrentStep(s => Math.min(s + 1, steps.length - 1))
  }

  const prevStep = () => {
    setTriedNext(false)
    setDirection(-1)
    setCurrentStep(s => Math.max(s - 1, 0))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.type !== ''
      case 1: return formData.theme.trim() !== '' && formData.objective.trim() !== ''
      case 2: return formData.competence !== ''
      case 3: return formData.hasFinancialImpact !== null
      case 4: return formData.justification.length >= 50
      default: return false
    }
  }

  const getBlockReason = () => {
    if (canProceed()) return null
    switch (currentStep) {
      case 0: return 'Selecione um tipo de proposição para continuar.'
      case 1:
        if (!formData.theme.trim())     return 'Preencha o tema da proposição.'
        if (!formData.objective.trim()) return 'Preencha o objetivo principal.'
        return null
      case 2: return 'Selecione a competência municipal.'
      case 3: return 'Informe se esta proposição tem impacto orçamentário.'
      case 4: return `A justificativa precisa ter pelo menos 50 caracteres. (${formData.justification.length}/50)`
      default: return null
    }
  }

  const handleFinish = async () => {
    if (submitting || !canProceed()) return
    setSubmitting(true)
    setGenerating(true)
    setGeneratingStep(0)

    const stepInterval = setInterval(() => {
      setGeneratingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 3000)

    try {
      const data = await api.post('/proposals', {
        ...formData,
        municipalityId: selectedMunicipality?.id,
      })

      await api.post('/ai/generate', { proposalId: data.id })

      clearInterval(stepInterval)
      setGeneratingStep(LOADING_STEPS.length - 1)

      await new Promise(r => setTimeout(r, 800))

      toast.success('Minuta gerada com sucesso!')
      navigate(`/proposal/${data.id}/edit`)
    } catch (e) {
      clearInterval(stepInterval)
      setGenerating(false)
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const justLen      = formData.justification.length
  const progressPct  = (currentStep / (steps.length - 1)) * 100
  const blockReason  = triedNext ? getBlockReason() : null

  if (generating) {
    const step = LOADING_STEPS[generatingStep]
    const pct  = Math.round(((generatingStep + 1) / LOADING_STEPS.length) * 100)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex flex-col items-center justify-center p-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">

          {/* Ícone animado */}
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-5 animate-pulse">
            <AnimatePresence mode="wait">
              <motion.span
                key={generatingStep}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
                className="text-4xl"
              >
                {step.icon}
              </motion.span>
            </AnimatePresence>
          </div>

          <h2 className="text-xl font-display font-bold text-primary-800 mb-2">
            Gerando sua minuta...
          </h2>

          {/* Texto da etapa com transição */}
          <div className="h-5 mb-5">
            <AnimatePresence mode="wait">
              <motion.p
                key={generatingStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-primary-500"
              >
                {step.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-primary-100 rounded-full h-2 mb-5">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs text-primary-400 leading-relaxed">
            Isso pode levar até 30 segundos.<br />Não feche esta página.
          </p>
        </div>

        {/* Três pontinhos abaixo do card */}
        <div className="flex items-center gap-2 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-300 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-oro-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-800 mb-0.5 flex items-center gap-3">
              <FileText className="text-primary-600" size={26} />
              Nova Proposição
            </h1>
            <p className="text-primary-500 text-sm">Wizard guiado com assistência jurídica inteligente</p>
          </div>
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-600 transition-colors mt-1">
            <X size={16} />
            Cancelar
          </Link>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.9 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="card p-4 mb-4"
        >
          {/* Indicador textual */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-primary-700">
              Etapa {currentStep + 1} de {steps.length} — {steps[currentStep].title}
            </p>
            <p className="text-xs text-primary-400 font-medium">
              {currentStep === steps.length - 1 ? '100' : Math.round(progressPct)}% concluído
            </p>
          </div>

          {/* Barra linear */}
          <div className="w-full bg-primary-100 rounded-full h-1.5 mb-4">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${currentStep === steps.length - 1 ? 100 : progressPct}%` }}
            />
          </div>

          {/* Círculos de etapas */}
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                      ${index < currentStep
                        ? 'bg-primary-600 text-white cursor-pointer hover:bg-primary-700'
                        : index === currentStep
                          ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                          : 'bg-primary-100 text-primary-400 cursor-default'
                      }
                    `}
                  >
                    {index < currentStep ? <Check size={16} /> : index + 1}
                  </button>
                  <p className={`text-xs mt-1.5 text-center hidden lg:block font-medium ${index <= currentStep ? 'text-primary-700' : 'text-primary-300'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 transition-all duration-500 ${index < currentStep ? 'bg-primary-600' : 'bg-primary-100'}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
            className="card p-5 mb-4"
          >
            <h2 className="text-xl font-display font-bold text-primary-800 mb-0.5">{steps[currentStep].title}</h2>
            <p className="text-primary-400 text-sm mb-4">{steps[currentStep].description}</p>

            {/* Passo 0 */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {proposalTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => { update('type', type.value); setTriedNext(false) }}
                    className={`text-left p-5 border-2 rounded-xl transition-all duration-200
                      ${formData.type === type.value
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-primary-100 hover:border-primary-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <h3 className="font-display font-bold text-primary-800 text-sm mb-1">{type.label}</h3>
                    <p className="text-xs text-primary-500 leading-relaxed">{type.description}</p>
                    {formData.type === type.value && (
                      <div className="mt-2 flex items-center gap-1 text-primary-600">
                        <Check size={14} />
                        <span className="text-xs font-medium">Selecionado</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Passo 1 */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Tema da Proposição</label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={e => update('theme', e.target.value)}
                    className={`input-field ${triedNext && !formData.theme.trim() ? 'border-red-400' : ''}`}
                    placeholder="Ex: Coleta Seletiva de Lixo Reciclável"
                    autoFocus
                  />
                  {triedNext && !formData.theme.trim() && (
                    <p className="text-xs text-red-500 mt-1">Campo obrigatório.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Objetivo Principal</label>
                  <textarea
                    value={formData.objective}
                    onChange={e => update('objective', e.target.value)}
                    className={`input-field min-h-[80px] resize-none ${triedNext && !formData.objective.trim() ? 'border-red-400' : ''}`}
                    placeholder="Descreva o objetivo principal desta proposição..."
                  />
                  {triedNext && !formData.objective.trim() && (
                    <p className="text-xs text-red-500 mt-1">Campo obrigatório.</p>
                  )}
                </div>
                <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <Scale className="text-primary-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-primary-600">Objetivos claros facilitam a análise de competência e a redação da minuta.</p>
                </div>
              </div>
            )}

            {/* Passo 2 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-primary-700 mb-2">A matéria é de competência municipal?</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Sim, exclusiva', 'Sim, concorrente', 'Não tenho certeza'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => update('competence', option)}
                      className={`flex items-center justify-between text-left p-4 border-2 rounded-xl transition-all duration-200
                        ${formData.competence === option
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-primary-100 hover:border-primary-300'
                        }`}
                    >
                      <span className="font-medium text-primary-800 text-sm">{option}</span>
                      {formData.competence === option && <Check size={16} className="text-primary-600" />}
                    </button>
                  ))}
                </div>
                {formData.competence === 'Não tenho certeza' && (
                  <div className="flex items-start gap-3 p-4 bg-oro-50 border border-oro-200 rounded-xl">
                    <AlertCircle className="text-oro-500 mt-0.5 flex-shrink-0" size={18} />
                    <p className="text-sm text-oro-800">O assistente jurídico consultará a Lei Orgânica do Município para verificar a competência.</p>
                  </div>
                )}
              </div>
            )}

            {/* Passo 3 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-primary-700 mb-2">Esta proposição tem impacto orçamentário?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: true, label: 'Sim', desc: 'Gera despesas ou afeta receitas' }, { value: false, label: 'Não', desc: 'Sem impacto financeiro direto' }].map(({ value, label, desc }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => update('hasFinancialImpact', value)}
                      className={`text-left p-5 border-2 rounded-xl transition-all duration-200
                        ${formData.hasFinancialImpact === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-primary-100 hover:border-primary-300'
                        }`}
                    >
                      <h3 className="font-display font-bold text-primary-800 mb-1">{label}</h3>
                      <p className="text-xs text-primary-500">{desc}</p>
                    </button>
                  ))}
                </div>
                {formData.hasFinancialImpact && (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">Estimativa de Impacto (R$)</label>
                    <input
                      type="text"
                      value={formData.estimatedImpact}
                      onChange={e => update('estimatedImpact', e.target.value)}
                      className="input-field"
                      placeholder="Ex: 150.000,00"
                    />
                    <p className="text-xs text-primary-400 mt-1">Necessário anexar estimativa de impacto orçamentário-financeiro</p>
                  </div>
                )}
              </div>
            )}

            {/* Passo 4 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-primary-700">Justificativa da Proposição</label>
                    <span className={`text-xs font-medium ${justLen >= 50 ? 'text-green-600' : 'text-primary-400'}`}>
                      {justLen} / mín. 50
                    </span>
                  </div>
                  <textarea
                    value={formData.justification}
                    onChange={e => update('justification', e.target.value)}
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Fundamente a necessidade e relevância desta proposição..."
                    autoFocus
                  />
                  <div className="mt-1.5 w-full bg-primary-100 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${justLen >= 50 ? 'bg-green-500' : 'bg-oro-500'}`}
                      style={{ width: `${Math.min((justLen / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <Scale className="text-primary-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-primary-600">O assistente irá sugerir melhorias e citações normativas relevantes para fortalecer sua argumentação.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
              ${currentStep === 0 ? 'text-primary-300 cursor-not-allowed' : 'text-primary-600 hover:bg-primary-100'}`}
          >
            <ArrowLeft size={18} />
            Anterior
          </button>

          {/* Motivo de bloqueio */}
          {blockReason && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg"
            >
              <Info size={13} />
              {blockReason}
            </motion.div>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                ${canProceed()
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                  : 'bg-primary-100 text-primary-400 hover:bg-primary-200'
                }`}
            >
              Próximo
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${canProceed() && !submitting
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg'
                  : 'bg-primary-100 text-primary-300 cursor-not-allowed'
                }`}
            >
              <Check size={18} />
              {submitting ? 'Gerando...' : 'Gerar Minuta'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateProposal
