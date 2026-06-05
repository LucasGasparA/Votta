import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma/client.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/mailer.js';
import { logAudit } from '../services/audit.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Muitos cadastros deste IP. Aguarde 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas solicitações de recuperação. Aguarde 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { email, password, name } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'E-mail já cadastrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || 'Usuário' },
    });

    const token = signToken(user.id, user.role);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
    void sendWelcomeEmail(user.email, user.name).catch(() => {});
  } catch (error) {
    console.error('❌ Erro ao registrar:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = signToken(user.id, user.role);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
    void logAudit({ userId: user.id, action: 'LOGIN', ip: req.ip });
  } catch (error) {
    console.error('❌ Erro ao logar:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { path: '/', sameSite: COOKIE_OPTIONS.sameSite, secure: COOKIE_OPTIONS.secure });
  res.json({ ok: true });
});

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// POST /auth/forgot-password
router.post('/forgot-password', forgotLimiter, async (req: Request, res: Response) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { email } = parsed.data;

  // Always respond with success to avoid leaking which emails exist
  res.json({ ok: true });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashed, resetTokenExpiry: expiry },
    });

    await sendPasswordResetEmail(email, rawToken);
  } catch {
    // silencioso — não expõe se o e-mail existe
  }
});

// POST /auth/reset-password
router.post('/reset-password', forgotLimiter, async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { token, password } = parsed.data;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashed,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
});

router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const userId = String((req as AuthRequest).user.userId);
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword:     z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

router.put('/password', requireAuth, async (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const userId = String((req as AuthRequest).user.userId);
  const { currentPassword, newPassword } = parsed.data;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ error: 'Senha atual incorreta' });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

export default router;
