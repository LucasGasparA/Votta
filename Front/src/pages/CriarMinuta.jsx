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

const CriarMinuta = () => {
  const navigate = useNavigate()
  const { municipioSelecionado } = useOutletContext() ?? {}

  useEffect(() => {
    if (!municipioSelecionado) {
      toast.error('Selecione um município antes de criar uma proposição.')
      navigate('/selecionar-municipio')
    }
  }, [municipioSelecionado, navigate])
  const [etapaAtual, setEtapaAtual]           = useState(0)
  const [direcao, setDirecao]                 = useState(1)
  const [enviando, setEnviando]               = useState(false)
  const [tentouProximo, setTentouProximo]     = useState(false)
  const [gerando, setGerando]                 = useState(false)
  const [etapaGeracao, setEtapaGeracao]       = useState(0)
  const [dadosFormulario, setDadosFormulario] = useState({
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

  const atualizar = (key, value) => setDadosFormulario(prev => ({ ...prev, [key]: value }))

  const proximaEtapa = () => {
    if (!podeAvancar()) { setTentouProximo(true); return }
    setTentouProximo(false)
    setDirecao(1)
    setEtapaAtual(s => Math.min(s + 1, steps.length - 1))
  }

  const etapaAnterior = () => {
    setTentouProximo(false)
    setDirecao(-1)
    setEtapaAtual(s => Math.max(s - 1, 0))
  }

  const podeAvancar = () => {
    switch (etapaAtual) {
      case 0: return dadosFormulario.type !== ''
      case 1: return dadosFormulario.theme.trim() !== '' && dadosFormulario.objective.trim() !== ''
      case 2: return dadosFormulario.competence !== ''
      case 3: return dadosFormulario.hasFinancialImpact !== null
      case 4: return dadosFormulario.justification.length >= 50
      default: return false
    }
  }

  const obterMotivoBloqueio = () => {
    if (podeAvancar()) return null
    switch (etapaAtual) {
      case 0: return 'Selecione um tipo de proposição para continuar.'
      case 1:
        if (!dadosFormulario.theme.trim())     return 'Preencha o tema da proposição.'
        if (!dadosFormulario.objective.trim()) return 'Preencha o objetivo principal.'
        return null
      case 2: return 'Selecione a competência municipal.'
      case 3: return 'Informe se esta proposição tem impacto orçamentário.'
      case 4: return `A justificativa precisa ter pelo menos 50 caracteres. (${dadosFormulario.justification.length}/50)`
      default: return null
    }
  }

  const aoFinalizar = async () => {
    if (enviando || !podeAvancar()) return
    setEnviando(true)
    setGerando(true)
    setEtapaGeracao(0)

    const stepInterval = setInterval(() => {
      setEtapaGeracao(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 3000)

    try {
      const data = await api.post('/proposals', {
        ...dadosFormulario,
        municipalityId: municipioSelecionado?.id,
      })

      await api.post('/ai/generate', { proposalId: data.id })

      clearInterval(stepInterval)
      setEtapaGeracao(LOADING_STEPS.length - 1)

      await new Promise(r => setTimeout(r, 800))

      toast.success('Minuta gerada com sucesso!')
      navigate(`/minuta/${data.id}/editar`)
    } catch (e) {
      clearInterval(stepInterval)
      setGerando(false)
      toast.error(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const tamanhoJustificativa      = dadosFormulario.justification.length
  const percentualProgresso  = (etapaAtual / (steps.length - 1)) * 100
  const motivoBloqueio  = tentouProximo ? obterMotivoBloqueio() : null

  if (gerando) {
    const step = LOADING_STEPS[etapaGeracao]
    const pct  = Math.round(((etapaGeracao + 1) / LOADING_STEPS.length) * 100)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex flex-col items-center justify-center p-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">

          {/* Ícone animado */}
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-5 animate-pulse">
            <AnimatePresence mode="wait">
              <motion.span
                key={etapaGeracao}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
                className="text-4xl"
                aria-hidden="true"
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
                key={etapaGeracao}
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
    <div className="bg-gradient-to-br from-primary-50 via-white to-oro-50 dark:from-[#141624] dark:via-[#141624] dark:to-[#141624] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-800 dark:text-slate-100 mb-0.5 flex items-center gap-3">
              <FileText className="text-primary-600" size={26} />
              Nova Proposição
            </h1>
            <p className="text-primary-500 dark:text-slate-400 text-sm">Wizard guiado com assistência jurídica inteligente</p>
          </div>
          <Link to="/painel" className="flex items-center gap-1.5 text-sm text-primary-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-slate-300 transition-colors mt-1">
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
            <p className="text-sm font-semibold text-primary-700 dark:text-slate-200">
              Etapa {etapaAtual + 1} de {steps.length} — {steps[etapaAtual].title}
            </p>
            <p className="text-xs text-primary-400 dark:text-slate-500 font-medium">
              {etapaAtual === steps.length - 1 ? '100' : Math.round(percentualProgresso)}% concluído
            </p>
          </div>

          {/* Barra linear */}
          <div className="w-full bg-primary-100 dark:bg-[#232745] rounded-full h-1.5 mb-4">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${etapaAtual === steps.length - 1 ? 100 : percentualProgresso}%` }}
            />
          </div>

          {/* Círculos de etapas */}
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => index < etapaAtual && setEtapaAtual(index)}
                    aria-label={index < etapaAtual ? `Ir para etapa ${index + 1}: ${step.title}` : undefined}
                    aria-current={index === etapaAtual ? 'step' : undefined}
                    disabled={index >= etapaAtual}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                      ${index < etapaAtual
                        ? 'bg-primary-600 text-white cursor-pointer hover:bg-primary-700'
                        : index === etapaAtual
                          ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-[#2d3158]'
                          : 'bg-primary-100 dark:bg-[#232745] text-primary-400 dark:text-slate-500 cursor-default'
                      }
                    `}
                  >
                    {index < etapaAtual ? <Check size={16} /> : index + 1}
                  </button>
                  <p className={`text-xs mt-1.5 text-center hidden lg:block font-medium ${index <= etapaAtual ? 'text-primary-700 dark:text-slate-300' : 'text-primary-300 dark:text-slate-600'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 transition-all duration-500 ${index < etapaAtual ? 'bg-primary-600' : 'bg-primary-100 dark:bg-[#232745]'}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={etapaAtual}
            initial={{ opacity: 0, x: direcao * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direcao * -40 }}
            transition={{ duration: 0.25 }}
            className="card p-5 mb-4"
          >
            <h2 className="text-xl font-display font-bold text-primary-800 dark:text-slate-100 mb-0.5">{steps[etapaAtual].title}</h2>
            <p className="text-primary-400 dark:text-slate-500 text-sm mb-4">{steps[etapaAtual].description}</p>

            {/* Passo 0 */}
            {etapaAtual === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {proposalTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => { atualizar('type', type.value); setTentouProximo(false) }}
                    className={`text-left p-5 border-2 rounded-xl transition-all duration-200
                      ${dadosFormulario.type === type.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-[#232745] shadow-md'
                        : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-300 dark:hover:border-[#3d4270] hover:shadow-sm'
                      }`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <h3 className="font-display font-bold text-primary-800 dark:text-slate-100 text-sm mb-1">{type.label}</h3>
                    <p className="text-xs text-primary-500 dark:text-slate-400 leading-relaxed">{type.description}</p>
                    {dadosFormulario.type === type.value && (
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
            {etapaAtual === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-1.5">Tema da Proposição</label>
                  <input
                    id="theme"
                    type="text"
                    value={dadosFormulario.theme}
                    onChange={e => atualizar('theme', e.target.value)}
                    className={`input-field ${tentouProximo && !dadosFormulario.theme.trim() ? 'border-rosso-400' : ''}`}
                    placeholder="Ex: Coleta Seletiva de Lixo Reciclável"
                    autoFocus
                  />
                  {tentouProximo && !dadosFormulario.theme.trim() && (
                    <p className="text-xs text-rosso-500 mt-1">Campo obrigatório.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="objective" className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-1.5">Objetivo Principal</label>
                  <textarea
                    id="objective"
                    value={dadosFormulario.objective}
                    onChange={e => atualizar('objective', e.target.value)}
                    className={`input-field min-h-[80px] resize-none ${tentouProximo && !dadosFormulario.objective.trim() ? 'border-rosso-400' : ''}`}
                    placeholder="Descreva o objetivo principal desta proposição..."
                  />
                  {tentouProximo && !dadosFormulario.objective.trim() && (
                    <p className="text-xs text-rosso-500 mt-1">Campo obrigatório.</p>
                  )}
                </div>
                <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-[#232745] rounded-lg border border-primary-100 dark:border-[#3d4270]">
                  <Scale className="text-primary-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-primary-600 dark:text-slate-300">Objetivos claros facilitam a análise de competência e a redação da minuta.</p>
                </div>
              </div>
            )}

            {/* Passo 2 */}
            {etapaAtual === 2 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-2">A matéria é de competência municipal?</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Sim, exclusiva', 'Sim, concorrente', 'Não tenho certeza'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => atualizar('competence', option)}
                      className={`flex items-center justify-between text-left p-4 border-2 rounded-xl transition-all duration-200
                        ${dadosFormulario.competence === option
                          ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]'
                          : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-300 dark:hover:border-[#3d4270]'
                        }`}
                    >
                      <span className="font-medium text-primary-800 dark:text-slate-200 text-sm">{option}</span>
                      {dadosFormulario.competence === option && <Check size={16} className="text-primary-600" />}
                    </button>
                  ))}
                </div>
                {dadosFormulario.competence === 'Não tenho certeza' && (
                  <div className="flex items-start gap-3 p-4 bg-oro-50 border border-oro-200 rounded-xl">
                    <AlertCircle className="text-oro-500 mt-0.5 flex-shrink-0" size={18} />
                    <p className="text-sm text-oro-800">O assistente jurídico consultará a Lei Orgânica do Município para verificar a competência.</p>
                  </div>
                )}
              </div>
            )}

            {/* Passo 3 */}
            {etapaAtual === 3 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-2">Esta proposição tem impacto orçamentário?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: true, label: 'Sim', desc: 'Gera despesas ou afeta receitas' }, { value: false, label: 'Não', desc: 'Sem impacto financeiro direto' }].map(({ value, label, desc }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => atualizar('hasFinancialImpact', value)}
                      className={`text-left p-5 border-2 rounded-xl transition-all duration-200
                        ${dadosFormulario.hasFinancialImpact === value
                          ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]'
                          : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-300 dark:hover:border-[#3d4270]'
                        }`}
                    >
                      <h3 className="font-display font-bold text-primary-800 dark:text-slate-100 mb-1">{label}</h3>
                      <p className="text-xs text-primary-500 dark:text-slate-400">{desc}</p>
                    </button>
                  ))}
                </div>
                {dadosFormulario.hasFinancialImpact && (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-1.5">Estimativa de Impacto (R$)</label>
                    <input
                      type="text"
                      value={dadosFormulario.estimatedImpact}
                      onChange={e => atualizar('estimatedImpact', e.target.value)}
                      className="input-field"
                      placeholder="Ex: 150.000,00"
                    />
                    <p className="text-xs text-primary-400 dark:text-slate-500 mt-1">Necessário anexar estimativa de impacto orçamentário-financeiro</p>
                  </div>
                )}
              </div>
            )}

            {/* Passo 4 */}
            {etapaAtual === 4 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="justification" className="block text-sm font-medium text-primary-700 dark:text-slate-300">Justificativa da Proposição</label>
                    <span className={`text-xs font-medium ${tamanhoJustificativa >= 50 ? 'text-primary-600' : 'text-primary-400 dark:text-slate-500'}`}>
                      {tamanhoJustificativa} / mín. 50
                    </span>
                  </div>
                  <textarea
                    id="justification"
                    value={dadosFormulario.justification}
                    onChange={e => atualizar('justification', e.target.value)}
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Fundamente a necessidade e relevância desta proposição..."
                    autoFocus
                  />
                  <div className="mt-1.5 w-full bg-primary-100 dark:bg-[#232745] rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${tamanhoJustificativa >= 50 ? 'bg-primary-500' : 'bg-oro-500'}`}
                      style={{ width: `${Math.min((tamanhoJustificativa / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-[#232745] rounded-lg border border-primary-100 dark:border-[#3d4270]">
                  <Scale className="text-primary-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-primary-600 dark:text-slate-300">O assistente irá sugerir melhorias e citações normativas relevantes para fortalecer sua argumentação.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={etapaAnterior}
            disabled={etapaAtual === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
              ${etapaAtual === 0 ? 'text-primary-300 dark:text-slate-600 cursor-not-allowed' : 'text-primary-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-[#232745]'}`}
          >
            <ArrowLeft size={18} />
            Anterior
          </button>

          {/* Motivo de bloqueio */}
          {motivoBloqueio && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg"
            >
              <Info size={13} />
              {motivoBloqueio}
            </motion.div>
          )}

          {etapaAtual < steps.length - 1 ? (
            <button
              onClick={proximaEtapa}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                ${podeAvancar()
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                  : 'bg-primary-100 dark:bg-[#232745] text-primary-400 dark:text-slate-500 hover:bg-primary-200 dark:hover:bg-[#2d3158]'
                }`}
            >
              Próximo
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={aoFinalizar}
              disabled={enviando}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${podeAvancar() && !enviando
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg'
                  : 'bg-primary-100 dark:bg-[#232745] text-primary-300 dark:text-slate-600 cursor-not-allowed'
                }`}
            >
              <Check size={18} />
              {enviando ? 'Gerando...' : 'Gerar Minuta'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CriarMinuta
