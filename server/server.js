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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vyapaar Saathi API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/shop', shopRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/credit-score', creditRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/advisor', advisoryRoutes);
app.use('/api/dossier', dossierRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.send('Vyapaar Saathi API Server is running on port ' + PORT);
});

// Auto seed if running fresh
try {
  seedDatabase();
} catch (e) {
  console.log('Seed check:', e.message);
}

app.listen(PORT, () => {
  console.log(`🚀 Vyapaar Saathi Backend Server running at http://localhost:${PORT}`);
});
