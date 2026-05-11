import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, X, Zap, Shield, Star, ChevronDown, ChevronUp,
  Lock, CreditCard, ArrowRight, Scale, Users, FileText,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Dados ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    description: 'Para procuradorias que querem experimentar sem risco',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Começar grátis',
    ctaVariant: 'ghost',
    features: [
      { text: '3 proposições por mês',          ok: true  },
      { text: '1 município',                     ok: true  },
      { text: 'Wizard guiado de criação',        ok: true  },
      { text: 'Exportação PDF',                  ok: false },
      { text: 'Assistente jurídico completo',    ok: false },
      { text: 'Trilha de auditoria',             ok: false },
      { text: 'Suporte prioritário',             ok: false },
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    description: 'Para câmaras municipais em plena operação legislativa',
    monthlyPrice: 297,
    annualPrice: 237,
    cta: 'Assinar agora',
    ctaVariant: 'primary',
    recommended: true,
    badge: 'Mais escolhido',
    features: [
      { text: 'Proposições ilimitadas',          ok: true },
      { text: 'Todos os municípios',             ok: true },
      { text: 'Exportação DOCX e PDF',           ok: true },
      { text: 'Assistente jurídico completo',    ok: true },
      { text: 'Trilha de auditoria completa',    ok: true },
      { text: 'Suporte prioritário (< 4h)',      ok: true },
      { text: 'Histórico de versões ilimitado',  ok: true },
    ],
  },
  {
    id: 'institucional',
    name: 'Institucional',
    description: 'Para consórcios municipais, câmaras estaduais e tribunais',
    monthlyPrice: null,
    annualPrice: null,
    cta: 'Falar com especialista',
    ctaVariant: 'ghost',
    features: [
      { text: 'Múltiplas câmaras',               ok: true },
      { text: 'SLA contratual garantido',        ok: true },
      { text: 'Integração com sistemas legados', ok: true },
      { text: 'Treinamento presencial',          ok: true },
      { text: 'Gerente de conta dedicado',       ok: true },
      { text: 'Personalização de fluxos',        ok: true },
      { text: 'Conformidade LGPD auditada',      ok: true },
    ],
  },
]

const COMPARISON = [
  {
    category: 'Criação',
    rows: [
      { feature: 'Proposições por mês',     basico: '3',          pro: 'Ilimitadas',       inst: 'Ilimitadas' },
      { feature: 'Municípios simultâneos',  basico: '1',          pro: 'Todos',            inst: 'Múltiplos' },
      { feature: 'Tipos de proposição',     basico: '4 tipos',    pro: '4 tipos',          inst: '4 tipos + custom' },
    ],
  },
  {
    category: 'Conformidade',
    rows: [
      { feature: 'Assistente jurídico',     basico: false,        pro: true,               inst: true },
      { feature: 'Validação automática',    basico: 'Básica',     pro: 'Completa',         inst: 'Completa + custom' },
      { feature: 'Citações LOM/CF',         basico: false,        pro: true,               inst: true },
    ],
  },
  {
    category: 'Exportação',
    rows: [
      { feature: 'Exportação PDF',          basico: false,        pro: true,               inst: true },
      { feature: 'Exportação DOCX',         basico: false,        pro: true,               inst: true },
      { feature: 'Templates personalizados',basico: false,        pro: false,              inst: true },
    ],
  },
  {
    category: 'Suporte',
    rows: [
      { feature: 'Suporte por e-mail',      basico: true,         pro: true,               inst: true },
      { feature: 'Tempo de resposta',       basico: '72h',        pro: '< 4h',             inst: '< 1h' },
      { feature: 'Gerente de conta',        basico: false,        pro: false,              inst: true },
      { feature: 'Treinamento',             basico: false,        pro: 'Online',           inst: 'Presencial' },
    ],
  },
  {
    category: 'Segurança',
    rows: [
      { feature: 'Trilha de auditoria',     basico: false,        pro: true,               inst: true },
      { feature: 'Conformidade LGPD',       basico: true,         pro: true,               inst: true },
      { feature: 'Backup diário',           basico: false,        pro: true,               inst: true },
      { feature: 'SLA garantido',           basico: false,        pro: false,              inst: true },
    ],
  },
]

const TESTIMONIALS = [
  {
    quote: 'Reduzimos em 60% o tempo para elaborar um projeto de lei. O assistente identifica automaticamente os artigos relevantes da LOM sem que a gente precise procurar.',
    author: 'Dra. Maria Luísa Fonseca',
    role: 'Procuradora Municipal',
    city: 'Câmara de Nova Veneza – SC',
    initials: 'ML',
  },
  {
    quote: 'Nunca mais tivemos uma proposição devolvida por vício formal. A validação automática antes do protocolo mudou completamente nossa rotina de trabalho.',
    author: 'Ver. Antônio Carlos Melo',
    role: 'Presidente da Câmara',
    city: 'Câmara de Forquilhinha – SC',
    initials: 'AC',
  },
  {
    quote: 'Implementamos em toda a câmara em um dia. O suporte responde sempre rápido e o treinamento online foi suficiente para toda a equipe.',
    author: 'Silmara Zanette',
    role: 'Diretora Legislativa',
    city: 'Câmara de Criciúma – SC',
    initials: 'SZ',
  },
]

const FAQS = [
  { q: 'Posso cancelar a qualquer momento?',       a: 'Sim. Sem fidelidade contratual. Você cancela com 1 clique no painel e a cobrança para no próximo ciclo — sem multas, sem burocracia.' },
  { q: 'O sistema substitui o procurador?',        a: 'Não — e não queremos que substitua. O LegislaApp é uma ferramenta de assistência técnica, não de substituição. O procurador continua sendo responsável pela revisão final. O sistema elimina o trabalho mecânico.' },
  { q: 'Como funciona a atualização normativa?',   a: 'Nossa equipe atualiza a base normativa (LOM, CF, legislação estadual) mensalmente. Quando uma nova versão é publicada, o sistema notifica os usuários e atualiza as referências automaticamente nas próximas minutas.' },
  { q: 'Os dados ficam seguros? (LGPD)',           a: 'Sim. Todos os dados são armazenados em servidores no Brasil, em conformidade com a LGPD. Utilizamos criptografia TLS 1.3 em trânsito e em repouso. Seus dados nunca são compartilhados com terceiros.' },
  { q: 'Posso testar antes de pagar?',             a: 'Sim. O plano Básico é gratuito para sempre — sem cartão de crédito. Você experimenta com até 3 proposições por mês e faz upgrade quando quiser, sem perder o histórico.' },
  { q: 'Existe desconto para consórcios?',         a: 'Sim, temos condições especiais para consórcios com 3 ou mais câmaras. Entre em contato pelo botão "Falar com especialista" e nossa equipe prepara uma proposta personalizada em até 24h.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price) {
  if (price === null) return null
  if (price === 0)    return 'Grátis'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(price)
}

function CellValue({ value }) {
  if (value === true)  return <Check size={16} className="text-primary-600 mx-auto" />
  if (value === false) return <X size={16} className="text-primary-200 mx-auto" />
  return <span className="text-xs text-primary-600 font-medium">{value}</span>
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function Pricing() {
  const [billing, setBilling]               = useState('monthly')
  const [showComparison, setShowComparison] = useState(false)
  const [faqOpen, setFaqOpen]               = useState(null)
  const [showModal, setShowModal]           = useState(false)
  const [selectedPlan, setSelectedPlan]     = useState(null)
  const [coupon, setCoupon]                 = useState('')
  const plansRef = useRef(null)

  const scrollToPlans = () => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const openModal = (plan) => {
    if (plan.monthlyPrice === null) return
    setSelectedPlan(plan)
    setCoupon('')
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white pt-20 pb-28 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-semibold tracking-wide mb-6 text-primary-100">
            <Zap size={13} />
            Segurança jurídica para câmaras municipais
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">
            Escolha o plano ideal<br className="hidden md:block" /> para sua câmara
          </h1>
          <p className="text-primary-200 text-lg max-w-xl mx-auto mb-10">
            Do rascunho ao protocolo com conformidade normativa automática, citações da LOM e assistência jurídica em tempo real.
          </p>

          {/* Toggle mensal / anual */}
          <div className="inline-flex items-center gap-4 bg-white/10 rounded-2xl p-1.5">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-white text-primary-800 shadow-md' : 'text-primary-200 hover:text-white'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${billing === 'annual' ? 'bg-white text-primary-800 shadow-md' : 'text-primary-200 hover:text-white'}`}
            >
              Anual
              <AnimatePresence>
                {billing === 'annual' ? null : (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-oro-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    -20%
                  </motion.span>
                )}
              </AnimatePresence>
              {billing === 'annual' && (
                <span className="bg-oro-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  -20%
                </span>
              )}
            </button>
          </div>

          <div className="mt-8">
            <button onClick={scrollToPlans} className="inline-flex items-center gap-2 text-primary-200 hover:text-white text-sm transition-colors">
              Ver planos <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── CARDS DE PLANOS ─────────────────────────────────────────────── */}
      <section ref={plansRef} className="px-6 -mt-16 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {PLANS.map((plan, i) => {
            const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const originalMonthly = plan.monthlyPrice
            const showStrikethrough = billing === 'annual' && plan.annualPrice !== null && plan.annualPrice > 0

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border-2 flex flex-col ${
                  plan.recommended
                    ? 'border-primary-600 bg-white shadow-2xl shadow-primary-200/60 md:mt-0'
                    : 'border-primary-100 bg-white shadow-lg mt-0 md:mt-8'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      <Star size={11} fill="currentColor" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`p-8 ${plan.recommended ? 'pt-10' : ''}`}>
                  <h3 className="text-xl font-display font-bold text-primary-800 mb-1">{plan.name}</h3>
                  <p className="text-sm text-primary-400 mb-6 leading-relaxed">{plan.description}</p>

                  {/* Preço */}
                  <div className="mb-6">
                    {price === null ? (
                      <p className="text-3xl font-display font-bold text-primary-800">Sob consulta</p>
                    ) : price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`${plan.id}-${billing}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="text-4xl font-display font-bold text-primary-800"
                          >
                            Grátis
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div>
                        {showStrikethrough && (
                          <p className="text-sm text-primary-300 line-through mb-0.5">
                            R$ {originalMonthly}/mês
                          </p>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-primary-500">R$</span>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={`${plan.id}-${billing}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              className="text-5xl font-display font-bold text-primary-800"
                            >
                              {price}
                            </motion.span>
                          </AnimatePresence>
                          <span className="text-primary-400 text-sm">/mês</span>
                        </div>
                        {billing === 'annual' && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            Cobrado anualmente · Economia de R$ {(originalMonthly - price) * 12}/ano
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => openModal(plan)}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] mb-6 ${
                      plan.ctaVariant === 'primary'
                        ? 'bg-rosso-600 text-white hover:bg-rosso-700 shadow-lg shadow-rosso-200'
                        : 'border-2 border-primary-200 text-primary-700 hover:border-primary-400 hover:bg-primary-50'
                    }`}
                    style={plan.ctaVariant === 'primary' ? { background: '#b83b3d', boxShadow: '0 4px 16px rgba(184,59,61,0.25)' } : {}}
                  >
                    {plan.cta}
                  </button>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          f.ok ? 'bg-green-100' : 'bg-primary-50'
                        }`}>
                          {f.ok
                            ? <Check size={11} className="text-green-600" strokeWidth={2.5} />
                            : <X size={11} className="text-primary-300" strokeWidth={2.5} />
                          }
                        </span>
                        <span className={`text-sm leading-snug ${f.ok ? 'text-primary-700' : 'text-primary-300'}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── TABELA DE COMPARAÇÃO ────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <button
          onClick={() => setShowComparison(v => !v)}
          className="flex items-center gap-2 mx-auto text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors mb-6"
        >
          {showComparison ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          {showComparison ? 'Ocultar comparação completa' : 'Ver comparação completa'}
        </button>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-primary-100 overflow-hidden shadow-lg">
                {/* Header */}
                <div className="grid grid-cols-4 bg-primary-50 border-b border-primary-100">
                  <div className="p-4 text-sm font-semibold text-primary-500">Recurso</div>
                  {PLANS.map(p => (
                    <div key={p.id} className={`p-4 text-center text-sm font-bold ${p.recommended ? 'bg-primary-50 text-primary-700' : 'text-primary-600'}`}>
                      {p.name}
                      {p.recommended && <div className="text-[10px] text-primary-400 font-normal">(Recomendado)</div>}
                    </div>
                  ))}
                </div>

                {COMPARISON.map((cat) => (
                  <div key={cat.category}>
                    <div className="grid grid-cols-4 bg-primary-800/5 border-b border-primary-100">
                      <div className="p-3 col-span-4 text-xs font-bold text-primary-500 uppercase tracking-widest px-4">
                        {cat.category}
                      </div>
                    </div>
                    {cat.rows.map((row, ri) => (
                      <div key={ri} className={`grid grid-cols-4 border-b border-primary-50 hover:bg-primary-50/50 transition-colors`}>
                        <div className="p-3 px-4 text-sm text-primary-600">{row.feature}</div>
                        <div className="p-3 text-center flex items-center justify-center"><CellValue value={row.basico} /></div>
                        <div className="p-3 text-center flex items-center justify-center bg-primary-50/60"><CellValue value={row.pro} /></div>
                        <div className="p-3 text-center flex items-center justify-center"><CellValue value={row.inst} /></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── PROVA SOCIAL ────────────────────────────────────────────────── */}
      <section className="bg-primary-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-6 mb-16"
          >
            {[
              { value: '4.200+', label: 'Minutas geradas', icon: FileText },
              { value: '47',     label: 'Municípios ativos', icon: Users },
              { value: '98%',    label: 'Aprovação formal', icon: Scale },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon size={18} className="text-primary-400" />
                    <span className="text-3xl font-display font-bold text-primary-800">{s.value}</span>
                  </div>
                  <p className="text-sm text-primary-500">{s.label}</p>
                </div>
              )
            })}
          </motion.div>

          {/* Depoimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-md border border-primary-100"
              >
                <div className="flex gap-1 mb-4">
                  {[0,1,2,3,4].map(s => <Star key={s} size={14} className="text-oro-400" fill="#f59e0b" />)}
                </div>
                <p className="text-sm text-primary-700 leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-800">{t.author}</p>
                    <p className="text-xs text-primary-400">{t.role} · {t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-display font-bold text-primary-800 mb-3">Perguntas frequentes</h2>
          <p className="text-primary-400">Tudo o que você precisa saber antes de assinar.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-primary-100 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-primary-50 transition-colors"
              >
                <span className="font-semibold text-primary-800 text-sm pr-4">{faq.q}</span>
                <motion.span
                  animate={{ rotate: faqOpen === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-primary-400"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence>
                {faqOpen === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-5 text-sm text-primary-500 leading-relaxed border-t border-primary-50 pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── RODAPÉ GARANTIA ─────────────────────────────────────────────── */}
      <section className="bg-primary-900 text-white py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto"
        >
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Shield size={28} className="text-oro-400" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-3">30 dias de garantia incondicional</h3>
          <p className="text-primary-200 text-sm leading-relaxed mb-6">
            Se por qualquer motivo você não ficar satisfeito nos primeiros 30 dias, devolvemos 100% do valor pago. Sem perguntas.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-primary-400">
            <div className="flex items-center gap-1.5">
              <Lock size={13} className="text-primary-300" />
              Pagamento seguro
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-primary-300" />
              Dados protegidos pela LGPD
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard size={13} className="text-primary-300" />
              NF para pessoa jurídica
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── MODAL DE CONFIRMAÇÃO ────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6 border-b border-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-400 uppercase tracking-widest font-semibold mb-0.5">Plano selecionado</p>
                    <h3 className="text-xl font-display font-bold text-primary-800">{selectedPlan.name}</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-primary-300 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-primary-500">Valor {billing === 'annual' ? 'anual' : 'mensal'}</span>
                    <div className="text-right">
                      {billing === 'annual' && selectedPlan.monthlyPrice > 0 && (
                        <p className="text-xs text-primary-300 line-through">R$ {selectedPlan.monthlyPrice}/mês</p>
                      )}
                      <p className="text-lg font-bold text-primary-800">
                        {selectedPlan.monthlyPrice === 0
                          ? 'Grátis'
                          : `R$ ${billing === 'annual' ? selectedPlan.annualPrice : selectedPlan.monthlyPrice}/mês`}
                      </p>
                    </div>
                  </div>
                  {billing === 'annual' && selectedPlan.monthlyPrice > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-2">
                      Economia de R$ {(selectedPlan.monthlyPrice - selectedPlan.annualPrice) * 12}/ano
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary-500 mb-2 uppercase tracking-wider">
                    Cupom de desconto (opcional)
                  </label>
                  <input
                    type="text"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Ex: CAMARA2026"
                    className="w-full px-4 py-2.5 border-2 border-primary-200 rounded-xl text-sm font-mono focus:border-primary-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border-2 border-primary-200 text-primary-600 hover:bg-primary-50 transition-all"
                >
                  Voltar
                </button>
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                  style={{ background: '#b83b3d' }}
                >
                  Confirmar assinatura
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
