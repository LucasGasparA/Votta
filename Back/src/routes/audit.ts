import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.userId;

    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id:         true,
        action:     true,
        entityType: true,
        entityId:   true,
        detail:     true,
        ip:         true,
        createdAt:  true,
      },
    });

    res.json({ logs });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria.' });
  }
});

export default router;
