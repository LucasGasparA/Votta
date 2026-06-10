import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { api } from '../api/client.js'

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

function detectarIncerteza(text) {
  const lower = text.toLowerCase()
  return UNCERTAINTY_PATTERNS.some(p => lower.includes(p))
}

function temCitacao(text) {
  return /art\.|lom\b|cf\b|lei\s|§\s|\binciso\b|\balínea\b/i.test(text)
}

export function useProposalChat(id, pendingDocRef, tipoProposicao) {
  const [chatAberto, setChatAberto]                   = useState(false)
  const [minimizado, setMinimizado]                   = useState(false)
  const [mensagemAssistente, setMensagemAssistente]   = useState('')
  const [historicoChat, setHistoricoChat]             = useState(() => {
    try {
      const saved = sessionStorage.getItem(`legisla:chat:${id}`)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [carregandoChat, setCarregandoChat]           = useState(false)
  const [mensagemPensando, setMensagemPensando]       = useState(THINKING_MESSAGES[0])
  const [bannerIncerteza, setBannerIncerteza]         = useState(null)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historicoChat])

  useEffect(() => {
    try {
      const limited = historicoChat.slice(-50)
      sessionStorage.setItem(`legisla:chat:${id}`, JSON.stringify(limited))
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

  const limparChat = useCallback(() => {
    setHistoricoChat([])
    try { sessionStorage.removeItem(`legisla:chat:${id}`) } catch { /* noop */ }
  }, [id])

  const aoPerguntarAssistente = useCallback(async (overrideMsg) => {
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
      setHistoricoChat(prev => [...prev, { role: 'assistant', text: res.text, hasCit: temCitacao(res.text) }])
      if (detectarIncerteza(res.text)) {
        setBannerIncerteza('Não encontrei referência normativa clara para este ponto. Consulte a Procuradoria antes de prosseguir.')
      }
    } catch (e) {
      const errMsg = e.message ?? ''
      const isTimeout = errMsg.toLowerCase().includes('demorou') || errMsg.toLowerCase().includes('timeout')
      setHistoricoChat(prev => [...prev, {
        role: 'error',
        text: isTimeout
          ? 'O assistente demorou para responder. Tente novamente.'
          : 'Nosso assistente está temporariamente indisponível. Tente em alguns minutos.',
      }])
    } finally {
      setCarregandoChat(false)
    }
  }, [mensagemAssistente, carregandoChat, id, pendingDocRef])

  const aoSugerirRapido = useCallback((text) => aoPerguntarAssistente(text), [aoPerguntarAssistente])

  const aoAcionarSugestao = useCallback((suggestion) => {
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
  }, [aoPerguntarAssistente])

  const quickSuggestions = QUICK_SUGGESTIONS[tipoProposicao] ?? DEFAULT_SUGGESTIONS

  return {
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
  }
}
