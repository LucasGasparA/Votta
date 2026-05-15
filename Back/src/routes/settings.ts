import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const settingsSchema = z.object({
  exportFormat:          z.enum(['PDF', 'DOCX']).optional(),
  includePageNumbers:    z.boolean().optional(),
  includeGenerationDate: z.boolean().optional(),
  validationAlerts:      z.boolean().optional(),
  unsavedReminder:       z.boolean().optional(),
  emailNotifications:    z.boolean().optional(),
  theme:                 z.enum(['light', 'dark']).optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    try {
      res.json(JSON.parse(user.settings || '{}'));
    } catch {
      res.json({});
    }
  } catch {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
    return;
  }
  const userId = (req as AuthRequest).user.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    const current = (() => {
      try { return JSON.parse(user?.settings || '{}'); } catch { return {}; }
    })();
    const merged = { ...current, ...parsed.data };
    await prisma.user.update({
      where: { id: userId },
      data: { settings: JSON.stringify(merged) },
    });
    res.json(merged);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

export default router;
