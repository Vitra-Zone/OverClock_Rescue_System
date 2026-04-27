import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import incidentRoutes from './routes/incidents';
import aiRoutes from './routes/ai';
import fallbackRoutes from './routes/fallback';
import notificationRoutes from './routes/notifications';
import touristRoutes from './routes/tourists';
import { isFirebaseEnabled } from './services/firebaseAdmin';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

function normalizeOrigin(value: string) {
  return value.trim().replace(/^['\"]|['\"]$/g, '').replace(/\/+$/, '').toLowerCase();
}

const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):(\d{2,5})$/i;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);
    if (
      localOriginPattern.test(origin) ||
      corsOrigins.includes('*') ||
      corsOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'Hackdays Assist API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      incidents: 'GET /api/incidents',
      aiTriage: 'POST /api/ai/triage',
      aiOrchestrate: 'POST /api/ai/orchestrate',
      aiAnalytics: 'POST /api/ai/analytics',
      aiOperationalDecision: 'POST /api/ai/operational-decision',
      aiAgentHealth: 'POST /api/ai/agent-health',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Hackdays Assist API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiMode: 'rule_based',
    firebaseMode: isFirebaseEnabled() ? 'enabled' : 'disabled',
    staffAuthRequired: process.env.STAFF_AUTH_REQUIRED === 'true',
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/incidents', incidentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/fallback', fallbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tourists', touristRoutes);

// ─── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', timestamp: new Date().toISOString() });
});

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error', timestamp: new Date().toISOString() });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🚨 Hackdays Assist — API Server         ║');
  console.log(`║   Running at http://localhost:${PORT}            ║`);
  console.log('║   AI Mode: Rule-based Local                   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

export default app;
