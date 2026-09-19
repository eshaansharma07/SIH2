import express from 'express';
import dataStore from '../db/dataStore.js';
import { calculateCreditScore } from '../services/creditScoringService.js';
import { matchSchemesForShop } from '../services/schemeMatcherService.js';
import { seedDatabase } from '../db/seed.js';

const router = express.Router();

// Generate Formal Bankable Financial Dossier aligned with RBI PSL Guidelines
router.get('/generate', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    let shop = await dataStore.getShopById(shopId);
    if (!shop && (shopId === 'ramesh-kirana' || String(shopId).includes('demo'))) {
      try {
        seedDatabase();
        shop = await dataStore.getShopById(shopId);
      } catch (e) {
        console.warn('Auto-seed on empty shop in dossier:', e.message);
      }
    }

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    let txs = await dataStore.getTransactions(shopId, { limit: 1000 });
    if ((!txs || txs.length === 0) && (shopId === 'ramesh-kirana' || String(shopId).includes('demo'))) {
      try {
        seedDatabase();
        txs = await dataStore.getTransactions(shopId, { limit: 1000 });
      } catch (e) {}
    }
    const creditData = calculateCreditScore(shop, txs && txs.length > 0 ? txs : null);
    const schemeData = matchSchemesForShop(shopId);

    const monthlySummary = {};
    txs.forEach(t => {
      const m = t.date ? t.date.substring(0, 7) : 'Unknown';
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

    const districtCode = (shop.district || 'IND').substring(0, 3).toUpperCase();
    const dossierNumber = `SS-DOC-${districtCode}-${Date.now().toString().slice(-6)}`;
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
        issuingPlatform: 'Vyapaar Setu — Alternative Credit & Financial Structuring Platform',
        pslClassification: 'Micro-Enterprise (Trading / Services) — Eligible for RBI PSL 7.5% Sub-target (FIDD.CO.Plan.BC.5/04.09.01/2020-21)',
        endorsedFor: 'Priority Sector Lending (PSL) Micro-Enterprise Credit Appraisal (Nayak Committee Cash-Flow Method)',
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
          maxScore: 900,
          cmrRank: creditData.cmrRank,
          cmrLabel: creditData.cmrLabel,
          statutoryGuidelines: creditData.statutoryGuidelines,
          ratingLabel: creditData.ratingLabel,
          ratingBadge: creditData.ratingBadge,
          factors: creditData.factors
        },
        financialAudit: {
          period: '90 Days Cash Flow & Digital Audit',
          totalGrossSales: creditData.metrics?.totalIncome || 0,
          totalExpenses: creditData.metrics?.totalExpense || 0,
          netOperatingSurplus: creditData.metrics?.netSurplus || 0,
          digitalCollectionPercentage: `${creditData.metrics?.digitalSharePct || 0}%`,
          customerUdhaarPending: creditData.metrics?.totalUdhaarPending || 0,
          udhaarRecoveryRate: `${creditData.metrics?.udhaarRecoveryRate || 100}%`,
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
