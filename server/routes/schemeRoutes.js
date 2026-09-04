import express from 'express';
import { getAllSchemes, matchSchemesForShop } from '../services/schemeMatcherService.js';
import { SCHEMES } from '../db/schemesData.js';

const router = express.Router();

// Get all schemes (Filterable scheme library)
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
    const shopId = req.query.shopId || 'ramesh-kirana';
    const matchResults = matchSchemesForShop(shopId);
    res.json({ success: true, ...matchResults });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single scheme detail
router.get('/:id', (req, res) => {
  try {
    const scheme = SCHEMES.find(s => s.id === req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found' });
    }
    res.json({ success: true, scheme });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
