import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client.js';
import { AuthRequest } from './auth.js';

function effectivePlan(plan: string, planExpiresAt: Date | null): string {
  if (planExpiresAt && planExpiresAt < new Date()) return 'BASIC';
  return plan;
}

export function requirePlan(minPlan: 'PRO') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthRequest).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }

    if (effectivePlan(user.plan, user.planExpiresAt) === 'BASIC') {
      res.status(403).json({
        error: 'Esta funcionalidade está disponível apenas no Plano Profissional.',
        upgrade: true,
      });
      return;
    }

    next();
  };
}

export async function getUserPlan(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!user) return 'BASIC';
  return effectivePlan(user.plan, user.planExpiresAt);
}
