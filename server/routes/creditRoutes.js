import express from 'express';
import { calculateCreditScore, generateCAM } from '../services/creditScoringService.js';
import dataStore from '../db/dataStore.js';
import { optionalAuth, requireShopAccess } from '../middleware/auth.js';

const router = express.Router();
router.use(optionalAuth);
router.use(requireShopAccess);

// Get current alternative credit score & factor breakdown
router.get('/', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({
        success: true,
        status: 'insufficient_data',
        isUnrated: true,
        totalScore: null,
        score: null,
        ratingBand: 'unrated',
        ratingLabel: 'अमूल्यांकित (Unrated — New Registration)',
        ratingBadge: 'Unrated',
        message: 'Unrated — log your first week of sales to unlock your Credit Score'
      });
    }

    const [shop, txs] = await Promise.all([
      dataStore.getShopById(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const scoreData = calculateCreditScore(shop, txs && txs.length > 0 ? txs : null);
    res.json({ success: true, ...scoreData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export Banker Credit Appraisal Memo (CAM) in Standard Underwriting JSON format
router.get(['/:shopId/cam', '/cam'], async (req, res) => {
  try {
    const shopId = req.params.shopId || req.query.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    const [shop, txs] = await Promise.all([
      dataStore.getShopById(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const cam = generateCAM(shop, txs && txs.length > 0 ? txs : null);
    res.json({ success: true, cam });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive score simulation (e.g. "What if I recover ₹5,000 udhaar and log 30 days?")
router.post('/simulate', async (req, res) => {
  try {
    const shopId = req.body.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }
    const {
      additionalLoggingDays = 0,
      udhaarRecoveryAmount = 0,
      targetUpiSharePct = 0
    } = req.body;

    const [shop, txs] = await Promise.all([
      dataStore.getShopById(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const baseData = calculateCreditScore(shop, txs && txs.length > 0 ? txs : null);
    let projectedDelta = 0;

    // Logging days impact
    if (additionalLoggingDays > 0) {
      projectedDelta += Math.min(35, Math.round(additionalLoggingDays * 0.8));
    }

    // Udhaar recovery impact
    if (udhaarRecoveryAmount > 0) {
      projectedDelta += Math.min(28, Math.round((udhaarRecoveryAmount / 5000) * 15));
    }

    // UPI digital share increase impact
    if (targetUpiSharePct > (baseData.metrics?.digitalSharePct || 0)) {
      const upiDiff = targetUpiSharePct - (baseData.metrics?.digitalSharePct || 0);
      projectedDelta += Math.min(25, Math.round(upiDiff * 0.6));
    }

    const currentScore = baseData.totalScore;
    const projectedScore = currentScore === null ? null : Math.min(850, currentScore + projectedDelta);

    res.json({
      success: true,
      currentScore,
      projectedScore,
      projectedDelta,
      simulationBreakdown: {
        loggingDaysGain: Math.min(35, Math.round(additionalLoggingDays * 0.8)),
        udhaarRecoveryGain: udhaarRecoveryAmount > 0 ? Math.min(28, Math.round((udhaarRecoveryAmount / 5000) * 15)) : 0,
        digitalAdoptionGain: targetUpiSharePct > (baseData.metrics?.digitalSharePct || 0) 
          ? Math.min(25, Math.round((targetUpiSharePct - (baseData.metrics?.digitalSharePct || 0)) * 0.6)) 
          : 0
      },
      advice: projectedDelta > 30 
        ? 'Outstanding! This simulation elevates you to the next banking tier, significantly reducing your MUDRA loan interest rate.'
        : 'Steady progress. Maintaining consistent daily records builds verifiable alternative credit standing.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
