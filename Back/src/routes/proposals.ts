import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
import { validateProposalContentJson } from '../services/proposalContent.js';
const router = Router();
router.use(requireAuth);

const PROPOSAL_TYPES = ['pl_ordinaria', 'pl_complementar', 'decreto', 'indicacao'] as const;
const COMPETENCE_VALUES = ['exclusiva', 'concorrente', 'incerto'] as const;
const STATUS_VALUES = ['DRAFT', 'REVIEW', 'APPROVED'] as const;

const DEFAULT_MUNICIPALITY = {
  ibgeId: '4211603',
  name: 'Nova Veneza',
  state: 'SC',
};

const createSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  type: z.enum(PROPOSAL_TYPES),
  theme: z.string().trim().max(500).optional(),
  objective: z.string().trim().max(5000).optional(),
  competence: z.enum(COMPETENCE_VALUES).optional(),
  hasFinancialImpact: z.boolean().optional(),
  estimatedImpact: z.string().trim().max(100).optional(),
  justification: z.string().trim().min(50, 'Justificativa deve ter pelo menos 50 caracteres').max(10000).optional(),
  municipalityId: z.string().uuid().optional(),
  municipalityIbgeId: z.string().regex(/^\d{7}$/, 'Código IBGE inválido').optional(),
  municipalityName: z.string().trim().min(2).max(120).optional(),
  municipalityState: z.string().trim().length(2).optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  type: z.enum(PROPOSAL_TYPES).optional(),
  theme: z.string().trim().max(500).optional(),
  objective: z.string().trim().max(5000).optional(),
  competence: z.enum(COMPETENCE_VALUES).optional(),
  hasFinancialImpact: z.boolean().optional(),
  estimatedImpact: z.string().trim().max(100).optional(),
  justification: z.string().trim().max(10000).optional(),
  content: z.string().optional(),
  status: z.enum(STATUS_VALUES).optional(),
});

function zodError(error: z.ZodError): string {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  return issues[0]?.message ?? 'Dados inválidos';
}

async function resolveMunicipality(data: z.infer<typeof createSchema>) {
  if (data.municipalityId) {
    const municipality = await prisma.municipality.findUnique({ where: { id: data.municipalityId } });
    if (!municipality) throw new Error('MUNICIPALITY_NOT_FOUND');
    return municipality.id;
  }

  const ibgeId = data.municipalityIbgeId ?? DEFAULT_MUNICIPALITY.ibgeId;
  const name = data.municipalityName ?? DEFAULT_MUNICIPALITY.name;
  const state = (data.municipalityState ?? DEFAULT_MUNICIPALITY.state).toUpperCase();

  const municipality = await prisma.municipality.upsert({
    where: { ibgeId },
    update: { name, state },
    create: { ibgeId, name, state },
  });

  return municipality.id;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.userId;
    const pageRaw = String(req.query.page || '1');
    const limitRaw = String(req.query.limit || '20');
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(50, Math.max(1, Number(limitRaw) || 20));
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },

        skip,
        take: limit,
      }),
      prisma.proposal.count({ where: { userId } }),
    ]);

    res.json({ proposals, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar proposições' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = String((req as AuthRequest).user.userId);
    const proposal = await prisma.proposal.findFirst({
      where: { id, userId },
      include: { municipality: true },
    });
    if (!proposal) {
      res.status(404).json({ error: 'Proposição não encontrada' });
      return;
    }
    res.json(proposal);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar proposição' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }

  const { title, type, theme, objective, competence, hasFinancialImpact, estimatedImpact, justification } = parsed.data;
  const userId = (req as AuthRequest).user.userId;

  try {
    const munId = await resolveMunicipality(parsed.data);

    const proposal = await prisma.proposal.create({
      data: {
        title: title || theme || 'Nova Proposição',
        type,
        theme,
        objective,
        competence,
        hasFinancialImpact,
        estimatedImpact: estimatedImpact ? String(estimatedImpact) : null,
        justification,
        userId,
        municipalityId: munId,
      },
    });
    res.json(proposal);
    void logAudit({ userId, action: 'PROPOSAL_CREATED', entityType: 'PROPOSAL', entityId: proposal.id, detail: { title: proposal.title, municipalityId: proposal.municipalityId }, ip: req.ip });
  } catch (error: any) {
    if (error?.message === 'MUNICIPALITY_NOT_FOUND') {
      res.status(400).json({ error: 'Município não encontrado.' });
      return;
    }
    console.error('Erro ao criar proposição:', error?.message ?? error);
    res.status(500).json({ error: 'Erro ao criar proposição' });
  }
});

router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = String((req as AuthRequest).user.userId);
    const proposal = await prisma.proposal.findFirst({ where: { id, userId } });
    if (!proposal) {
      res.status(404).json({ error: 'Proposição não encontrada' });
      return;
    }
    const versions = await prisma.proposalVersion.findMany({
      where: { proposalId: id },
      orderBy: { versionNumber: 'desc' },
    });
    res.json(versions);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar versões' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }

  const id = req.params.id as string;
  const userId = String((req as AuthRequest).user.userId);

  try {
    const existing = await prisma.proposal.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Proposição não encontrada' });
      return;
    }

    const updateData = { ...parsed.data };
    if (updateData.content !== undefined) {
      try {
        updateData.content = validateProposalContentJson(updateData.content);
      } catch (error: any) {
        if (error?.message === 'CONTENT_JSON_INVALID') {
          res.status(400).json({ error: 'Conteúdo da minuta deve ser um JSON válido.' });
          return;
        }
        res.status(400).json({ error: 'Conteúdo da minuta possui estrutura inválida.' });
        return;
      }
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({ where: { id: existing.id }, data: updateData });
      if (updateData.content !== undefined && updateData.content !== existing.content) {
        const latest = await tx.proposalVersion.findFirst({
          where: { proposalId: updated.id },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        });
        await tx.proposalVersion.create({
          data: {
            proposalId: updated.id,
            content: updated.content || '{}',
            versionNumber: (latest?.versionNumber ?? 0) + 1,
          },
        });
      }
      return updated;
    });

    res.json(proposal);
    void logAudit({ userId, action: 'PROPOSAL_UPDATED', entityType: 'PROPOSAL', entityId: proposal.id, detail: { title: proposal.title }, ip: req.ip });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar proposição' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id     = req.params.id as string;
  const userId = String((req as AuthRequest).user.userId);
  try {
    const existing = await prisma.proposal.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Proposição não encontrada' });
      return;
    }
    await prisma.proposal.delete({ where: { id: existing.id } });
    res.json({ ok: true });
    void logAudit({ userId, action: 'PROPOSAL_DELETED', entityType: 'PROPOSAL', entityId: existing.id, detail: { title: existing.title }, ip: req.ip });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir proposição' });
  }
});

export default router;
