import { SCHEMES } from '../db/schemesData.js';
import db from '../db/database.js';
import { calculateCreditScore } from './creditScoringService.js';

/**
 * Rule-based Eligibility Engine for Indian Government Schemes
 * Evaluates shop parameters against formal guidelines of schemes like
 * MUDRA, PMEGP, PM SVANidhi, PM Vishwakarma, NRLM, and ODOP.
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

  const matchedSchemes = SCHEMES.map(scheme => {
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
    } else {
      qualification = scheme.whyYouQualifyLogic(normalizedShop, creditScore);
    }

    return {
      id: scheme.id,
      name: scheme.name,
      shortName: scheme.shortName,
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
    totalSchemesChecked: SCHEMES.length,
    eligibleCount: matchedSchemes.filter(s => s.isEligible).length,
    schemes: matchedSchemes
  };
}

export function getAllSchemes(filter = {}) {
  let results = [...SCHEMES];

  if (filter.category) {
    const cat = filter.category.toLowerCase();
    results = results.filter(s => s.category.toLowerCase().includes(cat));
  }

  if (filter.maxAmount) {
    results = results.filter(s => s.maxLoanAmount <= Number(filter.maxAmount));
  }

  return results;
}
