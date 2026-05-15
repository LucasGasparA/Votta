import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, Lock, CreditCard, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Dados ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    description: 'Para experimentar sem compromisso',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Começar grátis',
    ctaTo: '/cadastro',
    features: [
      '3 proposições por mês',
      '1 município',
      'Wizard guiado de criação',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    description: 'Para câmaras em plena operação legislativa',
    monthlyPrice: 149.9,
    annualPrice: 119.9,
    cta: 'Assinar agora',
    ctaTo: '/cadastro',
    recommended: true,
    features: [
      'Proposições ilimitadas',
      'Exportação DOCX e PDF',
      'Assistente jurídico completo',
      'Trilha de auditoria completa',
      'Suporte prioritário (< 4h)',
    ],
  },
  {
    id: 'institucional',
    name: 'Institucional',
    description: 'Para consórcios municipais e câmaras estaduais',
    monthlyPrice: null,
    annualPrice: null,
    cta: 'Falar com especialista',
    ctaHref: 'mailto:contato@votta.com.br',
    features: [
      'Múltiplas câmaras',
      'SLA contratual garantido',
      'Integração com sistemas legados',
      'Treinamento presencial',
      'Gerente de conta dedicado',
    ],
  },
]

const FAQS = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Sem fidelidade contratual. Você cancela com 1 clique no painel e a cobrança para no próximo ciclo — sem multas, sem burocracia.',
  },
  {
    q: 'O sistema substitui o procurador?',
    a: 'Não — e não queremos que substitua. O Votta é uma ferramenta de assistência técnica, não de substituição. O procurador continua sendo responsável pela revisão final. O sistema elimina o trabalho mecânico.',
  },
  {
    q: 'Como funciona a atualização normativa?',
    a: 'Nossa equipe atualiza a base normativa (LOM, CF, legislação estadual) mensalmente. Quando uma nova versão é publicada, o sistema notifica os usuários e atualiza as referências automaticamente nas próximas minutas.',
  },
  {
    q: 'Os dados ficam seguros? (LGPD)',
    a: 'Sim. Todos os dados são armazenados em servidores no Brasil, em conformidade com a LGPD. Utilizamos criptografia TLS 1.3 em trânsito e em repouso. Seus dados nunca são compartilhados com terceiros.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim. O plano Básico é gratuito para sempre — sem cartão de crédito. Você experimenta com até 3 proposições por mês e faz upgrade quando quiser, sem perder o histórico.',
  },
  {
    q: 'Existe desconto para consórcios?',
    a: 'Sim, temos condições especiais para consórcios com 3 ou mais câmaras. Entre em contato pelo botão "Falar com especialista" e nossa equipe prepara uma proposta personalizada em até 24h.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PrecoDisplay({ price }) {
  if (price === null) {
    return (
      <span className="text-4xl font-display font-bold text-primary-900 dark:text-slate-100">
        Sob consulta
      </span>
    )
  }
  if (price === 0) {
    return (
      <span className="text-5xl font-display font-bold text-primary-900 dark:text-slate-100">
        Grátis
      </span>
    )
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
  const [inteiro, centavos] = formatted.split(',')
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-lg font-semibold text-primary-400 dark:text-slate-500 mr-0.5">R$</span>
      <span className="text-5xl font-display font-bold text-primary-900 dark:text-slate-100 tracking-tight leading-none">
        {inteiro}
      </span>
      <span className="text-xl font-semibold text-primary-400 dark:text-slate-500">,{centavos}</span>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function Planos() {
  const [cicloCobranca, setCicloCobranca] = useState('monthly')
  const [faqAberto, setFaqAberto]         = useState(null)

  return (
    <div className="min-h-screen bg-white dark:bg-[#141624]">

      {/* ── CABEÇALHO ───────────────────────────────────────────────────── */}
      <section className="pt-16 pb-10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-900 dark:text-slate-100 mb-3 leading-tight">
            Planos simples,<br className="hidden md:block" /> sem surpresas.
          </h1>
          <p className="text-primary-400 dark:text-slate-500 text-base mb-8 max-w-md mx-auto">
            Comece grátis. Faça upgrade quando precisar.
          </p>

          {/* Toggle mensal / anual */}
          <div className="inline-flex items-center gap-1 bg-primary-100 dark:bg-[#232745] rounded-full p-1">
            <button
              onClick={() => setCicloCobranca('monthly')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                cicloCobranca === 'monthly'
                  ? 'bg-white dark:bg-[#1c1f38] text-primary-800 dark:text-slate-100 shadow-sm'
                  : 'text-primary-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-slate-200'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setCicloCobranca('annual')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                cicloCobranca === 'annual'
                  ? 'bg-white dark:bg-[#1c1f38] text-primary-800 dark:text-slate-100 shadow-sm'
                  : 'text-primary-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-slate-200'
              }`}
            >
              Anual
              <span className="bg-oro-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                -20%
              </span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── CARDS DE PLANOS ─────────────────────────────────────────────── */}
      <section className="px-4 pb-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {PLANS.map((plan, i) => {
            const price = cicloCobranca === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const economiaAnual = plan.monthlyPrice && plan.annualPrice
              ? ((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)
              : null

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.recommended
                    ? 'bg-primary-50 dark:bg-[#232745] border border-primary-200 dark:border-[#3d4270]'
                    : 'bg-white dark:bg-[#1c1f38] border border-primary-100 dark:border-[#2d3158]'
                }`}
              >
                {/* Nome do plano */}
                <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${
                  plan.recommended ? 'text-primary-600' : 'text-primary-400 dark:text-slate-500'
                }`}>
                  {plan.name}
                </p>

                {/* Preço — protagonista visual */}
                <div className="mb-2 min-h-[60px] flex items-end">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${plan.id}-${cicloCobranca}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <PrecoDisplay price={price} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Periodicidade */}
                <div className="mb-6 min-h-[36px]">
                  {price !== null && price > 0 && (
                    <div>
                      <p className="text-sm text-primary-400 dark:text-slate-500">por mês</p>
                      {cicloCobranca === 'annual' && (
                        <p className="text-xs text-primary-400 dark:text-slate-500 mt-0.5">
                          cobrado anualmente · economia de R$ {economiaAnual}/ano
                        </p>
                      )}
                    </div>
                  )}
                  {price === 0 && (
                    <p className="text-sm text-primary-400 dark:text-slate-500">para sempre</p>
                  )}
                  {price === null && (
                    <p className="text-sm text-primary-400 dark:text-slate-500">sob proposta</p>
                  )}
                </div>

                {/* Descrição */}
                <p className="text-sm text-primary-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {plan.description}
                </p>

                {/* CTA */}
                {plan.ctaTo ? (
                  <Link
                    to={plan.ctaTo}
                    className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-all active:scale-[0.97] mb-8 block ${
                      plan.recommended
                        ? 'text-white hover:opacity-90'
                        : 'border border-primary-200 dark:border-[#3d4270] text-primary-700 dark:text-slate-200 hover:border-primary-400 hover:bg-white dark:hover:bg-[#2d3158]'
                    }`}
                    style={plan.recommended ? { background: '#dc2626' } : {}}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <a
                    href={plan.ctaHref}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-center border border-primary-200 dark:border-[#3d4270] text-primary-700 dark:text-slate-200 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-[#2d3158] transition-all active:scale-[0.97] mb-8 block"
                  >
                    {plan.cta}
                  </a>
                )}

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className="text-green-500 flex-shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      <span className="text-sm text-primary-700 dark:text-slate-300 leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── ARGUMENTO DE ÂNCORA ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="px-6 py-6 max-w-3xl mx-auto"
      >
        <div className="bg-primary-50 dark:bg-[#1c1f38] rounded-2xl px-8 py-5 text-center">
          <p className="text-sm text-primary-600 dark:text-slate-300 leading-relaxed">
            Câmaras municipais pagam em média{' '}
            <strong className="text-primary-800 dark:text-slate-100">R$ 3.400/mês</strong> em sistemas legados.
            Com o Votta, você começa por{' '}
            <strong className="text-primary-800 dark:text-slate-100">R$ 150</strong>.
          </p>
        </div>
      </motion.section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-display font-bold text-primary-900 dark:text-slate-100 mb-8 text-center"
        >
          Perguntas frequentes
        </motion.h2>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="border border-primary-100 dark:border-[#2d3158] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary-50 dark:hover:bg-[#232745] transition-colors"
                aria-expanded={faqAberto === i}
              >
                <span className="font-medium text-primary-800 dark:text-slate-200 text-sm pr-4">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: faqAberto === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-primary-300 dark:text-slate-600"
                >
                  <ChevronDown size={16} />
                </motion.span>
              </button>
              <AnimatePresence>
                {faqAberto === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 pt-1 text-sm text-primary-500 dark:text-slate-400 leading-relaxed border-t border-primary-50 dark:border-[#2d3158]">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TRUST BADGES ────────────────────────────────────────────────── */}
      <section className="border-t border-primary-100 dark:border-[#2d3158] py-8 px-6">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-primary-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-primary-300 dark:text-slate-600" />
            Dados protegidos pela LGPD
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard size={13} className="text-primary-300 dark:text-slate-600" />
            Sem cartão no plano básico
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-primary-300 dark:text-slate-600" />
            Cancele quando quiser
          </div>
        </div>
      </section>

    </div>
  )
}
