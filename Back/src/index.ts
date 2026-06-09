import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

process.on('unhandledRejection', (reason) => {
  console.error('❌ UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ UncaughtException:', err);
  process.exit(1);
});

import proposalRoutes from './routes/proposals.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import auditRoutes from './routes/audit.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET não definido ou fraco (mínimo 32 caracteres) — servidor abortado por segurança.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter((o): o is string => Boolean(o));

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const isProd = process.env.NODE_ENV === 'production';
const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

app.use((req, res, next) => {
  if (!isProd || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin || req.headers.referer || '';
  if (frontendUrl && !origin.startsWith(frontendUrl)) {
    res.status(403).json({ error: 'Origem não autorizada' });
    return;
  }
  next();
});

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`📍 ${req.method} ${req.path}`);
    next();
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Erro no servidor:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor na porta ${port}`);
});
