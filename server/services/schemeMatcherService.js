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
  const creditScore = creditResult.totalScore;

  const matchedSchemes = SCHEMES.map(scheme => {
    const qualification = scheme.whyYouQualifyLogic(shop, creditScore);

    return {
      id: scheme.id,
      name: scheme.name,
      shortName: scheme.shortName,
      ministry: scheme.ministry,
      category: scheme.category,
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
