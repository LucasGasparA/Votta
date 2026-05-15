import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Save, Download, AlertTriangle, CheckCircle,
  FileText, Scale, Send, ArrowLeft,
  BookOpen, List, Calendar, Minus, AlignLeft,
  History, X, ClipboardCheck, Bold, Italic, ListOrdered,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'
import { exportToPDF } from '../utils/exportarPdf.js'
import { exportToDocx } from '../utils/exportarDocx.js'

const SECTIONS = [
  { id: 'ementa',    label: 'Ementa',    icon: AlignLeft,  hint: 'A ementa resume de forma clara e objetiva o conteúdo da proposição.' },
  { id: 'preambulo', label: 'Preâmbulo', icon: BookOpen,   hint: 'Fórmula legislativa padrão conforme LOM.' },
  { id: 'artigos',   label: 'Artigos',   icon: List,       hint: null },
  { id: 'vigencia',  label: 'Vigência',  icon: Calendar,   hint: null },
  { id: 'revogacao', label: 'Revogação', icon: Minus,      hint: null },
]

const STATUS_CONFIG = {
  DRAFT: {
    label:     'Rascunho',
    color:     'bg-primary-100 text-primary-700',
    next:      'REVIEW',
    nextLabel: 'Enviar para revisão',
    nextColor: 'bg-oro-500 hover:bg-oro-600 text-white',
  },
  REVIEW: {
    label:     'Em revisão',
    color:     'bg-oro-100 text-oro-700',
    next:      'APPROVED',
    nextLabel: 'Marcar como aprovada',
    nextColor: 'bg-primary-700 hover:bg-primary-800 text-white',
  },
  APPROVED: {
    label:     'Aprovada',
    color:     'bg-primary-100 text-primary-700',
    next:      null,
    nextLabel: null,
    nextColor: null,
  },
}

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

const QUICK_SUGGESTIONS = {
  pl_ordinaria: [
    'Verifique a constitucionalidade desta proposta',
    'Quais artigos da LOM se aplicam aqui?',
    'Esta lei precisa de estudo de impacto fiscal?',
    'Sugira uma cláusula de vigência adequada',
  ],
  pl_complementar: [
    'Qual o quórum exigido para lei complementar?',
    'Verifique os requisitos formais desta proposta',
    'Esta matéria exige lei complementar?',
    'Sugira artigos de transição adequados',
  ],
  decreto: [
    'O prefeito tem competência para este decreto?',
    'Verifique se não há reserva de lei aqui',
    'Qual a diferença para um decreto regulamentar?',
    'Sugira fundamentos normativos adequados',
  ],
  indicacao: [
    'Quem é o destinatário correto desta indicação?',
    'A câmara tem competência para indicar isto?',
    'Sugira fundamentos normativos para a indicação',
    'Qual o efeito jurídico de uma indicação?',
  ],
}

const DEFAULT_SUGGESTIONS = [
  'Verifique a conformidade com a LOM',
  'Quais artigos da CF/88 se aplicam?',
  'Esta proposta tem impacto orçamentário?',
  'Revise a técnica redacional desta minuta',
]

const THINKING_MESSAGES = [
  'Consultando a Lei Orgânica Municipal...',
  'Verificando conformidade constitucional...',
  'Analisando jurisprudência aplicável...',
  'Buscando referências normativas...',
  'Revisando técnica legislativa...',
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

function getDynamicSuggestions(tipoProposicao) {
  const base = [
    {
      type: 'alert',
      text: 'Verifique se há impacto orçamentário. Proposições com custo exigem anexo de estimativa conforme LRF Art. 17.',
      action: 'Ver detalhes',
    },
  ]
  const byType = {
    pl_ordinaria: [
      {
        type: 'citation',
        text: 'CF/88, Art. 30, I: "Compete aos Municípios legislar sobre assuntos de interesse local."',
        action: 'Ver citação',
      },
      {
        type: 'improvement',
        text: 'Sugestão: Incluir artigo com prazo de regulamentação (recomendado: 90 dias após publicação).',
        action: 'Aplicar sugestão',
      },
    ],
    pl_complementar: [
      {
        type: 'citation',
        text: 'LOM — Leis complementares exigem aprovação por maioria absoluta dos vereadores (quórum qualificado).',
        action: 'Ver citação',
      },
      {
        type: 'improvement',
        text: 'Sugestão: Indicar expressamente qual dispositivo da LOM esta lei complementa.',
        action: 'Aplicar sugestão',
      },
    ],
    decreto: [
      {
        type: 'citation',
        text: 'CF/88, Art. 84, IV: Decreto regulamentar não pode criar direitos ou obrigações além da lei que regulamenta.',
        action: 'Ver citação',
      },
      {
        type: 'improvement',
        text: 'Sugestão: Referenciar expressamente a lei municipal que este decreto regulamenta.',
        action: 'Aplicar sugestão',
      },
    ],
    indicacao: [
      {
        type: 'improvement',
        text: 'Sugestão: Indicações devem ser endereçadas ao Poder Executivo Municipal com destinatário explícito.',
        action: 'Aplicar sugestão',
      },
      {
        type: 'citation',
        text: 'Regimento Interno — Indicações não têm força de lei; são sugestões ao Executivo sem prazo de resposta obrigatório.',
        action: 'Ver citação',
      },
    ],
  }
  return [...(byType[tipoProposicao] || []), ...base]
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

const EditorMinuta = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { municipioSelecionado } = useOutletContext() ?? {}
  const [carregando, setCarregando]             = useState(true)
  const [salvando, setSalvando]                 = useState(false)
  const [temAlteracoes, setTemAlteracoes]                   = useState(false)
  const [tituloProposicao, setTituloProposicao]       = useState('Proposição')
  const [tipoProposicao, setTipoProposicao]         = useState('')
  const [statusProposicao, setStatusProposicao]     = useState('DRAFT')
  const [secaoAtiva, setSecaoAtiva]       = useState('ementa')
  const [chatAberto, setChatAberto]             = useState(false)
  const [minimizado, setMinimizado]           = useState(false)
  const [mensagemAssistente, setMensagemAssistente] = useState('')
  const [historicoChat, setHistoricoChat]           = useState(() => {
    try {
      const saved = localStorage.getItem(`legisla:chat:${id}`)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [carregandoChat, setCarregandoChat]           = useState(false)
  const [mensagemPensando, setMensagemPensando]           = useState(THINKING_MESSAGES[0])
  const [bannerIncerteza, setBannerIncerteza] = useState(null)

  const [exibirModalVersoes, setExibirModalVersoes]   = useState(false)
  const [versoes, setVersoes]                     = useState([])
  const [carregandoVersoes, setCarregandoVersoes]       = useState(false)
  const [confirmandoVersaoId, setConfirmandoVersaoId] = useState(null)

  const [exibirModalExportacao, setExibirModalExportacao] = useState(false)
  const [exportacaoRevisada, setExportacaoRevisada]   = useState(false)
  const [exibirModalNaoSalvo, setExibirModalNaoSalvo] = useState(false)
  const [destinoNavegacao, setDestinoNavegacao] = useState(null)
  const [editandoTitulo, setEditandoTitulo]         = useState(false)
  const [chaveDoc, setChaveDoc]                     = useState(0)
  const [exportando, setExportando]           = useState(false)

  const titleInputRef = useRef(null)

  const chatEndRef      = useRef(null)
  const activeTextareaRef = useRef(null)

  const [doc, setDoc] = useState({
    ementa:    '',
    preambulo: '',
    artigos:   [],
    vigencia:  '',
    revogacao: '',
  })

  const validacoes = useMemo(() => {
    const results = []
    if (!doc.ementa?.trim())
      results.push({ type: 'warning', message: 'Ementa não preenchida — obrigatória para publicação.' })
    if (!doc.preambulo?.trim())
      results.push({ type: 'warning', message: 'Preâmbulo não preenchido.' })
    if (!doc.artigos?.length)
      results.push({ type: 'error', message: 'Nenhum artigo cadastrado. Toda lei deve ter ao menos um artigo.' })
    else if (doc.artigos.some(a => !a.texto?.trim()))
      results.push({ type: 'warning', message: 'Há artigos sem texto. Preencha ou remova os artigos vazios.' })
    if (!doc.vigencia?.trim())
      results.push({ type: 'warning', message: 'Cláusula de vigência não preenchida.' })
    return results
  }, [doc])

  useEffect(() => {
    api.get('/proposals/' + id)
      .then(data => {
        if (data.title)  setTituloProposicao(data.title)
        if (data.type)   setTipoProposicao(data.type)
        if (data.status) setStatusProposicao(data.status)
        if (data.content && data.content !== '{}') {
          try {
            const loaded = JSON.parse(data.content)
            pendingDocRef.current = loaded
            setDoc(loaded)
            setChaveDoc(k => k + 1)
          } catch { /* mantém padrão */ }
        }
      })
      .catch(() => toast.error('Não foi possível carregar a proposição.'))
      .finally(() => setCarregando(false))
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historicoChat])

  useEffect(() => {
    try {
      const limited = historicoChat.slice(-50)
      localStorage.setItem(`legisla:chat:${id}`, JSON.stringify(limited))
    } catch { /* quota exceeded — ignore */ }
  }, [historicoChat, id])

  useEffect(() => {
    if (!carregandoChat) return
    let idx = 0
    const timer = setInterval(() => {
      idx = (idx + 1) % THINKING_MESSAGES.length
      setMensagemPensando(THINKING_MESSAGES[idx])
    }, 2500)
    return () => clearInterval(timer)
  }, [carregandoChat])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (temAlteracoes) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [temAlteracoes])

  const pendingDocRef = useRef({ ementa: '', preambulo: '', artigos: [], vigencia: '', revogacao: '' })
  const flushTimerRef = useRef(null)

  const scheduleDocFlush = useCallback(() => {
    clearTimeout(flushTimerRef.current)
    flushTimerRef.current = setTimeout(() => {
      setDoc({ ...pendingDocRef.current })
      setTemAlteracoes(true)
    }, 300)
  }, [])

  const aoMudarCampo = useCallback((field, value) => {
    pendingDocRef.current = { ...pendingDocRef.current, [field]: value }
    scheduleDocFlush()
  }, [scheduleDocFlush])

  const aoMudarArtigo = useCallback((artId, newText) => {
    pendingDocRef.current = {
      ...pendingDocRef.current,
      artigos: pendingDocRef.current.artigos.map(a => a.id === artId ? { ...a, texto: newText } : a),
    }
    scheduleDocFlush()
  }, [scheduleDocFlush])

  const aoSalvarTitulo = async (newTitle) => {
    const trimmed = newTitle.trim()
    if (!trimmed || trimmed === tituloProposicao) {
      setEditandoTitulo(false)
      return
    }
    try {
      await api.put('/proposals/' + id, { title: trimmed })
      setTituloProposicao(trimmed)
      toast.success('Título atualizado!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setEditandoTitulo(false)
    }
  }

  const aoAlterarStatus = async (newStatus) => {
    try {
      await api.put('/proposals/' + id, { status: newStatus })
      setStatusProposicao(newStatus)
      const labels = { DRAFT: 'Rascunho', REVIEW: 'Em revisão', APPROVED: 'Aprovada' }
      toast.success(`Status atualizado: ${labels[newStatus] || newStatus}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const navegacaoSegura = (target) => {
    if (temAlteracoes) {
      setDestinoNavegacao(target)
      setExibirModalNaoSalvo(true)
    } else {
      navigate(target)
    }
  }

  const aoSalvar = useCallback(async () => {
    clearTimeout(flushTimerRef.current)
    setSalvando(true)
    try {
      await api.put('/proposals/' + id, { content: JSON.stringify(pendingDocRef.current) })
      setDoc({ ...pendingDocRef.current })
      setTemAlteracoes(false)
      toast.success('Salvo!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSalvando(false)
    }
  }, [id])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        aoSalvar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aoSalvar])

  const carregarVersoes = async () => {
    setCarregandoVersoes(true)
    try {
      const data = await api.get('/proposals/' + id + '/versions')
      setVersoes(data)
    } catch {
      toast.error('Não foi possível carregar o histórico de versões.')
    } finally {
      setCarregandoVersoes(false)
    }
  }

  const abrirModalVersoes = () => {
    setExibirModalVersoes(true)
    setConfirmandoVersaoId(null)
    carregarVersoes()
  }

  const restaurarVersao = (version) => {
    try {
      const restored = JSON.parse(version.content)
      pendingDocRef.current = restored
      setDoc(restored)
      setChaveDoc(k => k + 1)
      setTemAlteracoes(true)
      setExibirModalVersoes(false)
      toast.success(`Versão ${version.versionNumber} restaurada. Salve para confirmar.`)
    } catch {
      toast.error('Não foi possível restaurar esta versão.')
    }
  }

  const limparChat = () => {
    setHistoricoChat([])
    try { localStorage.removeItem(`legisla:chat:${id}`) } catch { /* noop */ }
  }

  const aoPerguntarAssistente = async (overrideMsg) => {
    const msg = (overrideMsg ?? mensagemAssistente).trim()
    if (!msg || carregandoChat) return
    if (!overrideMsg) setMensagemAssistente('')
    setMensagemPensando(THINKING_MESSAGES[0])
    setHistoricoChat(prev => [...prev, { role: 'user', text: msg }])
    setCarregandoChat(true)
    try {
      const res = await api.post('/ai/chat', {
        proposalId: id,
        message: msg,
        promptContext: JSON.stringify(pendingDocRef.current),
      })
      setHistoricoChat(prev => [...prev, { role: 'assistant', text: res.text, hasCit: hasCitation(res.text) }])
      if (detectUncertainty(res.text)) {
        setBannerIncerteza('Não encontrei referência normativa clara para este ponto. Consulte a Procuradoria antes de prosseguir.')
      }
    } catch (e) {
      const isTimeout = e.message?.toLowerCase().includes('demorou') || e.message?.toLowerCase().includes('timeout')
      setHistoricoChat(prev => [...prev, {
        role: 'error',
        text: isTimeout
          ? 'O assistente demorou para responder. Tente novamente.'
          : 'Nosso assistente está temporariamente indisponível. Tente em alguns minutos.',
      }])
    } finally {
      setCarregandoChat(false)
    }
  }

  const aoSugerirRapido = (text) => aoPerguntarAssistente(text)

  const aoAcionarSugestao = (suggestion) => {
    setChatAberto(true)
    setMinimizado(false)
    if (suggestion.type === 'citation') {
      setHistoricoChat(prev => [...prev, { role: 'assistant', text: suggestion.text, hasCit: true }])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      toast.success('Citação adicionada ao chat.')
    } else {
      const prefix = suggestion.type === 'improvement'
        ? 'Por favor, elabore esta sugestão para a minuta atual: '
        : 'Preciso de mais detalhes sobre este alerta: '
      aoPerguntarAssistente(prefix + suggestion.text)
    }
  }

  const adicionarArtigo = () => {
    const n = pendingDocRef.current.artigos.length + 1
    const newArticle = { id: n, numero: `Art. ${n}º`, texto: '', citacoes: [] }
    pendingDocRef.current = {
      ...pendingDocRef.current,
      artigos: [...pendingDocRef.current.artigos, newArticle],
    }
    setDoc({ ...pendingDocRef.current })
    setTemAlteracoes(true)
  }

  const alertasPendentes  = useMemo(() => validacoes.filter(v => v.type === 'warning' || v.type === 'error'), [validacoes])
  const citacoesUsadas  = useMemo(() => doc.artigos.flatMap(a => a.citacoes || []), [doc.artigos])
  const formatoExportacao   = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('legisla:settings') || '{}').exportFormat || 'PDF' }
    catch { return 'PDF' }
  }, [])

  const aoClicarExportar = () => { setExportacaoRevisada(false); setExibirModalExportacao(true) }
  const confirmarExportacao = () => {
    setExibirModalExportacao(false)
    setExportando(true)
    const isDocx = formatoExportacao === 'DOCX'
    toast.promise(
      (isDocx
        ? exportToDocx(tituloProposicao, pendingDocRef.current, municipioSelecionado)
        : exportToPDF(tituloProposicao, pendingDocRef.current, municipioSelecionado)
      ).finally(() => setExportando(false)),
      {
        loading: isDocx ? 'Gerando DOCX...' : 'Gerando PDF...',
        success: isDocx ? 'DOCX exportado!'  : 'PDF exportado!',
        error:   isDocx ? 'Erro ao gerar DOCX' : 'Erro ao gerar PDF',
      }
    )
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50 dark:bg-[#141624]">
        <div className="flex items-center gap-3 text-primary-500 dark:text-slate-400">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Carregando editor...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-primary-50 dark:bg-[#141624] print:bg-white">
      {/* Top Bar */}
      <div className="bg-white dark:bg-[#1c1f38] border-b border-primary-200 dark:border-[#2d3158] px-6 py-3 flex-shrink-0 shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navegacaoSegura('/painel')}
              className="text-primary-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
              aria-label="Voltar ao painel"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex items-center gap-2">
              {editandoTitulo ? (
                <input
                  ref={titleInputRef}
                  defaultValue={tituloProposicao}
                  onBlur={e => aoSalvarTitulo(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') aoSalvarTitulo(e.target.value)
                    if (e.key === 'Escape') setEditandoTitulo(false)
                  }}
                  className="text-base font-display font-bold text-primary-800 dark:text-slate-100 bg-primary-50 dark:bg-[#232745]
                    border-b-2 border-primary-400 dark:border-[#3d4270] outline-none px-1 min-w-0 w-48 md:w-64"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setEditandoTitulo(true)
                    setTimeout(() => titleInputRef.current?.select(), 50)
                  }}
                  title="Clique para renomear"
                  className="text-base font-display font-bold text-primary-800 dark:text-slate-100 truncate
                    hover:text-primary-600 dark:hover:text-slate-300 hover:underline decoration-dashed underline-offset-2
                    transition-colors text-left max-w-[200px] md:max-w-xs"
                >
                  {tituloProposicao}
                </button>
              )}
              {temAlteracoes && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  title="Alterações não salvas"
                  className="w-2 h-2 rounded-full bg-oro-400 flex-shrink-0"
                />
              )}
            </div>
            {/* Status visível no mobile */}
            <div className="flex items-center gap-2 md:hidden">
              {(() => {
                const cfg = STATUS_CONFIG[statusProposicao] || STATUS_CONFIG.DRAFT
                return (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Toolbar de formatação */}
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-[#232745] rounded-lg border border-primary-100 dark:border-[#3d4270]">
            {[
              { icon: Bold,        title: 'Negrito',   prefix: '**', suffix: '**' },
              { icon: Italic,      title: 'Itálico',   prefix: '_',  suffix: '_'  },
              { icon: ListOrdered, title: 'Numeração', prefix: '1. ',suffix: ''   },
            ].map(({ icon: Icon, title, prefix, suffix }) => (
              <button
                key={title}
                title={title}
                aria-label={title}
                onClick={() => applyFormat(activeTextareaRef, prefix, suffix)}
                className="p-1.5 rounded text-primary-500 dark:text-slate-400 hover:bg-white dark:hover:bg-[#1c1f38] hover:text-primary-700 dark:hover:text-slate-200 hover:shadow-sm transition-all"
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Badge de status + botão avançar */}
            {(() => {
              const cfg = STATUS_CONFIG[statusProposicao] || STATUS_CONFIG.DRAFT
              return (
                <div className="hidden md:flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {cfg.next && (
                    <button
                      onClick={() => aoAlterarStatus(cfg.next)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                        rounded-lg transition-all active:scale-[0.97] ${cfg.nextColor}`}
                    >
                      <CheckCircle size={13} />
                      {cfg.nextLabel}
                    </button>
                  )}
                </div>
              )
            })()}
            <span className="text-xs text-primary-400 dark:text-slate-500 hidden lg:block">Ctrl+S</span>
            <button
              onClick={abrirModalVersoes}
              aria-label="Ver histórico de versões"
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-primary-200 dark:border-[#3d4270] text-primary-600 dark:text-slate-300 rounded-xl hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all"
            >
              <History size={15} />
              <span className="hidden md:inline">Versões</span>
            </button>
            <button
              onClick={aoSalvar}
              disabled={salvando}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] border border-primary-200 dark:border-[#3d4270] rounded-lg transition-all disabled:opacity-50"
            >
              <Save size={14} />
              <span>{salvando ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button
              onClick={aoClicarExportar}
              disabled={exportando}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-[0.97] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span className="hidden md:inline">{exportando ? 'Gerando...' : (formatoExportacao === 'DOCX' ? 'Exportar DOCX' : 'Exportar PDF')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden print:block">
        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto p-6 print:hidden">

          {/* Banner de incerteza */}
          <AnimatePresence>
            {bannerIncerteza && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl mb-5"
              >
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-amber-800 flex-1">{bannerIncerteza}</p>
                <button onClick={() => setBannerIncerteza(null)} className="text-amber-400 hover:text-amber-600">
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
                  onClick={() => setSecaoAtiva(sId)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all active:scale-[0.97]
                    ${secaoAtiva === sId ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-500 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-[#232745] hover:text-primary-700 dark:hover:text-slate-200'}`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Validações */}
          <div className="space-y-2 mb-5">
            {validacoes.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-3 rounded-lg border-l-4 flex items-center gap-2.5 ${
                  v.type === 'success' ? 'bg-primary-50 dark:bg-[#1c1f38] border-primary-400' : v.type === 'warning' ? 'bg-amber-50 border-amber-400' : 'bg-rosso-50 border-rosso-500'
                }`}
              >
                {v.type === 'success'
                  ? <CheckCircle className="text-primary-600 flex-shrink-0" size={15} />
                  : <AlertTriangle className={v.type === 'warning' ? 'text-amber-500 flex-shrink-0' : 'text-rosso-600 flex-shrink-0'} size={15} />
                }
                <p className={`text-xs ${v.type === 'success' ? 'text-primary-800' : v.type === 'warning' ? 'text-amber-800' : 'text-rosso-800'}`}>{v.message}</p>
              </motion.div>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="card p-8" key={chaveDoc}>
            {(() => {
              const section = SECTIONS.find(s => s.id === secaoAtiva)
              const Icon = section?.icon ?? FileText
              return (
                <div className="flex items-center gap-2 mb-5">
                  <Icon size={20} className="text-primary-400" />
                  <h2 className="text-xl font-display font-bold text-primary-800 dark:text-slate-100">{section?.label}</h2>
                </div>
              )
            })()}

            {secaoAtiva === 'ementa' && (
              <div>
                <textarea ref={activeTextareaRef} defaultValue={pendingDocRef.current.ementa}
                  onChange={e => aoMudarCampo('ementa', e.target.value)}
                  className="input-field min-h-[90px] font-serif resize-none" placeholder="Resumo do objeto da lei..." />
                <p className="text-xs text-primary-400 dark:text-slate-500 mt-2">A ementa resume de forma clara e objetiva o conteúdo da proposição.</p>
              </div>
            )}

            {secaoAtiva === 'preambulo' && (
              <div>
                <textarea ref={activeTextareaRef} defaultValue={pendingDocRef.current.preambulo}
                  onChange={e => aoMudarCampo('preambulo', e.target.value)}
                  className="input-field min-h-[90px] font-serif resize-none" placeholder="Texto introdutório..." />
                <p className="text-xs text-primary-400 dark:text-slate-500 mt-2">Fórmula legislativa padrão conforme LOM.</p>
              </div>
            )}

            {secaoAtiva === 'artigos' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-primary-500 dark:text-slate-400">{doc.artigos.length} artigo(s)</p>
                  <button onClick={adicionarArtigo}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-100 dark:bg-[#232745] text-primary-700 dark:text-slate-300 rounded-lg hover:bg-primary-200 dark:hover:bg-[#2d3158] active:scale-[0.97] transition-all">
                    + Adicionar Artigo
                  </button>
                </div>
                {doc.artigos.length === 0 ? (
                  <div className="text-center py-10 text-primary-400 dark:text-slate-500">
                    <List size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhum artigo ainda. Clique em "+ Adicionar Artigo".</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doc.artigos.map(artigo => (
                      <div key={artigo.id} className="border border-primary-100 dark:border-[#2d3158] rounded-xl p-5">
                        <div className="flex items-start gap-4">
                          <span className="px-2.5 py-1 bg-primary-100 dark:bg-[#232745] text-primary-700 dark:text-slate-300 font-bold text-sm rounded flex-shrink-0 mt-1">{artigo.numero}</span>
                          <div className="flex-1">
                            <textarea defaultValue={artigo.texto} onChange={e => aoMudarArtigo(artigo.id, e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-primary-100 dark:border-[#2d3158] dark:bg-[#232745] dark:text-slate-100 rounded-lg focus:border-primary-400 dark:focus:border-[#3d4270] focus:outline-none font-serif text-sm min-h-[80px] resize-none transition-colors"
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

            {secaoAtiva === 'vigencia' && (
              <textarea ref={activeTextareaRef} defaultValue={pendingDocRef.current.vigencia}
                onChange={e => aoMudarCampo('vigencia', e.target.value)}
                className="input-field min-h-[80px] font-serif resize-none" placeholder="Cláusula de vigência..." />
            )}

            {secaoAtiva === 'revogacao' && (
              <textarea ref={activeTextareaRef} defaultValue={pendingDocRef.current.revogacao}
                onChange={e => aoMudarCampo('revogacao', e.target.value)}
                className="input-field min-h-[80px] font-serif resize-none" placeholder="Cláusula revogatória..." />
            )}
          </div>
        </div>

        {/* Painel lateral de sugestões */}
        {(() => {
          const suggestions = getDynamicSuggestions(tipoProposicao)
          if (!suggestions.length) return null
          return (
            <aside className="hidden xl:flex flex-col w-64 border-l border-primary-200 dark:border-[#2d3158] bg-white dark:bg-[#1c1f38] overflow-y-auto flex-shrink-0 print:hidden">
              <div className="p-4 border-b border-primary-100 dark:border-[#2d3158]">
                <p className="text-[10px] text-primary-400 dark:text-slate-500 uppercase tracking-wide font-semibold">
                  Sugestões para esta proposição
                </p>
              </div>
              <div className="p-3 space-y-2.5">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border-l-4 text-xs ${
                      s.type === 'citation'
                        ? 'bg-oro-50 border-oro-400'
                        : s.type === 'improvement'
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-rosso-50 border-rosso-400'
                    }`}
                  >
                    <p className="text-primary-700 dark:text-slate-200 mb-2 leading-relaxed">{s.text}</p>
                    <button
                      onClick={() => aoAcionarSugestao(s)}
                      className="flex items-center gap-1 text-primary-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                      <ExternalLink size={11} />
                      {s.action}
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          )
        })()}
      </div>

      {/* ── Widget Assistente Jurídico ── */}

      {/* Popup */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[340px] bg-white dark:bg-[#1c1f38] rounded-2xl shadow-2xl border border-primary-100 dark:border-[#2d3158] flex flex-col overflow-hidden z-50 print:hidden"
            style={{ height: minimizado ? 'auto' : '440px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-800 to-primary-600 px-4 py-3 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale size={15} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm leading-tight">Assistente Jurídico</h3>
                    <p className="text-[10px] text-primary-200 leading-tight">Citações normativas em tempo real</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {historicoChat.length > 0 && (
                    <button
                      onClick={limparChat}
                      aria-label="Limpar conversa"
                      title="Limpar conversa"
                      className="text-white/60 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all text-[10px] font-medium"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    onClick={() => setMinimizado(p => !p)}
                    aria-label={minimizado ? 'Expandir' : 'Minimizar'}
                    className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                  >
                    {minimizado ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button
                    onClick={() => { setChatAberto(false); setMinimizado(false) }}
                    aria-label="Fechar assistente"
                    className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Corpo */}
            <AnimatePresence initial={false}>
              {!minimizado && (
                <motion.div
                  key="body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col flex-1 overflow-hidden min-h-0"
                >
                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

                    {/* Estado vazio — chips de sugestão */}
                    {historicoChat.length === 0 && !carregandoChat && (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-2">
                          <div className="w-12 h-12 bg-primary-100 dark:bg-[#232745] rounded-2xl flex items-center justify-center">
                            <Scale size={22} className="text-primary-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary-700 dark:text-slate-200">Assistente Jurídico</p>
                            <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">Faça uma pergunta ou escolha uma sugestão</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(QUICK_SUGGESTIONS[tipoProposicao] ?? DEFAULT_SUGGESTIONS).map((s, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => aoSugerirRapido(s)}
                              className="text-left px-2.5 py-2 bg-primary-50 dark:bg-[#232745] hover:bg-primary-100 dark:hover:bg-[#2d3158] border border-primary-100 dark:border-[#3d4270] hover:border-primary-200 rounded-xl text-[11px] text-primary-700 dark:text-slate-300 leading-tight transition-all"
                            >
                              {s}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mensagens */}
                    {historicoChat.map((msg, i) => {
                      if (msg.role === 'user') return (
                        <div key={i} className="flex justify-end items-end gap-1.5">
                          <div className="bg-primary-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-xs max-w-[80%] leading-relaxed">
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <div className="w-6 h-6 bg-primary-100 dark:bg-[#232745] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-primary-600 dark:text-slate-300">
                            EU
                          </div>
                        </div>
                      )
                      if (msg.role === 'error') return (
                        <div key={i} className="flex justify-start items-end gap-1.5">
                          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={12} className="text-amber-600" />
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs max-w-[80%] leading-relaxed">
                            <p className="text-amber-700 font-semibold mb-0.5 text-[10px] uppercase tracking-wide">Aviso</p>
                            <p className="text-amber-800">{msg.text}</p>
                          </div>
                        </div>
                      )
                      return (
                        <div key={i} className="flex justify-start items-end gap-1.5">
                          <div className="w-6 h-6 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <Scale size={11} className="text-white" />
                          </div>
                          <div className={`rounded-2xl rounded-bl-sm px-3 py-2 text-xs max-w-[80%] leading-relaxed ${
                            msg.hasCit
                              ? 'bg-oro-50 border-l-4 border-oro-400 text-primary-800'
                              : 'bg-white dark:bg-[#232745] border border-primary-100 dark:border-[#3d4270] text-primary-800 dark:text-slate-200 shadow-sm'
                          }`}>
                            {msg.hasCit && (
                              <p className="font-semibold text-[10px] uppercase tracking-wide text-oro-600 mb-1 flex items-center gap-1">
                                <BookOpen size={9} /> Com referência normativa
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      )
                    })}

                    {/* Loading — mensagem animada */}
                    {carregandoChat && (
                      <div className="flex justify-start items-end gap-1.5">
                        <div className="w-6 h-6 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <Scale size={11} className="text-white" />
                        </div>
                        <div className="bg-white dark:bg-[#232745] border border-primary-100 dark:border-[#3d4270] rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm max-w-[80%]">
                          <div className="flex items-center gap-1 mb-1.5">
                            {[0, 1, 2].map(d => (
                              <span
                                key={d}
                                className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"
                                style={{ animationDelay: `${d * 0.15}s` }}
                              />
                            ))}
                          </div>
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={mensagemPensando}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.3 }}
                              className="text-[10px] text-primary-400 italic"
                            >
                              {mensagemPensando}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-primary-100 dark:border-[#2d3158] flex-shrink-0 bg-primary-50/50 dark:bg-[#232745]/50">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label htmlFor="chat-input" className="sr-only">
                          Mensagem ao assistente jurídico
                        </label>
                        <textarea
                          id="chat-input"
                          rows={2}
                          value={mensagemAssistente}
                          onChange={e => setMensagemAssistente(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              aoPerguntarAssistente()
                            }
                          }}
                          className="w-full px-3 py-2 border-2 border-primary-200 dark:border-[#3d4270] dark:bg-[#1c1f38] dark:text-slate-100 rounded-xl focus:border-primary-500 dark:focus:border-[#3d4270] focus:outline-none text-xs transition-colors resize-none leading-relaxed"
                          placeholder="Faça uma pergunta jurídica..."
                          disabled={carregandoChat}
                        />
                        <p className="text-[9px] text-primary-300 dark:text-slate-600 mt-0.5 text-right">Enter para enviar · Shift+Enter para nova linha</p>
                      </div>
                      <button
                        onClick={() => aoPerguntarAssistente()}
                        disabled={carregandoChat || !mensagemAssistente.trim()}
                        aria-label="Enviar pergunta"
                        className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:scale-[0.97] transition-all disabled:opacity-40 mb-4 flex-shrink-0"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — some quando o chat está aberto */}
      <AnimatePresence>
        {!chatAberto && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setChatAberto(true)}
            aria-label="Abrir Assistente Jurídico"
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary-700 hover:bg-primary-800 text-white rounded-full shadow-xl flex items-center justify-center transition-colors z-50 print:hidden"
          >
            <Scale size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Print layout */}
      <div className="hidden print:block font-serif text-black bg-white p-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Estado de Santa Catarina</h1>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Câmara Municipal de {municipioSelecionado?.nomeOficial || municipioSelecionado?.nome || 'Nova Veneza'}
          </h2>
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
          <p>
            {municipioSelecionado?.nomeOficial || municipioSelecionado?.nome || 'Nova Veneza'}/{municipioSelecionado?.uf || 'SC'}, {new Date().toLocaleDateString('pt-BR')}
          </p>
          <div className="mt-12 border-t border-black w-64 mx-auto pt-2">
            <p className="font-bold">Assinatura</p>
          </div>
        </div>
      </div>

      {/* ── Modal Versões ── */}
      <AnimatePresence>
        {exibirModalVersoes && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={e => e.target === e.currentTarget && setExibirModalVersoes(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-[#1c1f38] rounded-2xl shadow-xl max-w-md w-full mx-4 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-primary-100 dark:border-[#2d3158] flex-shrink-0">
                <h2 className="text-base font-display font-bold text-primary-800 dark:text-slate-100">Histórico de versões</h2>
                <button
                  onClick={() => setExibirModalVersoes(false)}
                  aria-label="Fechar histórico de versões"
                  className="text-primary-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-[#232745] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {carregandoVersoes ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-[#232745]">
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-primary-200 dark:bg-[#2d3158] rounded w-24" />
                          <div className="h-2.5 bg-primary-100 dark:bg-[#2d3158] rounded w-36" />
                        </div>
                        <div className="h-7 w-20 bg-primary-100 dark:bg-[#2d3158] rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : versoes.length === 0 ? (
                  <p className="text-sm text-primary-400 dark:text-slate-500 text-center py-10">Nenhuma versão salva ainda.</p>
                ) : (() => {
                  const maxV = Math.max(...versoes.map(v => v.versionNumber))
                  return (
                    <div className="space-y-2">
                      {versoes.map(v => (
                        <div key={v.id} className="border border-primary-100 dark:border-[#2d3158] rounded-xl p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-primary-800 dark:text-slate-100">Versão {v.versionNumber}</span>
                                {v.versionNumber === maxV && (
                                  <span className="text-xs font-semibold bg-oro-100 text-oro-700 px-2 py-0.5 rounded-full">Atual</span>
                                )}
                              </div>
                              <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">{formatVersionDate(v.createdAt)}</p>
                            </div>
                            {v.versionNumber !== maxV && confirmandoVersaoId !== v.id && (
                              <button
                                onClick={() => setConfirmandoVersaoId(v.id)}
                                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-primary-200 dark:border-[#3d4270] text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all"
                              >
                                Restaurar
                              </button>
                            )}
                          </div>
                          {confirmandoVersaoId === v.id && (
                            <div className="mt-3 pt-3 border-t border-primary-100 dark:border-[#2d3158]">
                              <p className="text-xs text-primary-600 dark:text-slate-300 mb-2">Isso substituirá o conteúdo atual.</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setConfirmandoVersaoId(null)}
                                  className="flex-1 text-xs py-1.5 rounded-lg border border-primary-200 dark:border-[#3d4270] text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] transition-all"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => { restaurarVersao(v); setConfirmandoVersaoId(null) }}
                                  className="flex-1 text-xs py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.97] transition-all font-semibold"
                                >
                                  Confirmar restauração
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Export ── */}
      <AnimatePresence>
        {exibirModalExportacao && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={e => e.target === e.currentTarget && setExibirModalExportacao(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-[#1c1f38] rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-6 border-b border-primary-100 dark:border-[#2d3158]">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={20} className="text-primary-500" />
                  <h2 className="text-lg font-display font-bold text-primary-800 dark:text-slate-100">Revisão Final</h2>
                </div>
                <button onClick={() => setExibirModalExportacao(false)} className="text-primary-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-[#232745]">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-primary-50 dark:bg-[#232745] rounded-xl p-4">
                  <p className="text-xs text-primary-400 dark:text-slate-500 uppercase tracking-wide font-bold mb-1">Proposição</p>
                  <p className="font-bold text-primary-800 dark:text-slate-100">{tituloProposicao}</p>
                  {tipoProposicao && <p className="text-sm text-primary-500 dark:text-slate-400 mt-0.5">{PROPOSAL_TYPE_LABELS[tipoProposicao] || tipoProposicao}</p>}
                </div>
                <div>
                  <p className="text-xs text-primary-400 dark:text-slate-500 uppercase tracking-wide font-bold mb-2">Alertas Pendentes ({alertasPendentes.length})</p>
                  {alertasPendentes.length === 0 ? (
                    <div className="flex items-center gap-2 text-primary-700 dark:text-slate-200 bg-primary-50 dark:bg-[#232745] rounded-lg px-3 py-2.5 text-sm">
                      <CheckCircle size={15} /> Nenhum alerta pendente
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {alertasPendentes.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs">
                          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />{v.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-primary-400 dark:text-slate-500 uppercase tracking-wide font-bold mb-2">Citações Utilizadas ({citacoesUsadas.length})</p>
                  {citacoesUsadas.length === 0 ? (
                    <p className="text-xs text-primary-400 dark:text-slate-500 italic">Nenhuma citação registrada.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {citacoesUsadas.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-primary-700 bg-oro-50 rounded-lg px-3 py-2">
                          <Scale size={11} className="text-oro-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <label className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-xl transition-all hover:bg-primary-50 dark:hover:bg-[#232745]"
                  style={{ borderColor: exportacaoRevisada ? '#2563eb' : '#e8e8e8' }}>
                  <input type="checkbox" checked={exportacaoRevisada} onChange={e => setExportacaoRevisada(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary-600 flex-shrink-0" />
                  <span className="text-sm text-primary-700 dark:text-slate-300 leading-relaxed">
                    Confirmo que revisei esta minuta com assessor jurídico e estou ciente dos alertas pendentes.
                  </span>
                </label>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => setExibirModalExportacao(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-primary-200 dark:border-[#3d4270] text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all">
                  Voltar ao Editor
                </button>
                <button onClick={confirmarExportacao} disabled={!exportacaoRevisada}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:cursor-not-allowed
                    ${exportacaoRevisada ? 'bg-primary-800 hover:bg-primary-900 text-white' : 'bg-primary-100 text-primary-300'}`}>
                  <Download size={15} /> {formatoExportacao === 'DOCX' ? 'Gerar DOCX' : 'Gerar PDF'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Alterações Não Salvas ── */}
      <AnimatePresence>
        {exibirModalNaoSalvo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-[#1c1f38] rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-primary-800 dark:text-slate-100 text-center mb-2">
                Alterações não salvas
              </h2>
              <p className="text-sm text-primary-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    setExibirModalNaoSalvo(false)
                    await aoSalvar()
                    if (destinoNavegacao) navigate(destinoNavegacao)
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white
                    hover:bg-primary-700 active:scale-[0.97] transition-all"
                >
                  Salvar e sair
                </button>
                <button
                  onClick={() => {
                    setExibirModalNaoSalvo(false)
                    setTemAlteracoes(false)
                    if (destinoNavegacao) navigate(destinoNavegacao)
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border border-primary-200 dark:border-[#3d4270]
                    text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-[#232745] active:scale-[0.97] transition-all"
                >
                  Sair sem salvar
                </button>
                <button
                  onClick={() => { setExibirModalNaoSalvo(false); setDestinoNavegacao(null) }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-primary-400 dark:text-slate-500
                    hover:text-primary-600 dark:hover:text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EditorMinuta
