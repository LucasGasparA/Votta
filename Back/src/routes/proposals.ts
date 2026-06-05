import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';
const router = Router();
router.use(requireAuth);

const PROPOSAL_TYPES = ['pl_ordinaria', 'pl_complementar', 'decreto', 'indicacao'] as const;

const createSchema = z.object({
  title: z.string().optional(),
  type: z.enum(PROPOSAL_TYPES),
  theme: z.string().max(500).optional(),
  objective: z.string().max(5000).optional(),
  competence: z.string().max(100).optional(),
  hasFinancialImpact: z.boolean().optional(),
  estimatedImpact: z.string().max(100).optional(),
  justification: z.string().min(50, 'Justificativa deve ter pelo menos 50 caracteres').max(10000).optional(),
  municipalityId: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().max(500).optional(),
  type: z.enum(PROPOSAL_TYPES).optional(),
  theme: z.string().max(500).optional(),
  objective: z.string().max(5000).optional(),
  competence: z.string().max(100).optional(),
  hasFinancialImpact: z.boolean().optional(),
  estimatedImpact: z.string().max(100).optional(),
  justification: z.string().max(10000).optional(),
  content: z.string().optional(),
  status: z.string().max(50).optional(),
});

function zodError(error: z.ZodError): string {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  return issues[0]?.message ?? 'Dados inválidos';
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
        include: { municipality: true },
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

  const { title, type, theme, objective, competence, hasFinancialImpact, estimatedImpact, justification, municipalityId } = parsed.data;
  const userId = (req as AuthRequest).user.userId;

  try {
    let munId = municipalityId;
    if (!munId) {
      const mun = await prisma.municipality.findFirst();
      if (!mun) {
        const newMun = await prisma.municipality.create({ data: { name: 'Nova Veneza', state: 'SC' } });
        munId = newMun.id;
      } else {
        munId = mun.id;
      }
    }

    const proposal = await prisma.proposal.create({
      data: {
        title: title || 'Nova Proposição',
        type,
        theme,
        objective,
        competence,
        hasFinancialImpact,
        estimatedImpact: estimatedImpact ? String(estimatedImpact) : null,
        justification,
        userId,
        municipalityId: munId!,
      },
    });
    res.json(proposal);
    void logAudit({ userId, action: 'PROPOSAL_CREATED', entityType: 'PROPOSAL', entityId: proposal.id, detail: { title: proposal.title, municipalityId: proposal.municipalityId }, ip: req.ip });
  } catch (error) {
    console.error(error);
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

    const proposal = await prisma.proposal.update({ where: { id: existing.id }, data: parsed.data });

    const versionCount = await prisma.proposalVersion.count({ where: { proposalId: proposal.id } });
    await prisma.proposalVersion.create({
      data: {
        proposalId: proposal.id,
        content: proposal.content || '{}',
        versionNumber: versionCount + 1,
      },
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
