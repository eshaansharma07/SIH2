import express from 'express';
import { WHOLESALE_CATALOG, WHOLESALE_CATEGORIES } from '../db/wholesaleCatalogData.js';

const router = express.Router();

const ONDC_DISCLOSURE = {
  isMock: true,
  protocol: 'Open Network for Digital Commerce (ONDC) B2B Protocol v2.0 (Beckn Compliant)',
  reason: 'Simulates direct-from-FPO and manufacturer wholesale procurement prices to evaluate margin expansion for rural micro-enterprises without local middleman markups.'
};

/**
 * Format catalog item with computed savings and profit margins
 */
function enrichCatalogItem(item) {
  const savingsPerUnit = Math.max(0, item.localMandiPrice - item.ondcB2BPrice);
  const savingsPercent = item.localMandiPrice > 0
    ? Math.round((savingsPerUnit / item.localMandiPrice) * 100)
    : 0;
  const ondcMargin = item.mrp > 0
    ? Math.round(((item.mrp - item.ondcB2BPrice) / item.mrp) * 100)
    : 0;
  const mandiMargin = item.mrp > 0
    ? Math.round(((item.mrp - item.localMandiPrice) / item.mrp) * 100)
    : 0;

  return {
    ...item,
    savingsPerUnit,
    savingsPercent,
    ondcMarginPercent: ondcMargin,
    localMarginPercent: mandiMargin,
    extraMarginPercent: Math.max(0, ondcMargin - mandiMargin)
  };
}

/**
 * GET /api/ondc/wholesale-catalog
 * Returns B2B wholesale commodities with computed price advantages
 */
router.get('/wholesale-catalog', (req, res) => {
  try {
    const { category, search } = req.query;

    let items = WHOLESALE_CATALOG.map(enrichCatalogItem);

    if (category && category !== 'all') {
      items = items.filter(it => it.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase().trim();
      items = items.filter(it =>
        it.itemName.toLowerCase().includes(q) ||
        (it.itemNameHindi && it.itemNameHindi.toLowerCase().includes(q)) ||
        it.supplierName.toLowerCase().includes(q)
      );
    }

    const totalPotentialSavings = items.reduce((s, it) => s + it.savingsPerUnit * it.minOrderQty, 0);

    res.json({
      success: true,
      totalItems: items.length,
      categories: WHOLESALE_CATEGORIES,
      catalog: items,
      summary: {
        avgSavingsPct: Math.round(items.reduce((s, it) => s + it.savingsPercent, 0) / (items.length || 1)),
        totalOrderSavingsOnMinQty: Math.round(totalPotentialSavings)
      },
      mockDataDisclosure: ONDC_DISCLOSURE
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ondc/compare/:itemName
 * Deep comparison of a commodity: local mandi price vs ONDC B2B price
 */
router.get('/compare/:itemName', (req, res) => {
  try {
    const itemParam = decodeURIComponent(req.params.itemName || '').toLowerCase().trim();

    // Find item by ID or name
    let found = WHOLESALE_CATALOG.find(it => it.id.toLowerCase() === itemParam);
    if (!found) {
      found = WHOLESALE_CATALOG.find(it =>
        it.itemName.toLowerCase().includes(itemParam) ||
        (it.itemNameHindi && it.itemNameHindi.toLowerCase().includes(itemParam))
      );
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: `Commodity '${req.params.itemName}' not found in ONDC wholesale catalog.`
      });
    }

    const item = enrichCatalogItem(found);

    // Standard volume modeling: 10 units per month for rural kirana
    const sampleMonthlyUnits = 10;
    const monthlyLocalSpend = item.localMandiPrice * sampleMonthlyUnits;
    const monthlyOndcSpend = item.ondcB2BPrice * sampleMonthlyUnits;
    const monthlySavings = monthlyLocalSpend - monthlyOndcSpend;
    const annualSavings = monthlySavings * 12;

    res.json({
      success: true,
      item,
      procurementAnalysis: {
        sampleVolume: `${sampleMonthlyUnits} ${item.unit}s / month`,
        monthlyLocalCost: monthlyLocalSpend,
        monthlyOndcCost: monthlyOndcSpend,
        monthlySavings,
        annualizedSavings: annualSavings,
        extraGrossProfitPerSale: item.savingsPerUnit,
        marginExpansionPct: `+${item.extraMarginPercent}%`
      },
      supplierProfile: {
        name: item.supplierName,
        rating: item.supplierRating,
        location: item.hubLocation,
        deliveryTime: `${item.deliveryDays} business day(s)`,
        leadTimeHours: item.leadTimeHours,
        paymentTerms: item.paymentTerms
      },
      mockDataDisclosure: ONDC_DISCLOSURE
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
