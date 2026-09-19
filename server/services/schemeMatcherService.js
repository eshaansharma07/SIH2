import { SCHEMES } from '../db/schemesData.js';
import db from '../db/database.js';
import dataStore from '../db/dataStore.js';
import { calculateCreditScore } from './creditScoringService.js';

// Map of statutory baseline qualification functions
const baselineLogicMap = new Map(
  SCHEMES.filter(s => typeof s.whyYouQualifyLogic === 'function').map(s => [s.id, s.whyYouQualifyLogic])
);

/**
 * Dynamic rule evaluator for newly scraped or updated government schemes
 */
export function evaluateDynamicRules(rules, shop, creditScore) {
  const reasons = [];
  let score = 75;
  let eligible = true;

  const minVintage = Number(rules?.minVintageYears || 0);
  const minRevenue = Number(rules?.minMonthlyRevenue || 0);
  const minCredit = Number(rules?.minCreditScore || 0);
  const targetTrades = Array.isArray(rules?.targetTradeTypes) && rules.targetTradeTypes.length ? rules.targetTradeTypes : ['all'];

  // 1. Vintage check
  if (shop.vintageYears >= minVintage) {
    score += 8;
    if (minVintage > 0) reasons.push(`Operating for ${shop.vintageYears} years fulfills the ${minVintage}-year vintage benchmark`);
  } else {
    eligible = false;
    reasons.push(`Requires at least ${minVintage} year(s) operating experience (currently ${shop.vintageYears} yrs)`);
  }

  // 2. Revenue check
  if (shop.monthlyRevenue >= minRevenue) {
    score += 8;
    if (minRevenue > 0) reasons.push(`Documented monthly revenue (₹${shop.monthlyRevenue.toLocaleString('en-IN')}) satisfies debt repayment coverage`);
  } else if (minRevenue > 0) {
    score -= 10;
    reasons.push(`Turnover is below recommended minimum ₹${minRevenue.toLocaleString('en-IN')}/month`);
  }

  // 3. Trade type check
  const trade = (shop.trade_type || shop.tradeType || '').toLowerCase();
  const tradeMatch = targetTrades.includes('all') || targetTrades.some(t => trade.includes(t.toLowerCase()) || t.toLowerCase().includes(trade));
  if (tradeMatch) {
    score += 6;
    reasons.push(`Business sector (${trade || 'Rural Micro-Enterprise'}) is explicitly covered under this scheme`);
  } else {
    eligible = false;
    reasons.push(`Scheme is targeted towards: ${targetTrades.join(', ')}`);
  }

  // 4. Alternative credit score check
  if (creditScore && creditScore >= minCredit) {
    score += 6;
    reasons.push(`SaakhSetu Alternative Credit Score (${creditScore}) demonstrates verified repayment capacity`);
  }

  if (eligible && Array.isArray(rules?.qualifyingReasons)) {
    reasons.push(...rules.qualifyingReasons);
  }

  return {
    eligible,
    matchScore: eligible ? Math.min(score, 99) : Math.max(score - 30, 20),
    reasons: reasons.length ? reasons : ["Eligibility determined based on standard non-farm rural enterprise guidelines"]
  };
}

/**
 * Loads current list of schemes: guaranteed statutory baseline merged with dynamic scraped schemes
 */
export function getActiveSchemesList() {
  const dynamicMap = new Map();

  // 1. Seed baseline statutory schemes first
  for (const s of SCHEMES) {
    dynamicMap.set(s.id, { ...s, isScraped: false });
  }

  // 2. Overlay and append dynamic / scraped schemes from database
  try {
    const rows = db.prepare('SELECT * FROM government_schemes ORDER BY is_scraped DESC, created_at DESC').all();
    if (rows && rows.length > 0) {
      for (const r of rows) {
        const norm = dataStore.normalizeSchemeRow(r);
        if (baselineLogicMap.has(norm.id)) {
          norm.whyYouQualifyLogic = baselineLogicMap.get(norm.id);
        }
        dynamicMap.set(norm.id, norm);
      }
    }
  } catch (_) {}

  return Array.from(dynamicMap.values());
}

/**
 * Rule-based Eligibility Engine for Indian Government Schemes
 * Evaluates shop parameters against formal guidelines of schemes like
 * MUDRA, PMEGP, PM SVANidhi, PM Vishwakarma, NRLM, and ODOP, as well as
 * newly scraped real-time initiatives.
 */
export function matchSchemesForShop(shopId) {
  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
  if (!shop) {
    throw new Error('Shop not found');
  }

  const creditResult = calculateCreditScore(shopId);
  const normalizedShop = {
    ...shop,
    vintageYears: shop.vintage_years !== undefined ? Number(shop.vintage_years) : (shop.vintageYears || 0),
    vintage_years: shop.vintage_years !== undefined ? Number(shop.vintage_years) : (shop.vintageYears || 0),
    monthlyRevenue: shop.monthly_revenue !== undefined ? Number(shop.monthly_revenue) : (shop.monthlyRevenue || 0),
    monthly_revenue: shop.monthly_revenue !== undefined ? Number(shop.monthly_revenue) : (shop.monthlyRevenue || 0),
    tradeType: shop.trade_type || shop.tradeType || '',
    trade_type: shop.trade_type || shop.tradeType || '',
    tradeName: shop.trade_name || shop.tradeName || '',
    trade_name: shop.trade_name || shop.tradeName || '',
    ownerCategory: shop.owner_category || shop.ownerCategory || 'general',
    owner_category: shop.owner_category || shop.ownerCategory || 'general',
    state: shop.state || '',
    district: shop.district || '',
    village: shop.village || ''
  };

  const creditScore = creditResult.totalScore;
  const shopState = (normalizedShop.state || '').trim().toLowerCase();

  const schemesToEvaluate = getActiveSchemesList();

  const matchedSchemes = schemesToEvaluate.map(scheme => {
    // Check jurisdiction for state-scoped schemes
    const isStateScheme = scheme.scope === 'state';
    let isStateMatch = true;
    if (isStateScheme && scheme.applicableStates && scheme.applicableStates.length > 0) {
      isStateMatch = scheme.applicableStates.some(st => {
        const s = st.toLowerCase();
        if (s === 'uttar pradesh') {
          return shopState === 'up' || shopState.includes('uttar');
        }
        return (
          shopState === s || 
          shopState.includes(s) || 
          (s === 'maharashtra' && (shopState === 'mh' || shopState.includes('maha'))) || 
          (s === 'tamil nadu' && (shopState === 'tn' || shopState.includes('tamil'))) || 
          (s === 'rajasthan' && (shopState === 'rj' || shopState.includes('raj'))) || 
          (s === 'gujarat' && (shopState === 'gj' || shopState.includes('guj')))
        );
      });
    }

    let qualification;
    if (isStateScheme && !isStateMatch) {
      qualification = {
        eligible: false,
        matchScore: 0,
        reasons: [`State-specific scheme applicable exclusively to enterprises in ${scheme.applicableStates.join(', ')}`]
      };
    } else if (baselineLogicMap.has(scheme.id)) {
      qualification = baselineLogicMap.get(scheme.id)(normalizedShop, creditScore);
    } else if (typeof scheme.whyYouQualifyLogic === 'function') {
      qualification = scheme.whyYouQualifyLogic(normalizedShop, creditScore);
    } else {
      qualification = evaluateDynamicRules(scheme.whyYouQualifyRules, normalizedShop, creditScore);
    }

    return {
      id: scheme.id,
      name: scheme.name,
      shortName: scheme.shortName || scheme.name,
      ministry: scheme.ministry,
      category: scheme.category,
      scope: scheme.scope || 'central',
      applicableStates: scheme.applicableStates || [],
      maxLoanAmount: scheme.maxLoanAmount,
      loanRangeText: scheme.loanRangeText,
      interestRate: scheme.interestRate,
      subsidyText: scheme.subsidyText,
      collateralRequired: scheme.collateralRequired,
      collateralText: scheme.collateralText,
      tenure: scheme.tenure,
      plainLanguageSummary: scheme.plainLanguageSummary,
      plainLanguageSummaryHi: scheme.plainLanguageSummaryHi,
      lastVerified: scheme.lastVerified,
      officialSourceUrl: scheme.officialSourceUrl,
      statutoryReference: scheme.statutoryReference,
      isScraped: Boolean(scheme.isScraped),
      sourcePortal: scheme.sourcePortal || 'official',
      scrapedAt: scheme.scrapedAt,
      isEligible: qualification.eligible,
      matchScore: qualification.matchScore,
      whyYouQualify: qualification.reasons,
      requiredDocuments: scheme.requiredDocuments,
      applicationSteps: scheme.applicationSteps,
      officialPortal: scheme.officialPortal
    };
  });

  // Sort by match score descending (highest match first)
  matchedSchemes.sort((a, b) => b.matchScore - a.matchScore);

  return {
    shopId,
    shopName: shop.name,
    tradeName: shop.trade_name,
    creditScore,
    totalSchemesChecked: schemesToEvaluate.length,
    eligibleCount: matchedSchemes.filter(s => s.isEligible).length,
    schemes: matchedSchemes
  };
}

export function getAllSchemes(filter = {}) {
  let results = getActiveSchemesList();

  if (filter.category && filter.category !== 'all') {
    const cat = filter.category.toLowerCase();
    results = results.filter(s => (s.category || '').toLowerCase().includes(cat));
  }

  if (filter.maxAmount) {
    results = results.filter(s => (s.maxLoanAmount || 0) <= Number(filter.maxAmount));
  }

  return results;
}
