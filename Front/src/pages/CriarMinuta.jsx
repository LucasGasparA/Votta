import { useState, useEffect } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  FileCheck2,
  FileText,
  Info,
  Landmark,
  Lightbulb,
  PenLine,
  Scale,
  ScrollText,
  Search,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'

const STORAGE_KEY = 'votta:wizard'

const DADOS_INICIAIS = { type: '', theme: '', objective: '', competence: '', hasFinancialImpact: null, estimatedImpact: '', justification: '' }

function lerWizardSalvo() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const COMPETENCE_OPTIONS = [
  {
    value: 'exclusiva',
    label: 'Sim, com certeza',
    description: 'Este assunto é responsabilidade da Câmara Municipal (ex: transporte local, limpeza urbana, iluminação pública).',
  },
  {
    value: 'concorrente',
    label: 'Em parte',
    description: 'O município compartilha responsabilidade com Estado ou União (ex: saúde, educação, meio ambiente).',
  },
  {
    value: 'incerto',
    label: 'Não tenho certeza',
    description: 'O assistente jurídico vai verificar automaticamente com base na Lei Orgânica e na CF/88.',
  },
]

const GENERATION_STEPS = [
  { Icon: ClipboardList, text: 'Registrando a proposição...' },
  { Icon: Search,        text: 'Analisando competência municipal...' },
  { Icon: Scale,         text: 'Consultando a Lei Orgânica Municipal...' },
  { Icon: PenLine,       text: 'Redigindo ementa e preâmbulo...' },
  { Icon: ScrollText,    text: 'Estruturando os artigos...' },
  { Icon: FileCheck2,    text: 'Finalizando a minuta...' },
]

const PROPOSAL_TYPES = [
  {
    value: 'pl_ordinaria',
    label: 'Projeto de Lei Ordinária',
    description: 'Lei municipal de competência do município, aprovada por maioria simples.',
    Icon: ScrollText,
  },
  {
    value: 'pl_complementar',
    label: 'Projeto de Lei Complementar',
    description: 'Complementa a Lei Orgânica em matérias específicas, com quórum qualificado.',
    Icon: BookOpen,
  },
  {
    value: 'decreto',
    label: 'Decreto Municipal',
    description: 'Ato do Executivo para regulamentar leis e organizar a administração.',
    Icon: Landmark,
  },
  {
    value: 'indicacao',
    label: 'Indicação',
    description: 'Sugestão ao Executivo para melhorias, obras ou serviços públicos.',
    Icon: Lightbulb,
  },
]

const CriarMinuta = () => {
  const [tooltip, setTooltip] = useState(null) // { value, x, y }
  const navigate = useNavigate()
  const { municipioSelecionado } = useOutletContext() ?? {}

  useEffect(() => {
    if (!municipioSelecionado) {
      toast.error('Selecione um município antes de criar uma proposição.')
      navigate('/selecionar-municipio')
    }
  }, [municipioSelecionado, navigate])

  const wizardSalvo = lerWizardSalvo()
  const [etapaAtual, setEtapaAtual]           = useState(wizardSalvo?.etapa ?? 0)
  const [direcao, setDirecao]                 = useState(1)
  const [enviando, setEnviando]               = useState(false)
  const [tentouProximo, setTentouProximo]     = useState(false)
  const [gerando, setGerando]                 = useState(false)
  const [etapaGeracao, setEtapaGeracao]       = useState(0)
  const [exibirModalCancelar, setExibirModalCancelar] = useState(false)
  const [dadosFormulario, setDadosFormulario] = useState(wizardSalvo?.dados ?? DADOS_INICIAIS)

  const steps = [
    { id: 0, title: 'Tipo de Proposição',    short: 'Tipo',         description: 'Escolha o tipo de documento legislativo' },
    { id: 1, title: 'Tema e Objetivo',       short: 'Tema',         description: 'Defina o assunto e objetivo' },
    { id: 2, title: 'Competência e Impacto', short: 'Competência',  description: 'Competência municipal e impacto orçamentário' },
    { id: 3, title: 'Justificativa',         short: 'Justificativa',description: 'Fundamente a proposição' },
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
      case 2: return dadosFormulario.competence !== '' && dadosFormulario.hasFinancialImpact !== null
      case 3: return dadosFormulario.justification.length >= 50
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
      case 2:
        if (!dadosFormulario.competence)                    return 'Selecione a competência municipal.'
        if (dadosFormulario.hasFinancialImpact === null)    return 'Informe se esta proposição tem impacto orçamentário.'
        return null
      case 3: return `A justificativa precisa ter pelo menos 50 caracteres. (${dadosFormulario.justification.length}/50)`
      default: return null
    }
  }

  const aoFinalizar = async () => {
    if (enviando || !podeAvancar()) return
    setEnviando(true)
    setGerando(true)
    setEtapaGeracao(0)

    const stepInterval = setInterval(() => {
      setEtapaGeracao(s => Math.min(s + 1, GENERATION_STEPS.length - 1))
    }, 3000)

    try {
      const data = await api.post('/proposals', {
        ...dadosFormulario,
        municipalityId: municipioSelecionado?.id,
      })

      await api.post('/ai/generate', { proposalId: data.id })

      clearInterval(stepInterval)
      setEtapaGeracao(GENERATION_STEPS.length - 1)

      await new Promise(r => setTimeout(r, 800))

      try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
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

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ dados: dadosFormulario, etapa: etapaAtual })) } catch { /* noop */ }
  }, [dadosFormulario, etapaAtual])

  const tamanhoJustificativa      = dadosFormulario.justification.length
  const percentualProgresso  = (etapaAtual / (steps.length - 1)) * 100
  const motivoBloqueio  = tentouProximo ? obterMotivoBloqueio() : null

  if (gerando) {
    const step = GENERATION_STEPS[etapaGeracao]
    const StepIcon = step.Icon
    const pct  = Math.round(((etapaGeracao + 1) / GENERATION_STEPS.length) * 100)
    return (
      <div className="fixed inset-0 bg-primary-50 dark:bg-[#141624] flex flex-col items-center justify-center p-6 z-50">
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
                className="text-primary-600"
                aria-hidden="true"
              >
                <StepIcon size={34} strokeWidth={1.8} />
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
    <div className="min-h-full bg-slate-50/70 dark:bg-[#141624] px-6 py-5">
      <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Etapa {etapaAtual + 1} de {steps.length}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {steps[etapaAtual].title}
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{steps[etapaAtual].description}</p>
          </div>
          <button
            onClick={() => {
              const sujo = dadosFormulario.type !== '' || dadosFormulario.theme !== '' ||
                dadosFormulario.objective !== '' || dadosFormulario.competence !== '' ||
                dadosFormulario.hasFinancialImpact !== null || dadosFormulario.justification !== ''
              if (sujo) setExibirModalCancelar(true)
              else navigate('/painel')
            }}
            className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-1"
          >
            <X size={15} />
            Cancelar
          </button>
        </motion.div>

        {/* Stepper horizontal */}
        <div className="flex items-start">
          {steps.map((step, index) => (
            <div key={step.id} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => index < etapaAtual && setEtapaAtual(index)}
                  disabled={index >= etapaAtual}
                  aria-current={index === etapaAtual ? 'step' : undefined}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${index < etapaAtual
                      ? 'bg-primary-600 text-white cursor-pointer hover:bg-primary-700'
                      : index === etapaAtual
                        ? 'border-2 border-primary-600 text-primary-600 bg-white dark:bg-[#141624]'
                        : 'border-2 border-slate-200 dark:border-[#2d3158] text-slate-300 dark:text-slate-600 bg-white dark:bg-[#141624] cursor-default'
                    }`}
                >
                  {index < etapaAtual ? <Check size={12} /> : index + 1}
                </button>
                <span className={`hidden sm:block text-[10px] mt-1 text-center w-16 leading-tight transition-all
                  ${index === etapaAtual ? 'text-primary-700 dark:text-slate-200 font-semibold' : index < etapaAtual ? 'text-slate-400 dark:text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>
                  {step.short}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 sm:mb-5 transition-all duration-500
                  ${index < etapaAtual ? 'bg-primary-400' : 'bg-slate-200 dark:bg-[#2d3158]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={etapaAtual}
          initial={{ opacity: 0, x: direcao * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direcao * -30 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:bg-[#1c1f38] dark:border-[#2d3158] mb-4"
        >

            {/* Passo 0 */}
            {etapaAtual === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {PROPOSAL_TYPES.map(type => {
                  const TypeIcon = type.Icon
                  const selected = dadosFormulario.type === type.value
                  return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => { atualizar('type', type.value); setTentouProximo(false) }}
                    className={`text-left p-5 border-2 rounded-xl transition-all duration-200 flex items-center gap-4
                      ${selected ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]' : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-300 dark:hover:border-[#3d4270]'}`}
                  >
                    <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-[#232745] dark:text-slate-300'}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">{type.label}</h3>
                        <button
                          type="button"
                          className="flex-shrink-0 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                          onClick={e => e.stopPropagation()}
                          onMouseEnter={e => {
                            const r = e.currentTarget.getBoundingClientRect()
                            setTooltip({ value: type.value, x: r.left + r.width / 2, y: r.top })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <Info size={13} />
                        </button>
                      </div>
                      {selected && (
                        <div className="mt-1 flex items-center gap-1 text-primary-600">
                          <Check size={12} />
                          <span className="text-xs font-medium">Selecionado</span>
                        </div>
                      )}
                    </div>
                  </button>
                  )
                })}
              </div>
            )}

            {/* Passo 1 */}
            {etapaAtual === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="theme" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-0.5">
                    Tema da Proposição
                  </label>
                  <p className="text-xs text-slate-300 dark:text-slate-600 mb-1.5">Descreva em poucas palavras o assunto central da proposição.</p>
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
                  <label htmlFor="objective" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-0.5">
                    Objetivo Principal
                  </label>
                  <div className="flex items-start gap-2.5 p-3 bg-primary-50 dark:bg-[#232745] rounded-lg border border-primary-100 dark:border-[#3d4270] mb-1.5">
                    <Scale className="text-slate-300 dark:text-slate-600 mt-0.5 flex-shrink-0" size={14} />
                    <p className="text-xs text-slate-400 dark:text-slate-500">Objetivos claros facilitam a análise de competência e a redação da minuta.</p>
                  </div>
                  <textarea
                    id="objective"
                    value={dadosFormulario.objective}
                    onChange={e => atualizar('objective', e.target.value)}
                    className={`input-field min-h-[80px] resize-none ${tentouProximo && !dadosFormulario.objective.trim() ? 'border-rosso-400' : ''}`}
                    placeholder="Ex: Instituir um programa municipal de coleta seletiva com pontos de entrega voluntária"
                  />
                  {tentouProximo && !dadosFormulario.objective.trim() && (
                    <p className="text-xs text-rosso-500 mt-1">Campo obrigatório.</p>
                  )}
                </div>
              </div>
            )}

            {/* Passo 2 — Competência + Impacto (unificado) */}
            {etapaAtual === 2 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm font-medium text-primary-700 dark:text-slate-300">A matéria é de competência municipal?</label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {COMPETENCE_OPTIONS.map(({ value, label, description }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => atualizar('competence', value)}
                        className={`flex items-center justify-between text-left p-4 border-2 rounded-xl transition-all duration-200
                          ${dadosFormulario.competence === value
                            ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]'
                            : 'border-slate-200 dark:border-[#2d3158] hover:border-primary-300 dark:hover:border-[#3d4270]'
                          }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{label}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{description}</p>
                        </div>
                        {dadosFormulario.competence === value && (
                          <Check size={16} className="text-primary-600 flex-shrink-0 ml-3" />
                        )}
                      </button>
                    ))}
                  </div>
                  {dadosFormulario.competence === 'Não tenho certeza' && (
                    <div className="flex items-start gap-3 p-3 mt-2 bg-oro-50 border border-oro-200 rounded-xl">
                      <AlertCircle className="text-oro-500 mt-0.5 flex-shrink-0" size={16} />
                      <p className="text-xs text-oro-800">O assistente jurídico verificará a competência automaticamente.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-primary-100 dark:border-[#2d3158] pt-5">
                  <label className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-3">Esta proposição tem impacto orçamentário?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ value: true, label: 'Sim', desc: 'Gera despesas ou afeta receitas' }, { value: false, label: 'Não', desc: 'Sem impacto financeiro direto' }].map(({ value, label, desc }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => atualizar('hasFinancialImpact', value)}
                        className={`text-left p-4 border-2 rounded-xl transition-all duration-200
                          ${dadosFormulario.hasFinancialImpact === value
                            ? 'border-primary-500 bg-primary-50 dark:bg-[#232745]'
                            : 'border-primary-100 dark:border-[#2d3158] hover:border-primary-300 dark:hover:border-[#3d4270]'
                          }`}
                      >
                        <p className="font-semibold text-primary-800 dark:text-slate-100 text-sm mb-0.5">{label}</p>
                        <p className="text-xs text-primary-500 dark:text-slate-400">{desc}</p>
                      </button>
                    ))}
                  </div>
                  {dadosFormulario.hasFinancialImpact && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-primary-700 dark:text-slate-300 mb-1.5">Estimativa de Impacto (R$)</label>
                      <input
                        type="text"
                        value={dadosFormulario.estimatedImpact}
                        onChange={e => atualizar('estimatedImpact', e.target.value)}
                        className="input-field"
                        placeholder="Ex: 150.000,00"
                      />
                      <p className="text-xs text-primary-400 dark:text-slate-500 mt-1">Será necessário anexar estimativa de impacto orçamentário-financeiro</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Passo 3 — Justificativa */}
            {etapaAtual === 3 && (
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

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3 pb-6">
            <button
              onClick={etapaAnterior}
              disabled={etapaAtual === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${etapaAtual === 0 ? 'text-primary-300 dark:text-slate-600 cursor-not-allowed' : 'text-primary-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-[#232745]'}`}
            >
              <ArrowLeft size={16} />
              Anterior
            </button>

            {motivoBloqueio && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg"
              >
                <Info size={12} />
                {motivoBloqueio}
              </motion.div>
            )}

            {etapaAtual < steps.length - 1 ? (
              <button
                onClick={proximaEtapa}
                disabled={!podeAvancar()}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all
                  ${podeAvancar() ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md font-semibold' : 'bg-slate-100 dark:bg-[#232745] text-slate-300 dark:text-slate-600 cursor-not-allowed font-medium'}`}
              >
                Próximo
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={aoFinalizar}
                disabled={enviando}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all
                  ${podeAvancar() && !enviando ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm' : 'bg-primary-100 dark:bg-[#232745] text-primary-300 dark:text-slate-600 cursor-not-allowed'}`}
              >
                <Check size={16} />
                {enviando ? 'Gerando...' : 'Gerar Minuta'}
              </button>
            )}
          </div>

      </div>{/* fim max-w */}

      {/* Tooltip global — posicionado próximo ao ícone, escapa do overflow dos cards */}
      <AnimatePresence>
        {tooltip && (() => {
          const t = PROPOSAL_TYPES.find(p => p.value === tooltip.value)
          return t ? (
            <motion.div
              key={tooltip.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
              className="fixed z-50 w-64 bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl leading-relaxed pointer-events-none"
            >
              {t.description}
            </motion.div>
          ) : null
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {exibirModalCancelar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-[#1c1f38] rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="w-12 h-12 bg-oro-50 dark:bg-oro-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={22} className="text-oro-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-primary-800 dark:text-slate-100 text-center mb-2">
                Cancelar preenchimento?
              </h2>
              <p className="text-sm text-primary-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                Os dados preenchidos serão perdidos. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setExibirModalCancelar(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-primary-200 dark:border-[#3d4270]
                    text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all"
                >
                  Continuar
                </button>
                <button
                  onClick={() => navigate('/painel')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-rosso-500 text-white
                    hover:bg-rosso-600 active:scale-[0.97] transition-all"
                >
                  Sim, cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CriarMinuta
