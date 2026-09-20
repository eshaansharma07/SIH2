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
import accountingRoutes from './routes/accountingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'x-admin-access']
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
app.get(['/api/health', '/health'], async (req, res) => {
  let mongoStatus = 'unconfigured';
  let shopCount = 0;
  try {
    const { getMongoDb } = await import('./db/mongoClient.js');
    const db = await getMongoDb();
    if (db) {
      mongoStatus = 'connected';
      shopCount = await db.collection('shops').countDocuments();
    } else {
      mongoStatus = 'fallback_sqlite';
    }
  } catch (err) {
    mongoStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'SaakhSetu API',
    version: '1.0.0',
    mongoStatus,
    shopCount,
    time: new Date().toISOString()
  });
});

// Mount Routes on both /api and root paths for seamless serverless rewrite handling
const routeMap = [
  ['/auth', shopRoutes],
  ['/shop', shopRoutes],
  ['/shops', shopRoutes],
  ['/transactions', transactionRoutes],
  ['/credit-score', creditRoutes],
  ['/schemes', schemeRoutes],
  ['/advisor', advisoryRoutes],
  ['/dossier', dossierRoutes],
  ['/customers', customerRoutes],
  ['/dpi', dpiRoutes],
  ['/ondc', ondcRoutes],
  ['/accounting', accountingRoutes],
  ['/admin', adminRoutes]
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

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 SaakhSetu Backend Server running at http://localhost:${PORT}`);
  });
}

export default app;
