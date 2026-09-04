import express from 'express';
import db from '../db/database.js';
import { calculateCreditScore } from '../services/creditScoringService.js';
import { matchSchemesForShop } from '../services/schemeMatcherService.js';

const router = express.Router();

// Generate Bankable Financial Dossier
router.get('/generate', (req, res) => {
  try {
    const shopId = req.query.shopId || 'ramesh-kirana';
    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const creditData = calculateCreditScore(shopId);
    const schemeData = matchSchemesForShop(shopId);

    // Get 90-day transactions summary
    const txs = db.prepare(`
      SELECT * FROM transactions WHERE shop_id = ? ORDER BY date ASC
    `).all(shopId);

    const monthlySummary = {};
    txs.forEach(t => {
      const m = t.date.substring(0, 7);
      if (!monthlySummary[m]) {
        monthlySummary[m] = { month: m, grossSales: 0, stockPurchases: 0, netSurplus: 0, upiSales: 0 };
      }
      if (t.type === 'income') {
        monthlySummary[m].grossSales += t.amount;
        if (t.payment_mode === 'upi') monthlySummary[m].upiSales += t.amount;
      } else if (t.type === 'expense') {
        monthlySummary[m].stockPurchases += t.amount;
      }
    });

    Object.values(monthlySummary).forEach(m => {
      m.netSurplus = m.grossSales - m.stockPurchases;
    });

    const dossierNumber = `VS-${shop.district.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    res.json({
      success: true,
      dossier: {
        dossierNumber,
        issueDate,
        validity: 'Valid for 90 days from date of issue',
        issuingPlatform: 'Vyapaar Saathi — Alternative Credit & Financial Structuring Platform',
        endorsedFor: 'Priority Sector Lending (PSL) & Micro-Enterprise Credit Appraisal',
        shop: {
          id: shop.id,
          name: shop.name,
          ownerName: shop.owner_name,
          tradeName: shop.trade_name,
          tradeType: shop.trade_type,
          village: shop.village,
          district: shop.district,
          state: shop.state,
          vintageYears: shop.vintage_years,
          bankAccount: shop.bank_account_type,
          phone: shop.phone
        },
        creditEvaluation: {
          totalScore: creditData.totalScore,
          maxScore: 850,
          ratingLabel: creditData.ratingLabel,
          ratingBadge: creditData.ratingBadge,
          factors: creditData.factors
        },
        financialAudit: {
          period: '90 Days Cash Flow & Digital Audit',
          totalGrossSales: creditData.metrics.totalIncome,
          totalExpenses: creditData.metrics.totalExpense,
          netOperatingSurplus: creditData.metrics.netSurplus,
          digitalCollectionPercentage: `${creditData.metrics.digitalSharePct}%`,
          customerUdhaarPending: creditData.metrics.totalUdhaarPending,
          udhaarRecoveryRate: `${creditData.metrics.udhaarRecoveryRate}%`,
          monthlyBreakdown: Object.values(monthlySummary)
        },
        recommendedSchemes: schemeData.schemes.filter(s => s.isEligible).slice(0, 3).map(s => ({
          name: s.name,
          maxAmount: s.loanRangeText,
          interestRate: s.interestRate,
          subsidy: s.subsidyText,
          collateral: s.collateralText,
          matchScore: s.matchScore,
          whyQualifies: s.whyYouQualify
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
