import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Save, Download, MessageSquare, AlertTriangle, CheckCircle,
  FileText, Scale, ExternalLink, Send, ArrowLeft,
  BookOpen, List, Calendar, Minus, AlignLeft,
  Clock, RotateCcw, X, ClipboardCheck, Bold, Italic, ListOrdered,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'
import { exportToPDF } from '../utils/exportPdf.js'

const SECTIONS = [
  { id: 'ementa',    label: 'Ementa',    icon: AlignLeft,  hint: 'A ementa resume de forma clara e objetiva o conteúdo da proposição.' },
  { id: 'preambulo', label: 'Preâmbulo', icon: BookOpen,   hint: 'Fórmula legislativa padrão conforme LOM.' },
  { id: 'artigos',   label: 'Artigos',   icon: List,       hint: null },
  { id: 'vigencia',  label: 'Vigência',  icon: Calendar,   hint: null },
  { id: 'revogacao', label: 'Revogação', icon: Minus,      hint: null },
]

const ASSISTANT_SUGGESTIONS = [
  { type: 'citation',    text: 'LOM, Art. 145, VI: "Compete ao Município proteger o meio ambiente e combater a poluição em qualquer de suas formas."', action: 'Ver citação' },
  { type: 'improvement', text: 'Sugestão: Incluir artigo definindo prazo para implementação gradual do programa.', action: 'Aplicar sugestão' },
  { type: 'alert',       text: 'Programas com impacto orçamentário requerem anexo com estimativa de custos conforme LRF.', action: 'Ver detalhes' },
]

const PROPOSAL_TYPE_LABELS = {
  pl_ordinaria:    'Projeto de Lei Ordinária',
  pl_complementar: 'Projeto de Lei Complementar',
  decreto:         'Decreto Municipal',
  indicacao:       'Indicação',
}

const UNCERTAINTY_PATTERNS = [
  'não encontrei', 'não há referência', 'não tenho informação suficiente',
  'consulte a procuradoria', 'não localizei', 'sem base normativa',
  'não é possível confirmar', 'recomendo consultar', 'não tenho certeza',
  'incerto', 'não identifico base',
]

function detectUncertainty(text) {
  const lower = text.toLowerCase()
  return UNCERTAINTY_PATTERNS.some(p => lower.includes(p))
}

function hasCitation(text) {
  return /art\.|lom\b|cf\b|lei\s|§\s|\binciso\b|\balínea\b/i.test(text)
}

function formatVersionDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Aplica formatação no textarea: envolve seleção com prefixo/sufixo
function applyFormat(ref, prefix, suffix = prefix) {
  const el = ref.current
  if (!el) return
  const { selectionStart: s, selectionEnd: e, value } = el
  const selected = value.slice(s, e)
  const newVal   = value.slice(0, s) + prefix + (selected || 'texto') + suffix + value.slice(e)
  const newPos   = s + prefix.length + (selected || 'texto').length + suffix.length
  el.value = newVal
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.setSelectionRange(newPos, newPos)
  el.focus()
}

const ProposalEditor = () => {
  const { id } = useParams()
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [isDirty, setIsDirty]                   = useState(false)
  const [proposalTitle, setProposalTitle]       = useState('Proposição')
  const [proposalType, setProposalType]         = useState('')
  const [activeSection, setActiveSection]       = useState('ementa')
  const [showAssistant, setShowAssistant]       = useState(true)
  const [assistantMessage, setAssistantMessage] = useState('')
  const [chatHistory, setChatHistory]           = useState([])
  const [chatLoading, setChatLoading]           = useState(false)
  const [uncertaintyBanner, setUncertaintyBanner] = useState(null)

  const [showVersionsModal, setShowVersionsModal] = useState(false)
  const [versions, setVersions]                   = useState([])
  const [versionsLoading, setVersionsLoading]     = useState(false)
  const [selectedVersion, setSelectedVersion]     = useState(null)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportReviewed, setExportReviewed]   = useState(false)

  const chatEndRef      = useRef(null)
  const activeTextareaRef = useRef(null)

  const [doc, setDoc] = useState({
    ementa:    'Dispõe sobre a criação do Programa Municipal de Coleta Seletiva de Resíduos Recicláveis.',
    preambulo: 'O Prefeito Municipal, faz saber que a Câmara aprovou a seguinte Lei:',
    artigos:   [],
    vigencia:  'Entra em vigor na data de sua publicação.',
    revogacao: 'Revogam-se as disposições em contrário.',
  })

  const [validations] = useState([
    { type: 'success', message: 'Competência municipal verificada — Art. 145, VI da LOM' },
    { type: 'success', message: 'Estrutura conforme técnica legislativa' },
    { type: 'warning', message: 'Recomenda-se anexar estimativa de impacto orçamentário' },
  ])

  useEffect(() => {
    api.get('/proposals/' + id)
      .then(data => {
        if (data.title) setProposalTitle(data.title)
        if (data.type)  setProposalType(data.type)
        if (data.content && data.content !== '{}') {
          try { setDoc(JSON.parse(data.content)) } catch { /* mantém padrão */ }
        }
      })
      .catch(() => toast.error('Não foi possível carregar a proposição.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const docRef = useRef(doc)
  useEffect(() => { docRef.current = doc }, [doc])

  const setDocDirty = (updater) => {
    setDoc(updater)
    setIsDirty(true)
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await api.put('/proposals/' + id, { content: JSON.stringify(docRef.current) })
      setIsDirty(false)
      toast.success('Salvo!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }, [id])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  const loadVersions = async () => {
    setVersionsLoading(true)
    try {
      const data = await api.get('/proposals/' + id + '/versions')
      setVersions(data)
    } catch {
      toast.error('Não foi possível carregar o histórico de versões.')
    } finally {
      setVersionsLoading(false)
    }
  }

  const openVersionsModal = () => {
    setShowVersionsModal(true)
    setSelectedVersion(null)
    loadVersions()
  }

  const restoreVersion = (version) => {
    try {
      const restored = JSON.parse(version.content)
      setDoc(restored)
      setIsDirty(true)
      setShowVersionsModal(false)
      toast.success(`Versão ${version.versionNumber} restaurada. Salve para confirmar.`)
    } catch {
      toast.error('Não foi possível restaurar esta versão.')
    }
  }

  const handleAskAssistant = async () => {
    const msg = assistantMessage.trim()
    if (!msg || chatLoading) return
    setAssistantMessage('')
    setChatHistory(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await api.post('/ai/chat', {
        proposalId: id,
        message: msg,
        promptContext: JSON.stringify(docRef.current),
      })
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.text, hasCit: hasCitation(res.text) }])
      if (detectUncertainty(res.text)) {
        setUncertaintyBanner('Não encontrei referência normativa clara para este ponto. Consulte a Procuradoria antes de prosseguir.')
      }
    } catch (e) {
      const isTimeout = e.message?.toLowerCase().includes('demorou') || e.message?.toLowerCase().includes('timeout')
      setChatHistory(prev => [...prev, {
        role: 'error',
        text: isTimeout
          ? 'O assistente demorou para responder. Tente novamente.'
          : 'Nosso assistente está temporariamente indisponível. Tente em alguns minutos.',
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const addArticle = () => {
    const n = doc.artigos.length + 1
    setDocDirty(prev => ({
      ...prev,
      artigos: [...prev.artigos, { id: n, numero: `Art. ${n}º`, texto: '', citacoes: [] }],
    }))
  }

  const updateArticle = (artId, newText) => {
    setDocDirty(prev => ({
      ...prev,
      artigos: prev.artigos.map(a => a.id === artId ? { ...a, texto: newText } : a),
    }))
  }

  const pendingAlerts  = validations.filter(v => v.type === 'warning' || v.type === 'error')
  const usedCitations  = [
    ...ASSISTANT_SUGGESTIONS.filter(s => s.type === 'citation').map(s => s.text),
    ...doc.artigos.flatMap(a => a.citacoes || []),
  ]

  const handleExportClick = () => { setExportReviewed(false); setShowExportModal(true) }
  const confirmExport = () => {
    setShowExportModal(false)
    toast.promise(
      exportToPDF(proposalTitle, docRef.current),
      { loading: 'Gerando PDF...', success: 'PDF exportado!', error: 'Erro ao gerar PDF' }
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="flex items-center gap-3 text-primary-500">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Carregando editor...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50 print:bg-white">
      {/* Top Bar */}
      <div className="bg-white border-b border-primary-200 px-6 py-3 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="text-primary-400 hover:text-primary-600 transition-colors flex-shrink-0">
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-base font-display font-bold text-primary-800 truncate">{proposalTitle}</h1>
              {isDirty && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  title="Alterações não salvas"
                  className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"
                />
              )}
            </div>
          </div>

          {/* Toolbar de formatação */}
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-lg border border-primary-100">
            {[
              { icon: Bold,        title: 'Negrito',   prefix: '**', suffix: '**' },
              { icon: Italic,      title: 'Itálico',   prefix: '_',  suffix: '_'  },
              { icon: ListOrdered, title: 'Numeração', prefix: '1. ',suffix: ''   },
            ].map(({ icon: Icon, title, prefix, suffix }) => (
              <button
                key={title}
                title={title}
                onClick={() => applyFormat(activeTextareaRef, prefix, suffix)}
                className="p-1.5 rounded text-primary-500 hover:bg-white hover:text-primary-700 hover:shadow-sm transition-all"
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-primary-400 hidden lg:block">Ctrl+S</span>
            <button onClick={openVersionsModal} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 border border-primary-200 rounded-lg transition-all">
              <Clock size={14} />
              <span className="hidden md:inline">Versões</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 border border-primary-200 rounded-lg transition-all disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button
              onClick={handleExportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-[0.97] transition-all shadow-sm"
            >
              <Download size={14} />
              <span className="hidden md:inline">Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex print:block">
        {/* Main Editor */}
        <div className={`flex-1 p-6 transition-all duration-300 ${showAssistant ? 'mr-96' : ''} print:hidden`}>

          {/* Banner de incerteza */}
          <AnimatePresence>
            {uncertaintyBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl mb-5"
              >
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-amber-800 flex-1">{uncertaintyBanner}</p>
                <button onClick={() => setUncertaintyBanner(null)} className="text-amber-400 hover:text-amber-600">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seção Nav */}
          <div className="card p-3 mb-5">
            <div className="flex items-center gap-1 overflow-x-auto">
              {SECTIONS.map(({ id: sId, label, icon: Icon }) => (
                <button
                  key={sId}
                  onClick={() => setActiveSection(sId)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all active:scale-[0.97]
                    ${activeSection === sId ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-500 hover:bg-primary-50 hover:text-primary-700'}`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Validações */}
          <div className="space-y-2 mb-5">
            {validations.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-3 rounded-lg border-l-4 flex items-center gap-2.5 ${
                  v.type === 'success' ? 'bg-green-50 border-green-500' : v.type === 'warning' ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-500'
                }`}
              >
                {v.type === 'success'
                  ? <CheckCircle className="text-green-600 flex-shrink-0" size={15} />
                  : <AlertTriangle className={v.type === 'warning' ? 'text-amber-500 flex-shrink-0' : 'text-red-600 flex-shrink-0'} size={15} />
                }
                <p className={`text-xs ${v.type === 'success' ? 'text-green-800' : v.type === 'warning' ? 'text-amber-800' : 'text-red-800'}`}>{v.message}</p>
              </motion.div>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="card p-8">
            {(() => {
              const section = SECTIONS.find(s => s.id === activeSection)
              const Icon = section?.icon ?? FileText
              return (
                <div className="flex items-center gap-2 mb-5">
                  <Icon size={20} className="text-primary-400" />
                  <h2 className="text-xl font-display font-bold text-primary-800">{section?.label}</h2>
                </div>
              )
            })()}

            {activeSection === 'ementa' && (
              <div>
                <textarea ref={activeTextareaRef} value={doc.ementa}
                  onChange={e => setDocDirty(p => ({ ...p, ementa: e.target.value }))}
                  className="input-field min-h-[90px] font-serif resize-none" placeholder="Resumo do objeto da lei..." />
                <p className="text-xs text-primary-400 mt-2">A ementa resume de forma clara e objetiva o conteúdo da proposição.</p>
              </div>
            )}

            {activeSection === 'preambulo' && (
              <div>
                <textarea ref={activeTextareaRef} value={doc.preambulo}
                  onChange={e => setDocDirty(p => ({ ...p, preambulo: e.target.value }))}
                  className="input-field min-h-[90px] font-serif resize-none" placeholder="Texto introdutório..." />
                <p className="text-xs text-primary-400 mt-2">Fórmula legislativa padrão conforme LOM.</p>
              </div>
            )}

            {activeSection === 'artigos' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-primary-500">{doc.artigos.length} artigo(s)</p>
                  <button onClick={addArticle}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 active:scale-[0.97] transition-all">
                    + Adicionar Artigo
                  </button>
                </div>
                {doc.artigos.length === 0 ? (
                  <div className="text-center py-10 text-primary-400">
                    <List size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhum artigo ainda. Clique em "+ Adicionar Artigo".</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doc.artigos.map(artigo => (
                      <div key={artigo.id} className="border border-primary-100 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                          <span className="px-2.5 py-1 bg-primary-100 text-primary-700 font-bold text-sm rounded flex-shrink-0 mt-1">{artigo.numero}</span>
                          <div className="flex-1">
                            <textarea value={artigo.texto} onChange={e => updateArticle(artigo.id, e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-primary-100 rounded-lg focus:border-primary-400 focus:outline-none font-serif text-sm min-h-[80px] resize-none transition-colors"
                              placeholder="Texto do artigo..." />
                            {artigo.citacoes?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {artigo.citacoes.map((c, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-oro-100 text-oro-800 text-xs rounded-full">
                                    <Scale size={10} />{c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'vigencia' && (
              <textarea ref={activeTextareaRef} value={doc.vigencia}
                onChange={e => setDocDirty(p => ({ ...p, vigencia: e.target.value }))}
                className="input-field min-h-[80px] font-serif resize-none" placeholder="Cláusula de vigência..." />
            )}

            {activeSection === 'revogacao' && (
              <textarea ref={activeTextareaRef} value={doc.revogacao}
                onChange={e => setDocDirty(p => ({ ...p, revogacao: e.target.value }))}
                className="input-field min-h-[80px] font-serif resize-none" placeholder="Cláusula revogatória..." />
            )}
          </div>
        </div>

        {/* ── Sidebar Assistente ── */}
        {showAssistant && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed right-0 top-0 w-96 h-screen bg-white border-l border-primary-200 shadow-2xl flex flex-col print:hidden"
            style={{ minWidth: 320, maxWidth: 400 }}
          >
            <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm">Assistente Jurídico</h3>
                    <p className="text-xs text-primary-200">Citações normativas em tempo real</p>
                  </div>
                </div>
                <button onClick={() => setShowAssistant(false)} className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sugestões estáticas */}
            <div className="p-4 space-y-2 border-b border-primary-100 flex-shrink-0">
              {ASSISTANT_SUGGESTIONS.map((s, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 text-xs ${
                  s.type === 'citation' ? 'bg-oro-50 border-oro-400' : s.type === 'improvement' ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-400'
                }`}>
                  <p className="text-primary-700 mb-2 leading-relaxed">{s.text}</p>
                  <button className="flex items-center gap-1 text-primary-500 hover:text-primary-700 font-medium transition-colors">
                    <ExternalLink size={11} />{s.action}
                  </button>
                </div>
              ))}
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Estado 1: Aguardando */}
              {chatHistory.length === 0 && !chatLoading && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center mb-3">
                    <Scale size={20} className="text-primary-300" />
                  </div>
                  <p className="text-sm font-medium text-primary-500 mb-1">Assistente aguardando</p>
                  <p className="text-xs text-primary-300 leading-relaxed max-w-[180px]">
                    Pergunte sobre competências, constitucionalidade ou citações legais
                  </p>
                </div>
              )}

              {chatHistory.map((msg, i) => {
                if (msg.role === 'user') {
                  return (
                    <div key={i} className="bg-primary-600 text-white rounded-xl p-3 text-xs ml-6 leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )
                }
                if (msg.role === 'error') {
                  return (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs mr-6 leading-relaxed">
                      <p className="text-amber-600 font-semibold mb-1 text-[10px] uppercase tracking-wide">Aviso</p>
                      <p className="text-amber-800">{msg.text}</p>
                    </div>
                  )
                }
                // Estado 3: Resposta com citação (borda oro) vs resposta simples
                return (
                  <div key={i} className={`rounded-xl p-3 text-xs mr-6 leading-relaxed ${
                    msg.hasCit
                      ? 'bg-oro-50 border-l-4 border-oro-400 text-primary-800'
                      : 'bg-primary-50 text-primary-800'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {msg.hasCit && <Scale size={10} className="text-oro-500 flex-shrink-0" />}
                      <p className={`font-semibold text-[10px] uppercase tracking-wide ${msg.hasCit ? 'text-oro-600' : 'text-primary-400'}`}>
                        {msg.hasCit ? 'Com referência normativa' : 'Assistente'}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )
              })}

              {/* Estado 2: Pensando — skeleton animado */}
              {chatLoading && (
                <div className="bg-primary-50 rounded-xl p-4 mr-6">
                  <div className="space-y-2 mb-2">
                    <div className="h-2.5 bg-primary-200 rounded-full animate-pulse" style={{ width: '75%' }} />
                    <div className="h-2.5 bg-primary-200 rounded-full animate-pulse" style={{ width: '90%', animationDelay: '0.1s' }} />
                    <div className="h-2.5 bg-primary-200 rounded-full animate-pulse" style={{ width: '55%', animationDelay: '0.2s' }} />
                  </div>
                  <p className="text-[10px] text-primary-400">Analisando normativas...</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-primary-100 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assistantMessage}
                  onChange={e => setAssistantMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAskAssistant()}
                  className="flex-1 px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-primary-400 focus:outline-none text-sm transition-colors"
                  placeholder="Faça uma pergunta jurídica..."
                  disabled={chatLoading}
                />
                <button
                  onClick={handleAskAssistant}
                  disabled={chatLoading || !assistantMessage.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-[0.97] transition-all disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!showAssistant && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setShowAssistant(true)}
            className="fixed right-6 bottom-6 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl active:scale-[0.97] transition-all flex items-center justify-center print:hidden"
          >
            <MessageSquare size={22} />
          </motion.button>
        )}
      </div>

      {/* Print layout */}
      <div className="hidden print:block font-serif text-black bg-white p-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Estado de Santa Catarina</h1>
          <h2 className="text-xl font-bold uppercase tracking-wide">Câmara Municipal de Nova Veneza</h2>
          <div className="mt-4 border-t border-black pt-4 text-right w-1/2 ml-auto">
            <p className="italic font-bold">{doc.ementa}</p>
          </div>
        </div>
        <div className="mb-8 text-justify leading-relaxed"><p>{doc.preambulo}</p></div>
        <div className="space-y-6 mb-8 text-justify leading-relaxed">
          {doc.artigos.map(a => (
            <div key={a.id}><span className="font-bold mr-2">{a.numero}</span><span>{a.texto}</span></div>
          ))}
        </div>
        <div className="mb-6 text-justify leading-relaxed"><p>{doc.vigencia}</p></div>
        <div className="mb-12 text-justify leading-relaxed"><p>{doc.revogacao}</p></div>
        <div className="mt-24 text-center">
          <p>Nova Veneza/SC, {new Date().toLocaleDateString('pt-BR')}</p>
          <div className="mt-12 border-t border-black w-64 mx-auto pt-2">
            <p className="font-bold">Assinatura</p>
          </div>
        </div>
      </div>

      {/* ── Modal Versões ── */}
      <AnimatePresence>
        {showVersionsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={e => e.target === e.currentTarget && setShowVersionsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-primary-100">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-primary-500" />
                  <h2 className="text-lg font-display font-bold text-primary-800">Histórico de Versões</h2>
                </div>
                <button onClick={() => setShowVersionsModal(false)} className="text-primary-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div className="w-52 border-r border-primary-100 overflow-y-auto flex-shrink-0 p-2 space-y-1">
                  {versionsLoading ? (
                    <div className="flex items-center justify-center p-8 text-primary-400">
                      <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : versions.length === 0 ? (
                    <p className="text-xs text-primary-400 text-center p-6">Nenhuma versão salva ainda.</p>
                  ) : versions.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersion(v)}
                      className={`w-full text-left px-3 py-3 rounded-xl text-xs transition-all ${selectedVersion?.id === v.id ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 text-primary-700'}`}
                    >
                      <p className="font-bold mb-0.5">Versão {v.versionNumber}</p>
                      <p className={selectedVersion?.id === v.id ? 'text-primary-200' : 'text-primary-400'}>{formatVersionDate(v.createdAt)}</p>
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {!selectedVersion ? (
                    <div className="flex flex-col items-center justify-center h-full text-primary-400">
                      <Clock size={32} className="mb-3 opacity-40" />
                      <p className="text-sm">Selecione uma versão para visualizar</p>
                    </div>
                  ) : (() => {
                    let parsed = null
                    try { parsed = JSON.parse(selectedVersion.content) } catch { /* noop */ }
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-primary-800">Versão {selectedVersion.versionNumber}</h3>
                          <button onClick={() => restoreVersion(selectedVersion)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-[0.97] transition-all">
                            <RotateCcw size={14} /> Restaurar
                          </button>
                        </div>
                        {parsed ? (
                          <div className="space-y-4 text-sm text-primary-700">
                            {parsed.ementa && <div>
                              <p className="text-xs font-bold text-primary-400 uppercase tracking-wide mb-1">Ementa</p>
                              <p className="font-serif leading-relaxed bg-primary-50 rounded-lg p-3">{parsed.ementa}</p>
                            </div>}
                            {parsed.preambulo && <div>
                              <p className="text-xs font-bold text-primary-400 uppercase tracking-wide mb-1">Preâmbulo</p>
                              <p className="font-serif leading-relaxed bg-primary-50 rounded-lg p-3">{parsed.preambulo}</p>
                            </div>}
                            {parsed.artigos?.length > 0 && <div>
                              <p className="text-xs font-bold text-primary-400 uppercase tracking-wide mb-1">Artigos ({parsed.artigos.length})</p>
                              <div className="space-y-2">
                                {parsed.artigos.map((a, i) => (
                                  <div key={i} className="bg-primary-50 rounded-lg p-3 font-serif">
                                    <span className="font-bold mr-2">{a.numero}</span>{a.texto}
                                  </div>
                                ))}
                              </div>
                            </div>}
                          </div>
                        ) : <p className="text-xs text-primary-400">Não foi possível exibir o conteúdo desta versão.</p>}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Export ── */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={e => e.target === e.currentTarget && setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-6 border-b border-primary-100">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={20} className="text-primary-500" />
                  <h2 className="text-lg font-display font-bold text-primary-800">Revisão Final</h2>
                </div>
                <button onClick={() => setShowExportModal(false)} className="text-primary-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-primary-50 rounded-xl p-4">
                  <p className="text-xs text-primary-400 uppercase tracking-wide font-bold mb-1">Proposição</p>
                  <p className="font-bold text-primary-800">{proposalTitle}</p>
                  {proposalType && <p className="text-sm text-primary-500 mt-0.5">{PROPOSAL_TYPE_LABELS[proposalType] || proposalType}</p>}
                </div>
                <div>
                  <p className="text-xs text-primary-400 uppercase tracking-wide font-bold mb-2">Alertas Pendentes ({pendingAlerts.length})</p>
                  {pendingAlerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2.5 text-sm">
                      <CheckCircle size={15} /> Nenhum alerta pendente
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingAlerts.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs">
                          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />{v.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-primary-400 uppercase tracking-wide font-bold mb-2">Citações Utilizadas ({usedCitations.length})</p>
                  {usedCitations.length === 0 ? (
                    <p className="text-xs text-primary-400 italic">Nenhuma citação registrada.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {usedCitations.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-primary-700 bg-oro-50 rounded-lg px-3 py-2">
                          <Scale size={11} className="text-oro-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <label className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-xl transition-all hover:bg-primary-50"
                  style={{ borderColor: exportReviewed ? '#2563eb' : '#e8e8e8' }}>
                  <input type="checkbox" checked={exportReviewed} onChange={e => setExportReviewed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary-600 flex-shrink-0" />
                  <span className="text-sm text-primary-700 leading-relaxed">
                    Confirmo que revisei esta minuta com assessor jurídico e estou ciente dos alertas pendentes.
                  </span>
                </label>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => setShowExportModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-primary-200 text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all">
                  Voltar ao Editor
                </button>
                <button onClick={confirmExport} disabled={!exportReviewed}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{ background: exportReviewed ? '#1e40af' : '#e8e8e8', color: exportReviewed ? '#fff' : '#aaa' }}>
                  <Download size={15} /> Gerar PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProposalEditor
