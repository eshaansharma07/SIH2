import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import shopRoutes from './routes/shopRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import advisoryRoutes from './routes/advisoryRoutes.js';
import dossierRoutes from './routes/dossierRoutes.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vyapaar Saathi API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Mount Routes on both /api and root paths for seamless serverless rewrite handling
const routeMap = [
  ['/shop', shopRoutes],
  ['/transactions', transactionRoutes],
  ['/credit-score', creditRoutes],
  ['/schemes', schemeRoutes],
  ['/advisor', advisoryRoutes],
  ['/dossier', dossierRoutes]
];

for (const [routePath, router] of routeMap) {
  app.use(`/api${routePath}`, router);
  app.use(routePath, router);
}

// Root fallback
app.get('/', (req, res) => {
  res.send('Vyapaar Saathi API Server is running');
});

// Auto seed if running fresh
try {
  seedDatabase();
} catch (e) {
  console.log('Seed check:', e.message);
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Vyapaar Saathi Backend Server running at http://localhost:${PORT}`);
  });
}

export default app;
