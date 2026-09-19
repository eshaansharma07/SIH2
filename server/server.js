import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import shopRoutes from './routes/shopRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import advisoryRoutes from './routes/advisoryRoutes.js';
import dossierRoutes from './routes/dossierRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import dpiRoutes from './routes/dpiRoutes.js';
import ondcRoutes from './routes/ondcRoutes.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent stale HTTP / CDN / 304 caching across serverless Lambda instances
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'SaakhSetu API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Mount Routes on both /api and root paths for seamless serverless rewrite handling
const routeMap = [
  ['/shop', shopRoutes],
  ['/shops', shopRoutes],
  ['/transactions', transactionRoutes],
  ['/credit-score', creditRoutes],
  ['/schemes', schemeRoutes],
  ['/advisor', advisoryRoutes],
  ['/dossier', dossierRoutes],
  ['/customers', customerRoutes],
  ['/dpi', dpiRoutes],
  ['/ondc', ondcRoutes]
];

for (const [routePath, router] of routeMap) {
  app.use(`/api${routePath}`, router);
  app.use(routePath, router);
}

// Root fallback
app.get('/', (req, res) => {
  res.send('SaakhSetu API Server is running');
});

// Express error handling middleware
app.use((err, req, res, next) => {
  console.error('[SaakhSetu API Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
  }
});

// Process-level safety listeners
process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err);
});

// Auto seed if running fresh
try {
  seedDatabase();
} catch (e) {
  console.log('Seed check:', e.message);
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SaakhSetu Backend Server running at http://localhost:${PORT}`);
  });
}

export default app;
