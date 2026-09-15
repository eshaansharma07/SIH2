import express from 'express';
import { calculateCreditScore } from '../services/creditScoringService.js';
import { getTransactionsCollection } from '../db/mongoClient.js';

const router = express.Router();

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

    let txs = null;
    try {
      const col = await getTransactionsCollection();
      if (col) {
        txs = await col.find({ shop_id: shopId }).sort({ date: -1 }).toArray();
      }
    } catch (mongoErr) {
      console.warn('[MongoDB Atlas] Fallback to SQLite for credit score:', mongoErr.message);
    }

    const scoreData = calculateCreditScore(shopId, txs && txs.length > 0 ? txs : null);
    res.json({ success: true, ...scoreData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive score simulation (e.g. "What if I recover ₹5,000 udhaar and log 30 days?")
router.post('/simulate', (req, res) => {
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

    const baseData = calculateCreditScore(shopId);
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
    if (targetUpiSharePct > baseData.metrics.digitalSharePct) {
      const upiDiff = targetUpiSharePct - baseData.metrics.digitalSharePct;
      projectedDelta += Math.min(25, Math.round(upiDiff * 0.6));
    }

    const currentScore = baseData.totalScore;
    const projectedScore = currentScore === null ? null : Math.min(850, currentScore + projectedDelta);

    res.json({
      success: true,
      isUnrated: baseData.isUnrated || false,
      currentScore,
      projectedScore,
      delta: projectedDelta,
      simulationImpacts: [
        {
          action: `Maintaining daily logs for next ${additionalLoggingDays} days`,
          points: `+${Math.min(35, Math.round(additionalLoggingDays * 0.8))} pts`
        },
        {
          action: `Recovering ₹${Number(udhaarRecoveryAmount).toLocaleString('en-IN')} pending customer credit`,
          points: `+${Math.min(28, Math.round((udhaarRecoveryAmount / 5000) * 15))} pts`
        },
        {
          action: `Increasing digital UPI sales to ${targetUpiSharePct}%`,
          points: `+${Math.min(25, Math.round(Math.max(0, targetUpiSharePct - baseData.metrics.digitalSharePct) * 0.6))} pts`
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
