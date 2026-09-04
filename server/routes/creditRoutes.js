import express from 'express';
import { calculateCreditScore } from '../services/creditScoringService.js';

const router = express.Router();

// Get current alternative credit score & factor breakdown
router.get('/', (req, res) => {
  try {
    const shopId = req.query.shopId || 'ramesh-kirana';
    const scoreData = calculateCreditScore(shopId);
    res.json({ success: true, ...scoreData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive score simulation (e.g. "What if I recover ₹5,000 udhaar and log 30 days?")
router.post('/simulate', (req, res) => {
  try {
    const shopId = req.body.shopId || 'ramesh-kirana';
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

    const projectedScore = Math.min(850, baseData.totalScore + projectedDelta);

    res.json({
      success: true,
      currentScore: baseData.totalScore,
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
