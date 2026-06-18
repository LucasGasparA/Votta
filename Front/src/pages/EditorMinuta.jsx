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

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50 ">
        <div className="flex items-center gap-3 text-primary-500 ">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Carregando editor...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-primary-50 print:bg-white">
      {/* Top Bar */}
      <div className="bg-white border-b border-primary-200 px-3 md:px-6 py-3 flex-shrink-0 shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navegacaoSegura('/painel')}
              className="text-primary-400 hover:text-primary-600 transition-colors flex-shrink-0"
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
                  className="text-base font-display font-bold text-primary-800 bg-primary-50 
                    border-b-2 border-primary-400 outline-none px-1 min-w-0 w-48 md:w-64"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setEditandoTitulo(true)
                    setTimeout(() => titleInputRef.current?.select(), 50)
                  }}
                  title="Clique para renomear"
                  className="text-base font-display font-bold text-primary-800 truncate
                    hover:text-primary-600 hover:underline decoration-dashed underline-offset-2
                    transition-colors text-left max-w-[140px] sm:max-w-[220px] md:max-w-xs"
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
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-2xl border border-primary-100 ">
            {[
              { icon: Bold,        title: 'Negrito',   prefix: '**', suffix: '**' },
              { icon: Italic,      title: 'Itálico',   prefix: '_',  suffix: '_'  },
              { icon: ListOrdered, title: 'Numeração', prefix: '1. ',suffix: ''   },
            ].map(({ icon: Icon, title, prefix, suffix }) => (
              <button
                key={title}
                title={title}
                aria-label={title}
                onClick={() => aplicarFormatacao(activeTextareaRef, prefix, suffix)}
                className="p-1.5 rounded text-primary-500 hover:bg-white hover:text-primary-700 hover:shadow-sm transition-all"
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
                        rounded-2xl transition-all active:scale-[0.97] ${cfg.nextColor}`}
                    >
                      <CheckCircle size={13} />
                      {cfg.nextLabel}
                    </button>
                  )}
                </div>
              )
            })()}
            {ultimoSalvo ? (
              <span className="text-xs text-primary-400 hidden lg:block">
                Salvo às {ultimoSalvo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="text-xs text-primary-400 hidden lg:block">Ctrl+S para salvar</span>
            )}
            <button
              onClick={abrirModalVersoes}
              aria-label="Ver histórico de versões"
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 text-sm border border-primary-200 text-primary-600 rounded-2xl hover:bg-primary-50 active:scale-[0.97] transition-all"
            >
              <History size={15} />
              <span className="hidden md:inline">Versões</span>
            </button>
            <button
              onClick={aoSalvar}
              disabled={salvando}
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 md:py-1.5 text-sm text-primary-600 hover:bg-primary-50 border border-primary-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <Save size={14} />
              <span className="hidden sm:inline">{salvando ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button
              onClick={aoClicarExportar}
              disabled={exportando}
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 md:py-1.5 text-sm bg-primary-600 text-white rounded-2xl hover:bg-primary-700 active:scale-[0.97] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span className="hidden md:inline">{exportando ? 'Gerando...' : (formatoExportacao === 'DOCX' ? 'Exportar DOCX' : 'Exportar PDF')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden print:block">
        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 print:hidden">

          {/* Banner de incerteza */}
          <AnimatePresence>
            {bannerIncerteza && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-2xl mb-5"
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
          <div className="rounded-2xl border border-primary-100 bg-white p-2.5 mb-4 shadow-sm ">
            <div className="flex items-center gap-1 overflow-x-auto">
              {SECTIONS.map(({ id: sId, label, icon: Icon }) => (
                <button
                  key={sId}
                  onClick={() => setSecaoAtiva(sId)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all active:scale-[0.97]
                    ${secaoAtiva === sId ? 'bg-primary-100 text-primary-700 ' : 'text-primary-500 hover:bg-primary-50 hover:text-primary-700 '}`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Banner — minuta vazia */}
          {docVazio && (
            <div className="flex items-start gap-3 p-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={17} />
              <p className="text-sm text-amber-800">
                A minuta ainda não tem conteúdo. Se a geração por IA falhou, você pode digitar diretamente em cada seção abaixo.
              </p>
            </div>
          )}

          {/* Validações */}
          {editorSettings.validationAlerts && (
          <div className="space-y-2 mb-4">
            {validacoes.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-3 rounded-2xl border-l-4 flex items-center gap-2.5 ${
                  v.type === 'success' ? 'bg-primary-50 border-primary-400' : v.type === 'warning' ? 'bg-amber-50 border-amber-400' : 'bg-rosso-50 border-rosso-500'
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
          )}

          {/* Conteúdo */}
          <div className="rounded-2xl border border-primary-100 bg-white p-5 md:p-7 shadow-sm " key={chaveDoc}>
            {(() => {
              const section = SECTIONS.find(s => s.id === secaoAtiva)
              const Icon = section?.icon ?? FileText
              return (
                <div className="flex items-center gap-2 mb-5">
                  <Icon size={20} className="text-primary-400" />
                  <h2 className="text-xl font-display font-bold text-primary-800 ">{section?.label}</h2>
                </div>
              )
            })()}

            {secaoAtiva === 'ementa' && (
              <div>
                <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.ementa}
                  onChange={e => aoMudarCampo('ementa', e.target.value)}
                  className="input-field min-h-[90px] font-serif resize-none" placeholder="Resumo do objeto da lei..." />
                <p className="text-xs text-primary-400 mt-2">A ementa resume de forma clara e objetiva o conteúdo da proposição.</p>
              </div>
            )}

            {secaoAtiva === 'preambulo' && (
              <div>
                <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.preambulo}
                  onChange={e => aoMudarCampo('preambulo', e.target.value)}
                  className="input-field min-h-[90px] font-serif resize-none" placeholder="Texto introdutório..." />
                <p className="text-xs text-primary-400 mt-2">Fórmula legislativa padrão conforme LOM.</p>
              </div>
            )}

            {secaoAtiva === 'artigos' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-primary-500 ">{doc.artigos.length} artigo(s)</p>
                  <button onClick={adicionarArtigo}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-2xl hover:bg-primary-200 active:scale-[0.97] transition-all">
                    + Adicionar Artigo
                  </button>
                </div>
                {doc.artigos.length === 0 ? (
                  <div className="text-center py-10 text-primary-400 ">
                    <List size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhum artigo ainda. Clique em "+ Adicionar Artigo".</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doc.artigos.map(artigo => (
                      <div key={artigo.id} className="border border-primary-100 rounded-2xl p-5">
                        <div className="flex items-start gap-4">
                          <span className="px-2.5 py-1 bg-primary-100 text-primary-700 font-bold text-sm rounded flex-shrink-0 mt-1">{artigo.numero}</span>
                          <div className="flex-1">
                            <textarea key={`${chaveDoc}-${artigo.id}`} defaultValue={artigo.texto}
                              onChange={e => aoMudarArtigo(artigo.id, e.target.value)}
                              onFocus={e => { activeTextareaRef.current = e.target }}
                              className="w-full px-3 py-2.5 border-2 border-primary-100 rounded-2xl focus:border-primary-400 focus:outline-none font-serif text-sm min-h-[80px] resize-none transition-colors"
                              placeholder="Texto do artigo..." />
                            {artigo.citacoes?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {artigo.citacoes.map((c, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-oro-100 text-oro-800 text-xs rounded-full">
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
              </div>
            )}

            {secaoAtiva === 'vigencia' && (
              <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.vigencia}
                onChange={e => aoMudarCampo('vigencia', e.target.value)}
                className="input-field min-h-[80px] font-serif resize-none" placeholder="Cláusula de vigência..." />
            )}

            {secaoAtiva === 'revogacao' && (
              <textarea key={chaveDoc} ref={activeTextareaRef} defaultValue={pendingDocRef.current.revogacao}
                onChange={e => aoMudarCampo('revogacao', e.target.value)}
                className="input-field min-h-[80px] font-serif resize-none" placeholder="Cláusula revogatória..." />
            )}
          </div>
        </div>

        {/* Painel lateral de sugestões */}
        {(() => {
          const suggestions = obterSugestoesDinamicas(tipoProposicao)
          if (!suggestions.length) return null
          return (
            <aside className="hidden xl:flex flex-col w-64 border-l border-primary-200 bg-white overflow-y-auto flex-shrink-0 print:hidden">
              <div className="p-4 border-b border-primary-100 ">
                <p className="text-[10px] text-primary-400 uppercase tracking-wide font-semibold">
                  Sugestões para esta proposição
                </p>
              </div>
              <div className="p-3 space-y-2.5">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border-l-4 text-xs ${
                      s.type === 'citation'
                        ? 'bg-oro-50 border-oro-400'
                        : s.type === 'improvement'
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-rosso-50 border-rosso-400'
                    }`}
                  >
                    <p className="text-primary-700 mb-2 leading-relaxed">{s.text}</p>
                    <button
                      onClick={() => aoAcionarSugestao(s)}
                      className="flex items-center gap-1 text-primary-500 hover:text-primary-700 font-medium transition-colors"
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

      {/* FAB — some quando o chat está aberto */}
      <AnimatePresence>
        {!chatAberto && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChatAberto(true)}
            aria-label="Abrir Assistente Legislativo IA"
            className="fixed bottom-5 right-5 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center gap-2 px-3.5 py-3 transition-colors z-50 print:hidden"
          >
            <Scale size={18} />
            <span className="hidden sm:inline text-sm font-semibold">Assistente Legislativo IA</span>
          </motion.button>
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
