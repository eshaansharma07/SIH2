import express from 'express';
import { getAllSchemes, matchSchemesForShop } from '../services/schemeMatcherService.js';
import { syncGovernmentSchemes, ingestCustomCircular, getScraperStatus } from '../services/schemeScraperService.js';
import dataStore from '../db/dataStore.js';
import { SCHEMES } from '../db/schemesData.js';

const router = express.Router();

// Get all schemes (Filterable scheme library from dynamic database + statutory fallback)
router.get('/', (req, res) => {
  try {
    const { category, maxAmount } = req.query;
    const schemes = getAllSchemes({ category, maxAmount });
    res.json({ success: true, count: schemes.length, schemes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Match schemes against shop profile and credit readiness
router.get('/match', (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({ success: true, shopId: null, eligibleCount: 0, schemes: [] });
    }
    const matchResults = matchSchemesForShop(shopId);
    res.json({ success: true, ...matchResults });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Scraper Status & Health Check
router.get('/status', async (req, res) => {
  try {
    const status = await getScraperStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger Live Scraping & Synchronization from Government Sources (PIB, MyScheme, MoMSME)
router.post('/sync', async (req, res) => {
  try {
    const syncResult = await syncGovernmentSchemes();
    res.json(syncResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ingest Custom / Evaluator Simulated Government Circular
router.post('/scrape-custom', async (req, res) => {
  try {
    const result = await ingestCustomCircular(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Single scheme detail
router.get('/:id', async (req, res) => {
  try {
    const scheme = (await dataStore.getSchemeById(req.params.id)) || SCHEMES.find(s => s.id === req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found' });
    }
    res.json({ success: true, scheme });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
