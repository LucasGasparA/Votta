import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Save, Download, AlertTriangle, CheckCircle,
  Scale, Send, ArrowLeft,
  BookOpen, List, Calendar, Minus, AlignLeft,
  History, X, ClipboardCheck,
  ChevronDown, ChevronUp, Plus, Sparkles, Eye, Pencil,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'
import { useSettings } from '../hooks/useSettings.js'
import { useProposalChat } from '../hooks/useProposalChat.js'
import { useProposalVersions } from '../hooks/useProposalVersions.js'
import { useProposalExport } from '../hooks/useProposalExport.js'
import { formatDate } from '../lib/formatDate.js'

const SECTIONS = [
  { id: 'ementa',    label: 'Ementa',    icon: AlignLeft,  hint: 'A ementa resume de forma clara e objetiva o conteúdo da proposição.' },
  { id: 'preambulo', label: 'Preâmbulo', icon: BookOpen,   hint: 'Fórmula legislativa padrão conforme LOM.' },
  { id: 'artigos',   label: 'Artigos',   icon: List,       hint: null },
  { id: 'vigencia',  label: 'Vigência',  icon: Calendar,   hint: null },
  { id: 'revogacao', label: 'Revogação', icon: Minus,      hint: null },
  { id: 'visualizacao', label: 'Visualização', icon: Eye,  hint: null },
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

const SUGGESTION_LEVELS = {
  citation:    { label: 'Informação', dot: 'bg-primary-500', action: 'Ver referência' },
  improvement: { label: 'Atenção',    dot: 'bg-oro-500',     action: 'Aplicar' },
  alert:       { label: 'Crítico',    dot: 'bg-rosso-500',   action: 'Ver detalhes' },
}

// Campo editável visível em repouso: borda sempre presente, fundo branco e cursor de texto;
// hover escurece a borda; foco destaca com borda primary + anel suave.
const CLASSE_CAMPO =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white cursor-text resize-none font-document text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-0'


function obterSugestoesDinamicas(tipoProposicao) {
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
function aplicarFormatacao(ref, prefix, suffix = prefix) {
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
  const [ultimoSalvo, setUltimoSalvo]           = useState(null)
  const [temAlteracoes, setTemAlteracoes]                   = useState(false)
  const [tituloProposicao, setTituloProposicao]       = useState('Proposição')
  const [tipoProposicao, setTipoProposicao]         = useState('')
  const [statusProposicao, setStatusProposicao]     = useState('DRAFT')
  const [municipioProposicao, setMunicipioProposicao] = useState(null)
  const { settings: editorSettings } = useSettings()
  const [secaoAtiva, setSecaoAtiva]       = useState('ementa')

  const [exibirModalNaoSalvo, setExibirModalNaoSalvo] = useState(false)
  const [destinoNavegacao, setDestinoNavegacao] = useState(null)
  const [editandoTitulo, setEditandoTitulo]         = useState(false)
  const [chaveDoc, setChaveDoc]                     = useState(0)
  const [sugestoesIgnoradas, setSugestoesIgnoradas] = useState([])

  const titleInputRef = useRef(null)

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
        if (data.municipality) {
          setMunicipioProposicao({
            id: data.municipality.id,
            ibgeId: data.municipality.ibgeId,
            nome: data.municipality.name,
            nomeOficial: data.municipality.name,
            uf: data.municipality.state,
          })
        }
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
    if (!editorSettings.unsavedReminder) return
    const onBeforeUnload = (e) => {
      if (temAlteracoes) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [temAlteracoes, editorSettings.unsavedReminder])

  const pendingDocRef = useRef({ ementa: '', preambulo: '', artigos: [], vigencia: '', revogacao: '' })
  const flushTimerRef = useRef(null)

  const {
    chatAberto, setChatAberto,
    minimizado, setMinimizado,
    mensagemAssistente, setMensagemAssistente,
    historicoChat,
    carregandoChat,
    mensagemPensando,
    bannerIncerteza, setBannerIncerteza,
    chatEndRef,
    limparChat,
    aoPerguntarAssistente,
    aoSugerirRapido,
    aoAcionarSugestao,
    quickSuggestions,
  } = useProposalChat(id, pendingDocRef, tipoProposicao)

  const {
    exibirModalVersoes, setExibirModalVersoes,
    versoes,
    carregandoVersoes,
    confirmandoVersaoId, setConfirmandoVersaoId,
    abrirModalVersoes,
    restaurarVersao,
  } = useProposalVersions(id, { pendingDocRef, setDoc, setChaveDoc, setTemAlteracoes })

  const municipioDocumento = municipioProposicao || municipioSelecionado
  const formatoExportacao  = editorSettings.exportFormat || 'PDF'

  const {
    exibirModalExportacao, setExibirModalExportacao,
    exportacaoRevisada, setExportacaoRevisada,
    exportando,
    aoClicarExportar,
    confirmarExportacao,
  } = useProposalExport({ tituloProposicao, pendingDocRef, municipioDocumento, formatoExportacao })

  const agendarSalvamento = useCallback(() => {
    clearTimeout(flushTimerRef.current)
    flushTimerRef.current = setTimeout(() => {
      setDoc({ ...pendingDocRef.current })
      setTemAlteracoes(true)
    }, 300)
  }, [])

  const aoMudarCampo = useCallback((field, value) => {
    pendingDocRef.current = { ...pendingDocRef.current, [field]: value }
    agendarSalvamento()
  }, [agendarSalvamento])

  const aoMudarArtigo = useCallback((artId, newText) => {
    pendingDocRef.current = {
      ...pendingDocRef.current,
      artigos: pendingDocRef.current.artigos.map(a => a.id === artId ? { ...a, texto: newText } : a),
    }
    agendarSalvamento()
  }, [agendarSalvamento])

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
    if (temAlteracoes && editorSettings.unsavedReminder) {
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
      setUltimoSalvo(new Date())
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

  // Atalhos de formatação — atuam apenas no campo de edição focado
  useEffect(() => {
    const onKey = (e) => {
      const el = activeTextareaRef.current
      if (!el || document.activeElement !== el) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'b') { e.preventDefault(); aplicarFormatacao(activeTextareaRef, '**', '**') }
      else if (k === 'i') { e.preventDefault(); aplicarFormatacao(activeTextareaRef, '_', '_') }
      else if (e.shiftKey && e.code === 'Digit7') { e.preventDefault(); aplicarFormatacao(activeTextareaRef, '1. ', '') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!temAlteracoes) return
    const timer = setInterval(() => {
      aoSalvar()
    }, 30_000)
    return () => clearInterval(timer)
  }, [temAlteracoes, aoSalvar])

  const adicionarArtigo = () => {
    const ids = pendingDocRef.current.artigos.map(a => a.id)
    const n = ids.length > 0 ? Math.max(...ids) + 1 : 1
    const newArticle = { id: n, numero: `Art. ${n}º`, texto: '', citacoes: [] }
    pendingDocRef.current = {
      ...pendingDocRef.current,
      artigos: [...pendingDocRef.current.artigos, newArticle],
    }
    setDoc({ ...pendingDocRef.current })
    setTemAlteracoes(true)
  }

  const alertasPendentes = useMemo(() => validacoes.filter(v => v.type === 'warning' || v.type === 'error'), [validacoes])
  const citacoesUsadas   = useMemo(() => doc.artigos.flatMap(a => a.citacoes || []), [doc.artigos])
  const docVazio = useMemo(() =>
    !doc.ementa?.trim() && !doc.preambulo?.trim() && !doc.artigos?.length && !doc.vigencia?.trim() && !doc.revogacao?.trim()
  , [doc])

  const sugestoesIA = useMemo(() => obterSugestoesDinamicas(tipoProposicao), [tipoProposicao])
  const sugestoesVisiveis = useMemo(
    () => sugestoesIA.filter(s => !sugestoesIgnoradas.includes(s.text)),
    [sugestoesIA, sugestoesIgnoradas],
  )

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="flex items-center gap-3 text-primary-500 ">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Carregando editor...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white print:bg-white">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 print:hidden">
        {/* Linha 1 — título, status e ações */}
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navegacaoSegura('/painel')}
              className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
              aria-label="Voltar ao painel"
            >
              <ArrowLeft size={18} />
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
                  className="text-base font-display font-bold text-slate-900 bg-slate-50 border-b-2 border-primary-400 outline-none px-1 min-w-0 w-64"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setEditandoTitulo(true)
                    setTimeout(() => titleInputRef.current?.select(), 50)
                  }}
                  title="Clique para renomear"
                  className="text-base font-display font-bold text-slate-900 truncate hover:text-primary-600 transition-colors text-left max-w-xs"
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
            {(() => {
              const cfg = STATUS_CONFIG[statusProposicao] || STATUS_CONFIG.DRAFT
              return (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
                  {cfg.label}
                </span>
              )
            })()}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400 mr-1">
              {ultimoSalvo
                ? `Salvo às ${ultimoSalvo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Ctrl+S para salvar'}
            </span>
            <button
              onClick={aoSalvar}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={abrirModalVersoes}
              aria-label="Ver histórico de versões"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <History size={15} />
              Versões
            </button>
            <button
              onClick={aoClicarExportar}
              disabled={exportando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Download size={15} />
              {exportando ? 'Gerando...' : (formatoExportacao === 'DOCX' ? 'Exportar DOCX' : 'Exportar PDF')}
            </button>
            {(() => {
              const cfg = STATUS_CONFIG[statusProposicao] || STATUS_CONFIG.DRAFT
              if (!cfg.next) return null
              return (
                <button
                  onClick={() => aoAlterarStatus(cfg.next)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm"
                >
                  <Send size={14} />
                  {cfg.nextLabel}
                </button>
              )
            })()}
          </div>
        </div>

      </div>

      <div className="flex flex-1 overflow-hidden print:block">
        {/* ── Documento ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50 print:hidden">
          <div className="max-w-3xl mx-auto px-8 py-8">

            {/* Banner de incerteza */}
            <AnimatePresence>
              {bannerIncerteza && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6"
                >
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-800 flex-1">{bannerIncerteza}</p>
                  <button onClick={() => setBannerIncerteza(null)} className="text-amber-400 hover:text-amber-600">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs de seção */}
            <div className="flex items-center gap-6 border-b border-slate-200 mb-8">
              {SECTIONS.map(({ id: sId, label }) => (
                <button
                  key={sId}
                  onClick={() => setSecaoAtiva(sId)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    secaoAtiva === sId ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                  {secaoAtiva === sId && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-primary-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Banner — minuta vazia */}
            {secaoAtiva !== 'visualizacao' && docVazio && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={17} />
                <p className="text-sm text-amber-800">
                  A minuta ainda não tem conteúdo. Se a geração por IA falhou, você pode digitar diretamente em cada seção abaixo.
                </p>
              </div>
            )}

            {/* Validações */}
            {secaoAtiva !== 'visualizacao' && editorSettings.validationAlerts && validacoes.length > 0 && (
              <div className="space-y-2 mb-8">
                {validacoes.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs ${
                      v.type === 'error' ? 'bg-rosso-50 text-rosso-800' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    <AlertTriangle className={v.type === 'error' ? 'text-rosso-500 flex-shrink-0' : 'text-amber-500 flex-shrink-0'} size={14} />
                    {v.message}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Conteúdo do documento */}
            <div key={chaveDoc}>
              {secaoAtiva === 'ementa' && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ementa</p>
                    <Pencil size={11} className="text-slate-300" />
                  </div>
                  <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.ementa}
                    onChange={e => aoMudarCampo('ementa', e.target.value)}
                    className={`${CLASSE_CAMPO} min-h-[200px]`}
                    placeholder="Dispõe sobre o objeto da lei..." />
                  <p className="text-xs text-slate-400 mt-2">A ementa resume de forma clara e objetiva o conteúdo da proposição.</p>
                </div>
              )}

              {secaoAtiva === 'preambulo' && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preâmbulo</p>
                    <Pencil size={11} className="text-slate-300" />
                  </div>
                  <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.preambulo}
                    onChange={e => aoMudarCampo('preambulo', e.target.value)}
                    className={`${CLASSE_CAMPO} min-h-[200px]`}
                    placeholder="Texto introdutório..." />
                  <p className="text-xs text-slate-400 mt-2">Fórmula legislativa padrão conforme LOM.</p>
                </div>
              )}

              {secaoAtiva === 'artigos' && (
                <div>
                  <div className="flex items-center gap-1.5 mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Artigos · {doc.artigos.length}</p>
                    <Pencil size={11} className="text-slate-300" />
                  </div>
                  {doc.artigos.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <List size={28} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Nenhum artigo ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {doc.artigos.map((artigo, idx) => (
                        <div key={artigo.id} className={idx > 0 ? 'pt-5 border-t border-slate-100' : ''}>
                          <div className="flex gap-3">
                            <span className="font-document font-bold text-slate-900 text-[15px] whitespace-nowrap pt-0.5">{artigo.numero}</span>
                            <div className="flex-1 min-w-0">
                              <textarea key={`${chaveDoc}-${artigo.id}`} defaultValue={artigo.texto}
                                onChange={e => aoMudarArtigo(artigo.id, e.target.value)}
                                onFocus={e => { activeTextareaRef.current = e.target }}
                                className={`${CLASSE_CAMPO} min-h-[64px]`}
                                placeholder="Texto do artigo..." />
                              {artigo.citacoes?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {artigo.citacoes.map((c, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-oro-50 text-oro-700 text-xs rounded-full">
                                      <Scale size={10} />{typeof c === 'string' ? c : c.titulo || c.url || ''}
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
                  <button onClick={adicionarArtigo}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 active:scale-[0.98] transition-all">
                    <Plus size={15} />
                    Adicionar artigo
                  </button>
                </div>
              )}

              {secaoAtiva === 'vigencia' && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vigência</p>
                    <Pencil size={11} className="text-slate-300" />
                  </div>
                  <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.vigencia}
                    onChange={e => aoMudarCampo('vigencia', e.target.value)}
                    className={`${CLASSE_CAMPO} min-h-[200px]`}
                    placeholder="Cláusula de vigência..." />
                </div>
              )}

              {secaoAtiva === 'revogacao' && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revogação</p>
                    <Pencil size={11} className="text-slate-300" />
                  </div>
                  <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.revogacao}
                    onChange={e => aoMudarCampo('revogacao', e.target.value)}
                    className={`${CLASSE_CAMPO} min-h-[200px]`}
                    placeholder="Cláusula revogatória..." />
                </div>
              )}

              {secaoAtiva === 'visualizacao' && (() => {
                const d = pendingDocRef.current
                return (
                  <div className="mx-auto max-w-2xl bg-white rounded-xl shadow-sm ring-1 ring-slate-200/70 px-10 py-12 font-document text-slate-800">
                    {d.ementa?.trim() && (
                      <div className="mb-8 ml-auto w-2/3">
                        <p className="italic font-semibold leading-relaxed text-justify whitespace-pre-wrap">{d.ementa}</p>
                      </div>
                    )}
                    {d.preambulo?.trim() && (
                      <p className="mb-8 leading-relaxed text-justify whitespace-pre-wrap">{d.preambulo}</p>
                    )}
                    {d.artigos?.length > 0 && (
                      <div className="mb-8 space-y-5">
                        {d.artigos.map(a => (
                          <p key={a.id} className="leading-relaxed text-justify">
                            <span className="font-bold mr-2">{a.numero}</span>
                            <span className="whitespace-pre-wrap">{a.texto}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {d.vigencia?.trim() && (
                      <p className="mb-6 leading-relaxed text-justify whitespace-pre-wrap">{d.vigencia}</p>
                    )}
                    {d.revogacao?.trim() && (
                      <p className="leading-relaxed text-justify whitespace-pre-wrap">{d.revogacao}</p>
                    )}
                    {docVazio && (
                      <p className="text-center text-sm text-slate-400">A minuta ainda não tem conteúdo para visualizar.</p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* ── Painel lateral de IA ── */}
        <aside className="hidden lg:flex flex-col w-80 border-l border-slate-200 bg-white flex-shrink-0 print:hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-primary-500" />
              <h2 className="text-sm font-semibold text-slate-900">Sugestões da IA</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {sugestoesVisiveis.length === 0
                ? 'Nenhuma sugestão pendente'
                : `${sugestoesVisiveis.length} ${sugestoesVisiveis.length === 1 ? 'sugestão encontrada' : 'sugestões encontradas'}`}
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {sugestoesVisiveis.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Você revisou todas as sugestões.</p>
              </div>
            ) : sugestoesVisiveis.map((s) => {
              const lvl = SUGGESTION_LEVELS[s.type] ?? SUGGESTION_LEVELS.alert
              return (
                <div key={s.text} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{lvl.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">{s.text}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <button
                      onClick={() => aoAcionarSugestao(s)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {lvl.action}
                    </button>
                    <button
                      onClick={() => setSugestoesIgnoradas(prev => [...prev, s.text])}
                      className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={() => { setChatAberto(true); setMinimizado(false) }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <Sparkles size={14} className="text-primary-500" />
              Perguntar à IA
            </button>
          </div>
        </aside>
      </div>

      {/* ── Widget Assistente Legislativo IA ── */}

      {/* Popup */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[340px] bg-white rounded-2xl shadow-2xl border border-primary-100 flex flex-col overflow-hidden z-50 print:hidden"
            style={{ height: minimizado ? 'auto' : '440px' }}
          >
            {/* Header */}
            <div className="bg-primary-500 px-4 py-3 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scale size={15} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm leading-tight">Assistente Legislativo IA</h3>
                    <p className="text-[10px] text-primary-200 leading-tight">Citações, revisão e técnica legislativa</p>
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
                          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                            <Scale size={22} className="text-primary-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-primary-700 ">Assistente Legislativo IA</p>
                            <p className="text-xs text-primary-400 mt-0.5">Faça uma pergunta ou escolha uma sugestão</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {quickSuggestions.map((s, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => aoSugerirRapido(s)}
                              className="text-left px-2.5 py-2 bg-primary-50 hover:bg-primary-100 border border-primary-100 hover:border-primary-200 rounded-xl text-[11px] text-primary-700 leading-tight transition-all"
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
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-primary-600 ">
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
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Scale size={11} className="text-primary-500" />
                          </div>
                          <div className={`rounded-2xl rounded-bl-sm px-3 py-2 text-xs max-w-[80%] leading-relaxed ${
                            msg.hasCit
                              ? 'bg-oro-50 border-l-4 border-oro-400 text-primary-800'
                              : 'bg-white border border-primary-100 text-primary-800 shadow-sm'
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
                        <div className="bg-white border border-primary-100 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm max-w-[80%]">
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
                  <div className="p-3 border-t border-primary-100 flex-shrink-0 bg-primary-50/50 ">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label htmlFor="chat-input" className="sr-only">
                          Mensagem ao Assistente Legislativo IA
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
                          className="w-full px-3 py-2 border-2 border-primary-200 rounded-2xl focus:border-primary-500 focus:outline-none text-xs transition-colors resize-none leading-relaxed"
                          placeholder="Pergunte sobre a minuta legislativa..."
                          disabled={carregandoChat}
                        />
                        <p className="text-[9px] text-primary-300 mt-0.5 text-right">Enter para enviar · Shift+Enter para nova linha</p>
                      </div>
                      <button
                        onClick={() => aoPerguntarAssistente()}
                        disabled={carregandoChat || !mensagemAssistente.trim()}
                        aria-label="Enviar pergunta"
                        className="p-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 active:scale-[0.97] transition-all disabled:opacity-40 mb-4 flex-shrink-0"
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

      {/* Print layout */}
      <div className="hidden print:block font-serif text-black bg-white p-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Estado de Santa Catarina</h1>
          <h2 className="text-xl font-bold uppercase tracking-wide">
            Câmara Municipal de {municipioDocumento?.nomeOficial || municipioDocumento?.nome || 'Nova Veneza'}
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
            {municipioDocumento?.nomeOficial || municipioDocumento?.nome || 'Nova Veneza'}/{municipioDocumento?.uf || 'SC'}, {new Date().toLocaleDateString('pt-BR')}
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
              className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-primary-100 flex-shrink-0">
                <h2 className="text-base font-display font-bold text-primary-800 ">Histórico de versões</h2>
                <button
                  onClick={() => setExibirModalVersoes(false)}
                  aria-label="Fechar histórico de versões"
                  className="text-primary-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {carregandoVersoes ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-2xl bg-primary-50 ">
                        <div className="space-y-2 flex-1">
                          <div className="h-3 bg-primary-200 rounded w-24" />
                          <div className="h-2.5 bg-primary-100 rounded w-36" />
                        </div>
                        <div className="h-7 w-20 bg-primary-100 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : versoes.length === 0 ? (
                  <p className="text-sm text-primary-400 text-center py-10">Nenhuma versão salva ainda.</p>
                ) : (() => {
                  const maxV = Math.max(...versoes.map(v => v.versionNumber))
                  return (
                    <div className="space-y-2">
                      {versoes.map(v => (
                        <div key={v.id} className="border border-primary-100 rounded-2xl p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-primary-800 ">Versão {v.versionNumber}</span>
                                {v.versionNumber === maxV && (
                                  <span className="text-xs font-semibold bg-oro-100 text-oro-700 px-2 py-0.5 rounded-full">Atual</span>
                                )}
                              </div>
                              <p className="text-xs text-primary-400 mt-0.5">{formatDate(v.createdAt)}</p>
                            </div>
                            {v.versionNumber !== maxV && confirmandoVersaoId !== v.id && (
                              <button
                                onClick={() => setConfirmandoVersaoId(v.id)}
                                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-2xl border border-primary-200 text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all"
                              >
                                Restaurar
                              </button>
                            )}
                          </div>
                          {confirmandoVersaoId === v.id && (
                            <div className="mt-3 pt-3 border-t border-primary-100 ">
                              <p className="text-xs text-primary-600 mb-2">Isso substituirá o conteúdo atual.</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setConfirmandoVersaoId(null)}
                                  className="flex-1 text-xs py-1.5 rounded-2xl border border-primary-200 text-primary-600 hover:bg-primary-50 transition-all"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => { restaurarVersao(v); setConfirmandoVersaoId(null) }}
                                  className="flex-1 text-xs py-1.5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.97] transition-all font-semibold"
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-6 border-b border-primary-100 ">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={20} className="text-primary-500" />
                  <h2 className="text-lg font-display font-bold text-primary-800 ">Revisão Final</h2>
                </div>
                <button onClick={() => setExibirModalExportacao(false)} className="text-primary-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 ">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-primary-50 rounded-2xl p-4">
                  <p className="text-xs text-primary-400 uppercase tracking-wide font-bold mb-1">Proposição</p>
                  <p className="font-bold text-primary-800 ">{tituloProposicao}</p>
                  {tipoProposicao && <p className="text-sm text-primary-500 mt-0.5">{PROPOSAL_TYPE_LABELS[tipoProposicao] || tipoProposicao}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-primary-400 uppercase tracking-wide font-bold">Verificação do documento</p>
                    {alertasPendentes.length > 0 && (
                      <span className="text-[10px] text-primary-400 ">Itens gerados pela IA podem ser ignorados</span>
                    )}
                  </div>
                  {alertasPendentes.length === 0 ? (
                    <div className="flex items-center gap-2 text-primary-600 bg-primary-50 border border-primary-200 rounded-2xl px-3 py-3 text-sm">
                      <CheckCircle size={15} className="text-primary-500 flex-shrink-0" />
                      <span>Documento verificado — pronto para exportação.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {alertasPendentes.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 text-primary-600 bg-primary-50 border border-primary-100 rounded-2xl px-3 py-2.5 text-xs">
                          <AlertTriangle size={13} className="text-primary-400 flex-shrink-0 mt-0.5" />{v.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {citacoesUsadas.length > 0 && (
                  <div>
                    <p className="text-xs text-primary-400 uppercase tracking-wide font-bold mb-2">Citações normativas ({citacoesUsadas.length})</p>
                    <div className="space-y-1.5">
                      {citacoesUsadas.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-primary-700 bg-oro-50 rounded-2xl px-3 py-2">
                          <Scale size={11} className="text-oro-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-2xl transition-all hover:bg-primary-50 "
                  style={{ borderColor: exportacaoRevisada ? '#3D7BCC' : '#e0e8f4' }}>
                  <input type="checkbox" checked={exportacaoRevisada} onChange={e => setExportacaoRevisada(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary-600 flex-shrink-0" />
                  <span className="text-sm text-primary-700 leading-relaxed">
                    Confirmo que revisei o conteúdo desta minuta e assumo a responsabilidade jurídica pela exportação.
                  </span>
                </label>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => setExibirModalExportacao(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-primary-200 text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all">
                  Voltar ao Editor
                </button>
                <button onClick={confirmarExportacao} disabled={!exportacaoRevisada || docVazio}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:cursor-not-allowed
                    ${exportacaoRevisada && !docVazio ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-primary-100 text-primary-300'}`}>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-primary-800 text-center mb-2">
                Alterações não salvas
              </h2>
              <p className="text-sm text-primary-500 text-center mb-6 leading-relaxed">
                Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    setExibirModalNaoSalvo(false)
                    await aoSalvar()
                    if (destinoNavegacao) navigate(destinoNavegacao)
                  }}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-primary-600 text-white
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
                  className="w-full py-2.5 rounded-2xl text-sm font-medium border border-primary-200
                    text-primary-600 hover:bg-primary-50 active:scale-[0.97] transition-all"
                >
                  Sair sem salvar
                </button>
                <button
                  onClick={() => { setExibirModalNaoSalvo(false); setDestinoNavegacao(null) }}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium text-primary-400
                    hover:text-primary-600 transition-colors"
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
