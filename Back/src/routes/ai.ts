import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { VertexAI } from '@google-cloud/vertexai';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../prisma/client.js';
import { logAudit } from '../services/audit.js';
import { retrieveLegalContext } from '../services/rag.js';
import { normalizeProposalContent, ProposalContent } from '../services/proposalContent.js';

const router = Router();
router.use(requireAuth);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Limite de requisições atingido. Aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatSchema = z.object({
  proposalId: z.string().uuid().optional(),
  message: z.string().min(1, 'Mensagem não pode ser vazia').max(2000),
  promptContext: z.string().max(20000).optional(),
});

function zodError(error: z.ZodError): string {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  return issues[0]?.message ?? 'Dados inválidos';
}

const PROJECT_ID           = process.env.GCP_PROJECT_ID;
const LOCATION             = process.env.GCP_LOCATION || 'us-central1';
const MODEL                = process.env.GCP_MODEL    || 'gemini-2.5-pro';
const GCP_CREDENTIALS_JSON = process.env.GCP_CREDENTIALS_JSON;
const LLM_TIMEOUT_MS = 30_000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DEMO_MODE_ENABLED = process.env.AI_DEMO_ENABLED === 'true' || !IS_PROD;

let credentialsParseError: string | null = null;

function parseCredentials() {
  if (!GCP_CREDENTIALS_JSON) return undefined;
  try {
    return JSON.parse(GCP_CREDENTIALS_JSON);
  } catch (error: any) {
    credentialsParseError = error?.message ?? 'JSON inválido';
    console.error('GCP_CREDENTIALS_JSON inválido — verifique o valor no Railway');
    return undefined;
  }
}

const vertexAI = PROJECT_ID
  ? new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
      googleAuthOptions: { credentials: parseCredentials() },
    })
  : null;

router.post('/chat', aiLimiter, async (req: Request, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }

  const userId = (req as AuthRequest).user.userId;
  const { message, proposalId } = parsed.data;
  let promptContext = parsed.data.promptContext;

  if (proposalId) {
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, userId },
    });
    if (!proposal) {
      res.status(403).json({ error: 'Proposição não encontrada ou sem permissão.' });
      return;
    }
    if (proposal.content) {
      promptContext = proposal.content;
    }
  }

  if (!vertexAI) {
    if (!DEMO_MODE_ENABLED) {
      res.status(503).json({ error: 'Assistente de IA não configurado em produção.' });
      return;
    }
    res.json({
      type: 'response',
      text: `[Modo demonstração — configure GCP_PROJECT_ID para usar o Vertex AI]\n\nSua pergunta: "${message}"\n\nResposta simulada: Para esta proposição, recomenda-se verificar a conformidade com o Art. 145, VI da Lei Orgânica Municipal e o Art. 30 da Constituição Federal, que trata das competências municipais.`,
    });
    return;
  }

  if (credentialsParseError) {
    res.status(503).json({ error: 'Credenciais do Vertex AI inválidas. Verifique a configuração do servidor.' });
    return;
  }

  try {
    const ragResult = await retrieveLegalContext(message);
    const legalContext = ragResult?.context || 'Nenhum contexto normativo municipal foi encontrado pelo RAG para esta pergunta.';

    const systemInstruction = `Você é um Assistente Jurídico especializado em técnica legislativa municipal brasileira.
Seu papel é auxiliar na elaboração de minutas legislativas com base na Lei Orgânica Municipal,
Regimento Interno e na Constituição Federal (especialmente Art. 30).

REGRAS OBRIGATÓRIAS — nunca viole estas regras:

1. Responda SOMENTE sobre temas jurídicos e legislativos municipais. Se a pergunta for sobre outro assunto, diga: "Só posso ajudar com questões relacionadas à elaboração de proposições legislativas municipais."
2. Nunca use linguagem ofensiva, informal em excesso, irônica ou inadequada para um contexto jurídico-institucional.
3. Nunca invente leis, artigos ou normas. Se não tiver base normativa clara, diga: "Não encontrei referência normativa suficiente para este ponto. Recomendo consultar a Procuradoria Municipal antes de prosseguir."
4. Nunca emita opiniões políticas, partidárias ou eleitorais.
5. Nunca sugira ações que violem a Constituição Federal, a LOM ou o Regimento Interno.
6. Se detectar pedido de conteúdo ofensivo, discriminatório ou ilegal, responda: "Não é possível auxiliar com este tipo de conteúdo."
7. Sempre cite a base normativa das suas sugestões (ex: "conforme Art. 30, I, CF/88").
8. Seja conciso, formal e objetivo.
9. Para leis municipais de Nova Veneza, responda ÚNICA e EXCLUSIVAMENTE com base no Contexto Auxiliar recuperado pelo RAG.
10. Se a resposta não estiver clara no Contexto Auxiliar, diga: "Não encontrei esta informação nas leis municipais de Nova Veneza disponíveis na base consultada."
11. Sempre que usar o Contexto Auxiliar, cite o Título e a URL da lei correspondente.

Contexto da proposta (não é fonte normativa): ${promptContext || 'Sem contexto fornecido.'}

Contexto Auxiliar das leis municipais de Nova Veneza:
${legalContext}`;

    const model = vertexAI.getGenerativeModel({ model: MODEL, systemInstruction });
    const chat  = model.startChat();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), LLM_TIMEOUT_MS)
    );

    const result = await Promise.race([
      chat.sendMessage(message),
      timeoutPromise,
    ]);

    const text =
      (result as any).response.candidates?.[0]?.content?.parts?.[0]?.text ??
      'Sem resposta do modelo.';

    res.json({ type: 'response', text });
  } catch (error: any) {
    console.error('Erro Vertex AI:', error);
    if (error?.message === 'TIMEOUT') {
      res.status(504).json({ error: 'O assistente demorou mais que o esperado. Tente novamente em alguns instantes.' });
      return;
    }
    res.status(500).json({ error: 'Nosso assistente está temporariamente indisponível. Tente em alguns minutos.' });
  }
});

const generateSchema = z.object({
  proposalId: z.string().uuid(),
});

const GENERATE_TIMEOUT_MS = 90_000;

const ORDINAL = ['1º','2º','3º','4º','5º','6º','7º','8º','9º','10º'];

function ordinal(n: number): string {
  return ORDINAL[n - 1] ?? `${n}º`;
}

function extractJson(raw: string): string {
  // Tenta extrair o primeiro objeto JSON do texto caso o modelo adicione markdown
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  throw new Error('JSON_NOT_FOUND');
}

function buildDemoContent(proposal: any) {
  const muni = proposal.municipality?.name ?? 'Nova Veneza';
  const theme = proposal.theme ?? 'Assunto municipal';
  return {
    ementa: `Dispõe sobre ${theme.toLowerCase()} no Município de ${muni} e dá outras providências.`,
    preambulo: `O Prefeito Municipal de ${muni}, Estado de Santa Catarina, faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte Lei:`,
    artigos: [
      { id: 1, numero: 'Art. 1º', texto: `Fica instituído, no âmbito do Município de ${muni}, o programa relativo a ${theme.toLowerCase()}, nos termos desta Lei.`, citacoes: [] },
      { id: 2, numero: 'Art. 2º', texto: `A Administração Municipal adotará as medidas necessárias para a implantação e acompanhamento das ações previstas nesta Lei, podendo firmar convênios e parcerias com entidades públicas e privadas.`, citacoes: [] },
      { id: 3, numero: 'Art. 3º', texto: `As despesas decorrentes desta Lei correrão por conta das dotações orçamentárias próprias, suplementadas se necessário.`, citacoes: [] },
    ],
    vigencia: `Esta Lei entra em vigor na data de sua publicação.`,
    revogacao: `Revogam-se as disposições em contrário.`,
  };
}

async function saveGeneratedContent(proposalId: string, content: ProposalContent) {
  const serialized = JSON.stringify(content);

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({ where: { id: proposalId }, data: { content: serialized } });
    const latest = await tx.proposalVersion.findFirst({
      where: { proposalId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    await tx.proposalVersion.create({
      data: {
        proposalId,
        content: serialized,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
      },
    });
  });
}

router.post('/generate', aiLimiter, async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }

  const { proposalId } = parsed.data;

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, userId: (req as AuthRequest).user.userId },
    include: { municipality: true },
  });

  if (!proposal) {
    res.status(404).json({ error: 'Proposição não encontrada.' });
    return;
  }

  const BLOCKED_TERMS = [
    'xingar', 'palavrão', 'ofensa', 'discrimin', 'racis', 'preconceito',
    'ilegal', 'corrupção', 'propina', 'suborno',
  ];

  const inputText = [
    proposal.theme ?? '',
    proposal.objective ?? '',
    proposal.justification ?? '',
  ].join(' ').toLowerCase();

  const hasBlocked = BLOCKED_TERMS.some(term => inputText.includes(term));
  if (hasBlocked) {
    res.status(400).json({
      error: 'O conteúdo informado contém termos não permitidos para geração de proposições legislativas.',
    });
    return;
  }

  // Modo demonstração — Vertex AI não configurado
  if (!vertexAI) {
    if (!DEMO_MODE_ENABLED) {
      res.status(503).json({ error: 'Geração por IA não configurada em produção.' });
      return;
    }
    const content = normalizeProposalContent(buildDemoContent(proposal));
    await saveGeneratedContent(proposalId, content);
    res.json({ content });
    return;
  }

  if (credentialsParseError) {
    res.status(503).json({ error: 'Credenciais do Vertex AI inválidas. Verifique a configuração do servidor.' });
    return;
  }

  const muni = proposal.municipality?.name ?? 'município';
  const ragQuery = [
    proposal.type,
    proposal.theme,
    proposal.objective,
    proposal.competence,
    proposal.justification,
  ].filter(Boolean).join('\n');
  const ragResult = await retrieveLegalContext(ragQuery || `Minuta legislativa municipal de ${muni}`);
  const legalContext = ragResult?.context || 'Nenhum contexto normativo municipal foi encontrado pelo RAG para esta minuta.';

  const systemInstruction = `Você é um especialista em técnica legislativa municipal brasileira.
Gere uma minuta legislativa completa e tecnicamente correta para a Câmara Municipal de ${muni}.
Use linguagem jurídica formal, respeite as normas da ABNT NBR 6544 e da Lei Complementar nº 95/1998.
Baseie-se na Lei Orgânica Municipal e na competência municipal conforme CF/88 Art. 30.
Use o Contexto Auxiliar das leis municipais de Nova Veneza como fonte normativa local. Se ele for insuficiente,
não invente artigos, leis, ementas ou URLs; prefira texto neutro e tecnicamente seguro.
Retorne SOMENTE o JSON solicitado, sem nenhum texto antes ou depois, sem blocos de código markdown.

RESTRIÇÕES ABSOLUTAS:
1. Gere SOMENTE conteúdo jurídico-legislativo formal e compatível com o ordenamento jurídico brasileiro.
2. Não inclua linguagem ofensiva, discriminatória, político-partidária ou inconstitucional.
3. Não invente normas. Se não houver base, gere texto neutro e tecnicamente correto.
4. Quando usar uma fonte do Contexto Auxiliar, inclua o Título e a URL no campo "citacoes" do artigo correspondente.
5. Retorne SEMPRE o JSON solicitado, sem texto adicional.

Contexto Auxiliar das leis municipais de Nova Veneza:
${legalContext}`;

  const userMessage = `Gere a minuta legislativa com base nos seguintes dados:

Município: ${muni}
Tipo: ${proposal.type}
Tema: ${proposal.theme ?? 'Não informado'}
Objetivo: ${proposal.objective ?? 'Não informado'}
Competência municipal: ${proposal.competence ?? 'Não informada'}
Impacto financeiro: ${proposal.hasFinancialImpact ? `Sim — ${proposal.estimatedImpact ?? 'sem estimativa'}` : 'Não'}
Justificativa: ${proposal.justification ?? 'Não informada'}

Retorne exatamente neste formato JSON, sem nenhum texto adicional:
{
  "ementa": "resumo objetivo em uma frase",
  "preambulo": "fórmula legislativa padrão",
  "artigos": [
    { "id": 1, "numero": "Art. 1º", "texto": "...", "citacoes": [{ "titulo": "título da lei usada", "url": "URL da lei usada" }] }
  ],
  "vigencia": "cláusula de vigência",
  "revogacao": "cláusula revogatória"
}`;

  try {
    const model = vertexAI.getGenerativeModel({ model: MODEL, systemInstruction });
    const chat  = model.startChat();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), GENERATE_TIMEOUT_MS)
    );

    const result = await Promise.race([chat.sendMessage(userMessage), timeoutPromise]);

    const raw = (result as any).response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let content: any;
    try {
      content = JSON.parse(raw);
    } catch {
      content = JSON.parse(extractJson(raw));
    }

    // Garante que artigos têm id e numero corretos
    if (Array.isArray(content.artigos)) {
      content.artigos = content.artigos.map((a: any, i: number) => ({
        ...a,
        id: i + 1,
        numero: a.numero ?? `Art. ${ordinal(i + 1)}`,
        citacoes: a.citacoes ?? [],
      }));
    }

    content = normalizeProposalContent(content);
    await saveGeneratedContent(proposalId, content);

    res.json({ content });
    void logAudit({ userId: (req as AuthRequest).user.userId, action: 'PROPOSAL_GENERATED', entityType: 'PROPOSAL', entityId: proposalId, ip: req.ip });
  } catch (error: any) {
    console.error('Erro geração Vertex AI:', error);
    if (error?.message === 'TIMEOUT') {
      res.status(504).json({ error: 'A geração da minuta demorou mais que o esperado. Tente novamente.' });
      return;
    }
    if (error?.message === 'JSON_NOT_FOUND') {
      res.status(500).json({ error: 'O modelo retornou um formato inesperado. Tente novamente.' });
      return;
    }
    res.status(500).json({ error: 'Não foi possível gerar a minuta. Tente novamente em alguns minutos.' });
  }
});

export default router;
