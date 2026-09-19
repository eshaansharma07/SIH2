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
    service: 'Vyapaar Setu API',
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
  ['/ondc', ondcRoutes],
  ['/accounting', accountingRoutes],
  ['/admin', adminRoutes]
];

for (const [routePath, router] of routeMap) {
  app.use(`/api${routePath}`, router);
  app.use(routePath, router);
}

// Catch-all 404 handler for API routes (returns JSON so client fetch won't fail on HTML parsing)
app.all(['/api/*', '/api'], (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Root fallback
app.get('/', (req, res) => {
  res.send('Vyapaar Setu API Server is running');
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

const isTestRun = process.env.NODE_ENV === 'test' || 
  process.execArgv.some(a => a.includes('test')) || 
  process.argv.some(a => a.includes('test'));

if (!process.env.VERCEL && !isTestRun) {
  app.listen(PORT, () => {
    console.log(`🚀 Vyapaar Setu Backend Server running at http://localhost:${PORT}`);
  });
}

export default app;
