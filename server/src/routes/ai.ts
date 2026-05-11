import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { VertexAI } from '@google-cloud/vertexai';
import { requireAuth, AuthRequest } from '../utils/authMiddleware.js';

const router = Router();
router.use(requireAuth);

const chatSchema = z.object({
  proposalId: z.string().optional(),
  message: z.string().min(1, 'Mensagem não pode ser vazia').max(2000),
  promptContext: z.string().max(20000).optional(),
});

function zodError(error: z.ZodError): string {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  return issues[0]?.message ?? 'Dados inválidos';
}

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION   = process.env.GCP_LOCATION || 'us-central1';
const MODEL      = process.env.GCP_MODEL    || 'gemini-1.5-pro';
const LLM_TIMEOUT_MS = 30_000;

const vertexAI = PROJECT_ID
  ? new VertexAI({ project: PROJECT_ID, location: LOCATION })
  : null;

router.post('/chat', async (req: Request, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }

  const { message, promptContext } = parsed.data;

  if (!vertexAI) {
    res.json({
      type: 'response',
      text: `[Modo demonstração — configure GCP_PROJECT_ID para usar o Vertex AI]\n\nSua pergunta: "${message}"\n\nResposta simulada: Para esta proposição, recomenda-se verificar a conformidade com o Art. 145, VI da Lei Orgânica Municipal e o Art. 30 da Constituição Federal, que trata das competências municipais.`,
    });
    return;
  }

  try {
    const systemInstruction = `Você é um Assistente Jurídico especializado em técnica legislativa municipal (cidade de Nova Veneza - SC).
Avalie minutas legislativas, sugira melhorias estruturais, verifique viabilidade constitucional e sugira citações.
Sempre justifique citando fundamentações (ex: LOM Art. 145, CF Art. 30).
Se identificar vícios de competência, alerte sobre inconstitucionalidade.
Se não encontrar base normativa clara para um ponto, diga explicitamente que não encontrei referência normativa suficiente e recomende consultar a Procuradoria Municipal antes de prosseguir.
Seja conciso e objetivo.

Contexto da proposta: ${promptContext || 'Sem contexto fornecido.'}`;

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

export default router;
