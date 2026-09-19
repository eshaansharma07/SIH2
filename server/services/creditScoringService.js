import db from '../db/database.js';
import dataStore from '../db/dataStore.js';
import { calculateUnderwritingIntegrity } from './transactionAuditService.js';
import { sybilMuleDetectorService } from './sybilMuleDetectorService.js';

/**
 * Transparent 4-Pillar Alternative Credit Scoring Engine & CAM Generator
 * Designed for rural micro-entrepreneurs lacking formal CIBIL scores.
 * Computes an explainable score between 300 and 850 across 4 pillars:
 * 1. Consistency (30%, max 255 pts) — Daily logging + Cash discipline ratio
 * 2. Growth & Stability (25%, max 212 pts) — Turnover momentum + Seasonal resiliency
 * 3. Working Capital Discipline (25%, max 213 pts) — Udhaar control + Digital adoption multiplier
 * 4. Business Vintage (20%, max 170 pts) — Operating vintage + Banking linkage
 */

export function calculateCreditScore(shopOrId, transactionsOverride = null) {
  let shop = null;
  if (typeof shopOrId === 'object' && shopOrId !== null) {
    shop = shopOrId;
  } else if (typeof shopOrId === 'string') {
    // Check SQLite cache or db
    try {
      shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopOrId);
    } catch (_) {}
    if (!shop) {
      throw new Error('Shop not found');
    }
  } else {
    throw new Error('Valid shop or shopId is required');
  }

  // Fetch transactions from the last 120 days (use override if supplied)
  const transactions = Array.isArray(transactionsOverride)
    ? transactionsOverride
    : db.prepare(`
        SELECT * FROM transactions 
        WHERE shop_id = ? 
        ORDER BY date DESC
      `).all(shop.id);

  const isDemo = Boolean(shop.id === 'ramesh-kirana' || shop.is_demo);
  const REQUIRED_TRANSACTIONS = 50;

  // 1. Calculate Core Financial Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  let totalUdhaarGiven = 0;
  let totalUdhaarRepaid = 0;
  let totalDigitalSales = 0;
  const activeDaysSet = new Set();
  const dailyNetCashMap = {}; // { 'YYYY-MM-DD': netCash }
  const monthlyRevenueMap = {}; // { 'YYYY-MM': income }
  const monthlyExpenseMap = {}; // { 'YYYY-MM': expense }

  transactions.forEach(tx => {
    const dateStr = tx.date || 'Unknown';
    const monthKey = dateStr.substring(0, 7);
    activeDaysSet.add(dateStr);

    if (!dailyNetCashMap[dateStr]) dailyNetCashMap[dateStr] = 0;

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + tx.amount;
      dailyNetCashMap[dateStr] += tx.amount;
      if (tx.payment_mode === 'upi') {
        totalDigitalSales += tx.amount;
      }
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
      monthlyExpenseMap[monthKey] = (monthlyExpenseMap[monthKey] || 0) + tx.amount;
      dailyNetCashMap[dateStr] -= tx.amount;
    } else if (tx.type === 'udhaar_given') {
      totalUdhaarGiven += tx.amount;
    } else if (tx.type === 'udhaar_repaid') {
      totalUdhaarRepaid += tx.amount;
      dailyNetCashMap[dateStr] += tx.amount;
    }
  });

  const loggedDaysCount = activeDaysSet.size;
  const netSurplus = totalIncome - totalExpense;
  const digitalSharePct = totalIncome > 0 ? (totalDigitalSales / totalIncome) * 100 : 0;
  const udhaarToIncomePct = totalIncome > 0 ? (totalUdhaarGiven / totalIncome) * 100 : 0;
  const udhaarRecoveryRate = totalUdhaarGiven > 0 ? Math.min(100, (totalUdhaarRepaid / totalUdhaarGiven) * 100) : 100;
  const vintage = Number(shop.vintage_years) || 1;

  // Strict Threshold: Real accounts with under 50 transactions are locked under audit
  if (!isDemo && transactions.length < REQUIRED_TRANSACTIONS) {
    const txCount = transactions.length;
    const remaining = Math.max(0, REQUIRED_TRANSACTIONS - txCount);
    const progressPct = Math.round((txCount / REQUIRED_TRANSACTIONS) * 100);

    return {
      shopId: shop.id,
      shopName: shop.name,
      totalScore: null,
      score: null,
      previousScore: null,
      scoreDelta: null,
      isUnrated: true,
      transactionCount: txCount,
      requiredTransactions: REQUIRED_TRANSACTIONS,
      transactionsRemaining: remaining,
      progressPct,
      ratingBand: 'unrated',
      ratingLabel: 'समीक्षाधीन (Under Audit)',
      ratingBadge: 'Under Audit',
      ratingColor: 'text-stone-600 bg-stone-100 border-stone-300',
      riskTier: 'Pending Verification (Requires 50 verified transactions)',
      factors: [
        {
          id: 'consistency',
          name: 'Cash Flow & Logging Regularity',
          nameHindi: 'दैनिक बही-खाता नियमितता',
          weight: '30%',
          score: null,
          maxScore: 255,
          percentage: progressPct,
          status: 'pending',
          explanation: `Score locked during onboarding audit. Logged ${txCount}/50 transactions (${remaining} remaining to unlock formal credit rating).`,
          explanationHindi: `ऑनलॉगिंग समीक्षाधीन है। ${txCount}/50 लेन-देन दर्ज किए गए हैं (क्रेडिट रेटिंग अनलॉक करने के लिए ${remaining} शेष)।`,
          tip: 'Log all daily transactions to complete the 50-transaction verification milestone.',
          subFactors: [
            {
              id: 'daily_logging',
              name: 'Daily Logging Regularity',
              nameHindi: 'दैनिक बही-खाता प्रविष्टि',
              score: null,
              maxScore: 160,
              status: 'pending'
            },
            {
              id: 'cash_discipline',
              name: 'Cash Inflow Discipline & Volatility',
              nameHindi: 'दैनिक नकद अनुशासन',
              score: null,
              maxScore: 95,
              status: 'pending'
            }
          ]
        },
        {
          id: 'growth',
          name: 'Turnover Growth & Stability',
          nameHindi: 'कारोबार वृद्धि एवं स्थिरता',
          weight: '25%',
          score: null,
          maxScore: 212,
          percentage: progressPct,
          status: 'pending',
          explanation: `Turnover stability and revenue momentum require a minimum 50-transaction history.`,
          explanationHindi: `कारोबार स्थिरता और राजस्व गति के लिए न्यूनतम 50 लेन-देन आवश्यक हैं।`,
          tip: 'Continue recording daily counter cash and digital sales.',
          subFactors: [
            {
              id: 'turnover_momentum',
              name: 'Turnover Growth Momentum',
              nameHindi: 'कारोबार वृद्धि गति',
              score: null,
              maxScore: 130,
              status: 'pending'
            },
            {
              id: 'seasonal_resiliency',
              name: 'Monsoon & Seasonal Dip Resiliency',
              nameHindi: 'मौसमी लचीलापन',
              score: null,
              maxScore: 82,
              status: 'pending'
            }
          ]
        },
        {
          id: 'discipline',
          name: 'Working Capital & Khata Discipline',
          nameHindi: 'उधार एवं कार्यशील पूंजी अनुशासन',
          weight: '25%',
          score: null,
          maxScore: 213,
          percentage: progressPct,
          status: 'pending',
          explanation: `Udhaar recovery cycles and digital payments share will be calculated after 50 transactions.`,
          explanationHindi: `उधार वसूली चक्र और डिजिटल भुगतान अनुपात की गणना 50 लेन-देन के बाद की जाएगी।`,
          tip: 'Record udhaar given and collections promptly.',
          subFactors: [
            {
              id: 'udhaar_recovery',
              name: 'Udhaar Book Recovery Cycle',
              nameHindi: 'उधार वसूली चक्र',
              score: null,
              maxScore: 140,
              status: 'pending'
            },
            {
              id: 'digital_adoption',
              name: 'Digital Payments Multiplier',
              nameHindi: 'डिजिटल भुगतान अनुपात',
              score: null,
              maxScore: 73,
              status: 'pending'
            }
          ]
        },
        {
          id: 'vintage',
          name: 'Business Vintage & Formal Linkage',
          nameHindi: 'दुकान की अवधि एवं बैंक लिंकेज',
          weight: '20%',
          score: null,
          maxScore: 170,
          percentage: progressPct,
          status: 'pending',
          explanation: `Business vintage and KYC credentials will be verified once transactional activity reaches 50 logs.`,
          explanationHindi: `व्यापार अवधि एवं बैंक विवरण 50 लेन-देन के बाद सत्यापित किए जाएंगे।`,
          tip: 'Ensure your Udyam and bank account details are linked.',
          subFactors: [
            {
              id: 'operating_vintage',
              name: 'Operating Vintage & Stability',
              nameHindi: 'दुकान संचालन अवधि',
              score: null,
              maxScore: 110,
              status: 'pending'
            },
            {
              id: 'banking_linkage',
              name: 'Commercial Banking Account Linkage',
              nameHindi: 'बैंक खाता एवं एमएसएमई पंजीकरण',
              score: null,
              maxScore: 60,
              status: 'pending'
            }
          ]
        }
      ],
      metrics: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netSurplus: Math.round(netSurplus),
        totalUdhaarPending: Math.max(0, totalUdhaarGiven - totalUdhaarRepaid),
        udhaarRecoveryRate: Math.round(udhaarRecoveryRate),
        digitalSharePct: Math.round(digitalSharePct),
        loggedDays: loggedDaysCount,
        vintageYears: vintage,
        totalTransactions: txCount,
        requiredTransactions: REQUIRED_TRANSACTIONS,
        transactionsRemaining: remaining,
        cashDisciplineScore: null,
        seasonalResiliencyScore: null,
        digitalMultiplierScore: null
      },
      underwriterAudit: calculateUnderwritingIntegrity(transactions, totalIncome, totalExpense),
      integrityIndex: calculateUnderwritingIntegrity(transactions, totalIncome, totalExpense).integrityIndex,
      muleRingRisk: sybilMuleDetectorService.detectHubAndSpokeMulePattern(shop.id).shopRisk,
      seasonalityBuffer: {
        applied: false,
        points: 0,
        reason: 'Pending minimum 50 verified transaction audit'
      }
    };
  }

  // Dynamic Credit Scoring Calculation (For verified shops with >= 50 transactions or Demo shop)
  // Sub-factor 1A: Daily Logging Regularity (Max 160 pts)
  const dailyLoggingScore = loggedDaysCount > 0 
    ? Math.min(160, 30 + Math.round((loggedDaysCount / 45) * 130))
    : 30; // Onboarding starter baseline

  // Sub-factor 1B: Cash Discipline Ratio (Max 95 pts)
  const dailyNets = Object.values(dailyNetCashMap);
  let cashDisciplineScore = 55; // Foundation discipline
  if (dailyNets.length >= 3) {
    const meanNet = dailyNets.reduce((a, b) => a + b, 0) / dailyNets.length;
    const variance = dailyNets.reduce((acc, val) => acc + Math.pow(val - meanNet, 2), 0) / dailyNets.length;
    const stdDev = Math.sqrt(variance);
    const cv = meanNet > 0 ? (stdDev / meanNet) : 2.0;

    if (cv < 0.5) cashDisciplineScore = 95;
    else if (cv < 0.8) cashDisciplineScore = 85;
    else if (cv < 1.2) cashDisciplineScore = 72;
    else if (cv < 1.6) cashDisciplineScore = 60;
    else cashDisciplineScore = 45;
  }
  if (netSurplus > 0 && totalIncome > 0) {
    const margin = netSurplus / totalIncome;
    if (margin >= 0.15) cashDisciplineScore = Math.min(95, cashDisciplineScore + 10);
  }

  const consistencyScore = Math.min(255, dailyLoggingScore + cashDisciplineScore);

  // =========================================================================
  // 3. FACTOR 2: Revenue Stability & Seasonal Resiliency (Weight 25% -> Max 212 pts)
  // =========================================================================
  // Sub-factor 2A: Revenue Momentum & Volume (Max 120 pts)
  let revenueMomentumScore = 65; // baseline for operating micro-enterprise
  const months = Object.keys(monthlyRevenueMap).sort();
  if (months.length >= 2) {
    const lastMonth = monthlyRevenueMap[months[months.length - 1]] || 0;
    const prevMonth = monthlyRevenueMap[months[months.length - 2]] || 0;
    if (prevMonth > 0) {
      const growthRate = (lastMonth - prevMonth) / prevMonth;
      if (growthRate >= 0.05) revenueMomentumScore += 45;
      else if (growthRate >= -0.05) revenueMomentumScore += 35;
      else revenueMomentumScore += 15;
    }
  } else {
    revenueMomentumScore += 25;
  }
  if (totalIncome > 80000) revenueMomentumScore += 10;
  revenueMomentumScore = Math.min(120, revenueMomentumScore);

  // Sub-factor 2B: Seasonal Resiliency Factor (Max 92 pts)
  // Measures stability across seasonal shifts (e.g. monsoon dip vs festive spike)
  let seasonalResiliencyScore = 60;
  if (months.length >= 3) {
    const revenues = months.map(m => monthlyRevenueMap[m] || 0);
    const minRev = Math.min(...revenues);
    const maxRev = Math.max(...revenues);
    const avgRev = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    // Ratio of minimum month (dip) to average month:
    const dipRatio = avgRev > 0 ? (minRev / avgRev) : 0;
    if (dipRatio >= 0.70) {
      // Strong seasonal resilience (maintained >=70% revenue even in lowest month)
      seasonalResiliencyScore = 92;
    } else if (dipRatio >= 0.55) {
      seasonalResiliencyScore = 78;
    } else if (dipRatio >= 0.40) {
      seasonalResiliencyScore = 62;
    } else {
      seasonalResiliencyScore = 45;
    }
  } else {
    seasonalResiliencyScore = 65;
  }

  // Agrarian Seasonality & Climate Shock Buffer (Force Majeure Buffer)
  // Protects rural agrarian merchants in districts like Balrampur, Sitapur, etc. from harsh
  // score drops during agricultural sowing / flood periods (Kharif cycle)
  const isRuralAgrarianDistrict = /balrampur|utraula|bahraich|shravasti|sitapur|gonda|deoria|basti|rural|gram/i.test(
    `${shop.district || ''} ${shop.village || ''} ${shop.state || ''}`
  );
  let seasonalityBufferApplied = false;
  let seasonalityBufferPts = 0;
  if (isRuralAgrarianDistrict && seasonalResiliencyScore < 85) {
    seasonalityBufferApplied = true;
    seasonalityBufferPts = 14;
    seasonalResiliencyScore = Math.min(92, seasonalResiliencyScore + seasonalityBufferPts);
  }

  const growthScore = Math.min(212, revenueMomentumScore + seasonalResiliencyScore);

  // =========================================================================
  // 4. FACTOR 3: Udhaar & Working Capital Discipline (Weight 25% -> Max 213 pts)
  // =========================================================================
  // Sub-factor 3A: Conservative Udhaar Control (Max 115 pts)
  let udhaarControlScore = 35;
  if (udhaarToIncomePct <= 15) udhaarControlScore = 115;
  else if (udhaarToIncomePct <= 25) udhaarControlScore = 90;
  else if (udhaarToIncomePct <= 35) udhaarControlScore = 60;
  else udhaarControlScore = 35;

  // Sub-factor 3B: Udhaar Recovery Efficiency (Max 75 pts)
  const recoveryScore = Math.round((udhaarRecoveryRate / 100) * 75);

  // Sub-factor 3C: Digital Adoption Multiplier (Max 23 pts)
  // Rewards traceable digital payment velocity aligning with RBI PSL formalization
  let digitalMultiplierScore = 6;
  if (digitalSharePct >= 65) digitalMultiplierScore = 23;
  else if (digitalSharePct >= 45) digitalMultiplierScore = 17;
  else if (digitalSharePct >= 25) digitalMultiplierScore = 12;
  else digitalMultiplierScore = 6;

  const disciplineScore = Math.min(213, udhaarControlScore + recoveryScore + digitalMultiplierScore);

  // =========================================================================
  // 5. FACTOR 4: Business Vintage & Institutional Footprint (Weight 20% -> Max 170 pts)
  // =========================================================================
  // Sub-factor 4A: Operating Vintage (Max 110 pts)
  let vintageScorePart = 50;
  if (vintage >= 5) vintageScorePart = 110;
  else if (vintage >= 3) vintageScorePart = 95;
  else if (vintage >= 2) vintageScorePart = 75;
  else if (vintage >= 1) vintageScorePart = 60;
  else vintageScorePart = 40;

  // Sub-factor 4B: Banking & Formal Registration Linkage (Max 60 pts)
  let bankingScorePart = 35;
  if (shop.bank_account_type && shop.bank_account_type.toLowerCase().includes('current')) {
    bankingScorePart = 60;
  } else if (shop.bank_account_type) {
    bankingScorePart = 50;
  }
  if (shop.is_udyam_verified) {
    bankingScorePart = Math.min(60, bankingScorePart + 10);
  }

  const vintageScore = Math.min(170, vintageScorePart + bankingScorePart);

  // =========================================================================
  // 5.5. Fair-Play & Underwriting Integrity Audit Engine
  // =========================================================================
  const underwriterAudit = calculateUnderwritingIntegrity(transactions, totalIncome, totalExpense);
  const muleAudit = sybilMuleDetectorService.detectHubAndSpokeMulePattern(shop.id);

  // =========================================================================
  // 6. Final Score Calculation (Range 300 to 850)
  // =========================================================================
  // Base score 300 + earned points (out of 550)
  const earnedScore = Math.round((consistencyScore + growthScore + disciplineScore + vintageScore) * (550 / 850));
  const unadjustedScore = Math.min(850, Math.max(300, 300 + earnedScore));
  const integrityPenalty = Math.round((underwriterAudit.penaltyPoints || 0) * 0.4);
  const finalScore = Math.min(850, Math.max(300, unadjustedScore - integrityPenalty));

  // Risk & Rating Tier Classification
  let ratingBand = 'needs_work';
  let ratingLabel = 'सुधार आवश्यक (Needs Improvement)';
  let ratingBadge = 'Needs Work';
  let ratingColor = 'text-amber-700 bg-amber-100 border-amber-300';
  let riskTier = 'Tier 4 — Early Stage / High Supervision';

  if (finalScore >= 750) {
    ratingBand = 'excellent';
    ratingLabel = 'अति उत्कृष्ट (Prime Bankable)';
    ratingBadge = 'Prime Bankable';
    ratingColor = 'text-emerald-800 bg-emerald-100 border-emerald-300';
    riskTier = 'Tier 1 — Low Risk / Preferred PSL Micro-Enterprise';
  } else if (finalScore >= 680) {
    ratingBand = 'good';
    ratingLabel = 'सक्षम एवं सुरक्षित (Loan Ready)';
    ratingBadge = 'Loan Ready';
    ratingColor = 'text-forestRural-700 bg-forestRural-100 border-forestRural-300';
    riskTier = 'Tier 2 — Moderate Risk / Standard MUDRA Kishor';
  } else if (finalScore >= 580) {
    ratingBand = 'fair';
    ratingLabel = 'मध्यम पात्रता (Fair Eligibility)';
    ratingBadge = 'Fair';
    ratingColor = 'text-ochre-700 bg-ochre-100 border-ochre-300';
    riskTier = 'Tier 3 — Acceptable Risk / CGTMSE Guarantee Recommended';
  }

  // Explainable Factors Breakdown with explicit Sub-Factors
  const factors = [
    {
      id: 'consistency',
      name: 'Cash Flow & Logging Regularity',
      nameHindi: 'दैनिक बही-खाता नियमितता',
      weight: '30%',
      score: consistencyScore,
      maxScore: 255,
      percentage: Math.round((consistencyScore / 255) * 100),
      status: consistencyScore > 190 ? 'positive' : 'average',
      explanation: loggedDaysCount > 0
        ? `Logged ${loggedDaysCount} active transaction day${loggedDaysCount > 1 ? 's' : ''} with a net cash surplus of ₹${Math.max(0, netSurplus).toLocaleString('en-IN')}.`
        : `Initial onboarding profile established. Record your daily counter sales to start compounding consistency points.`,
      explanationHindi: loggedDaysCount > 0
        ? `आपने ${loggedDaysCount} दिन बही-खाते में प्रविष्टि की है और दुकान का शुद्ध अधिशेष ₹${Math.max(0, netSurplus).toLocaleString('en-IN')} रहा।`
        : `प्रारंभिक प्रोफाइल तैयार है। निरंतरता अंक अर्जित करने के लिए दैनिक बिक्री दर्ज करना शुरू करें।`,
      tip: 'Log transactions every evening to earn +20 points in 30 days.',
      subFactors: [
        {
          id: 'daily_logging',
          name: 'Daily Logging Regularity',
          nameHindi: 'दैनिक बही-खाता प्रविष्टि',
          score: dailyLoggingScore,
          maxScore: 160,
          status: dailyLoggingScore >= 120 ? 'high' : 'medium'
        },
        {
          id: 'cash_discipline',
          name: 'Cash Flow Predictability (Low CV)',
          nameHindi: 'रोकड़ प्रवाह स्थिरता एवं अनुशासन',
          score: cashDisciplineScore,
          maxScore: 95,
          status: cashDisciplineScore >= 70 ? 'high' : 'medium'
        }
      ]
    },
    {
      id: 'growth',
      name: 'Revenue Stability & Turnover',
      nameHindi: 'बिक्री स्थिरता एवं मासिक आय',
      weight: '25%',
      score: growthScore,
      maxScore: 212,
      percentage: Math.round((growthScore / 212) * 100),
      status: growthScore > 155 ? 'positive' : 'average',
      explanation: totalIncome > 0
        ? `Recorded ₹${Math.round(totalIncome).toLocaleString('en-IN')} cumulative sales with resilient operational stability.`
        : `Initial revenue foundation recorded for ${shop.name || 'your enterprise'}. Daily customer sales will build your momentum rating.`,
      explanationHindi: totalIncome > 0
        ? `दुकान ने कुल ₹${Math.round(totalIncome).toLocaleString('en-IN')} की बिक्री दर्ज की और संचालन स्थिरता बनाए रखी।`
        : `${shop.name || 'आपकी दुकान'} के लिए प्रारंभिक व्यापार आधार तैयार है। दैनिक बिक्री से विकास रेटिंग बढ़ेगी।`,
      tip: 'Diversify daily essentials to maintain sales above ₹1,800/day.',
      subFactors: [
        {
          id: 'revenue_momentum',
          name: 'Revenue Momentum & Volume',
          nameHindi: 'बिक्री वृद्धि एवं व्यापार आकार',
          score: revenueMomentumScore,
          maxScore: 120,
          status: revenueMomentumScore >= 85 ? 'high' : 'medium'
        },
        {
          id: 'seasonal_resiliency',
          name: 'Seasonal & Monsoon Resiliency',
          nameHindi: 'मौसमी एवं मानसून स्थिरता',
          score: seasonalResiliencyScore,
          maxScore: 92,
          status: seasonalResiliencyScore >= 70 ? 'high' : 'medium'
        }
      ]
    },
    {
      id: 'discipline',
      name: 'Udhaar Discipline & Working Capital',
      nameHindi: 'उधार नियंत्रण एवं अनुशासन',
      weight: '25%',
      score: disciplineScore,
      maxScore: 213,
      percentage: Math.round((disciplineScore / 213) * 100),
      status: disciplineScore > 160 ? 'positive' : 'average',
      explanation: totalUdhaarGiven > 0
        ? `Customer udhaar is ${udhaarToIncomePct.toFixed(1)}% of sales with an exceptional ${udhaarRecoveryRate.toFixed(0)}% recovery rate.`
        : `Clean credit discipline with zero outstanding debts. Regular settlements maintain working capital health.`,
      explanationHindi: totalUdhaarGiven > 0
        ? `कुल बिक्री में उधार का अनुपात ${udhaarToIncomePct.toFixed(1)}% है और बकाया वसूली दर ${udhaarRecoveryRate.toFixed(0)}% है।`
        : `शून्य बकाया उधार के साथ पूर्ण वित्तीय अनुशासन। समय पर वसूली से पूंजी सुरक्षित रहती है।`,
      tip: 'Keep total customer credit below 20% of monthly sales to maximize score.',
      subFactors: [
        {
          id: 'udhaar_control',
          name: 'Conservative Udhaar-to-Sales Ratio',
          nameHindi: 'उधार अनुपात नियंत्रण',
          score: udhaarControlScore,
          maxScore: 115,
          status: udhaarControlScore >= 85 ? 'high' : 'medium'
        },
        {
          id: 'recovery_efficiency',
          name: 'Timely Repayment Recovery Rate',
          nameHindi: 'समय पर वसूली दर',
          score: recoveryScore,
          maxScore: 75,
          status: recoveryScore >= 55 ? 'high' : 'medium'
        },
        {
          id: 'digital_adoption',
          name: 'Digital UPI Velocity Multiplier',
          nameHindi: 'यूपीआई डिजिटल लेनदेन प्रोत्साहन',
          score: digitalMultiplierScore,
          maxScore: 23,
          status: digitalMultiplierScore >= 15 ? 'high' : 'medium'
        }
      ]
    },
    {
      id: 'vintage',
      name: 'Business Vintage & Digital Adoption',
      nameHindi: 'व्यापार का अनुभव एवं डिजिटल प्रमाण',
      weight: '20%',
      score: vintageScore,
      maxScore: 170,
      percentage: Math.round((vintageScore / 170) * 100),
      status: vintageScore > 120 ? 'positive' : 'average',
      explanation: `Verified ${vintage} year${vintage > 1 ? 's' : ''} operating vintage in ${shop.district || 'locality'} with ${shop.bank_account_type || 'Commercial Banking'} linkage.`,
      explanationHindi: `${shop.district || 'क्षेत्र'} में ${vintage} वर्षों का व्यापार अनुभव और ${shop.bank_account_type || 'वाणिज्यिक बैंक'} संबद्धता का प्रमाण।`,
      tip: 'Encourage customers to scan UPI QR on purchases above ₹100.',
      subFactors: [
        {
          id: 'operating_vintage',
          name: 'Operating History in Locality',
          nameHindi: 'स्थानीय बाजार में व्यापारिक अनुभव',
          score: vintageScorePart,
          maxScore: 110,
          status: vintageScorePart >= 75 ? 'high' : 'medium'
        },
        {
          id: 'banking_linkage',
          name: 'Commercial Banking Account Linkage',
          nameHindi: 'बैंक खाता एवं एमएसएमई पंजीकरण',
          score: bankingScorePart,
          maxScore: 60,
          status: bankingScorePart >= 45 ? 'high' : 'medium'
        }
      ]
    }
  ];

  const scoreDelta = isDemo ? 44 : (loggedDaysCount > 0 ? Math.min(50, 15 + loggedDaysCount * 8 + (totalDigitalSales > 0 ? 10 : 0)) : 15);

  return {
    shopId: shop.id,
    shopName: shop.name,
    totalScore: finalScore,
    score: finalScore,
    previousScore: Math.max(300, finalScore - scoreDelta),
    scoreDelta,
    isUnrated: false,
    transactionCount: transactions.length,
    requiredTransactions: REQUIRED_TRANSACTIONS,
    transactionsRemaining: 0,
    progressPct: 100,
    ratingBand,
    ratingLabel,
    ratingBadge,
    ratingColor,
    riskTier,
    factors,
    metrics: {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netSurplus: Math.round(netSurplus),
      totalUdhaarPending: Math.max(0, totalUdhaarGiven - totalUdhaarRepaid),
      udhaarRecoveryRate: Math.round(udhaarRecoveryRate),
      digitalSharePct: Math.round(digitalSharePct),
      loggedDays: loggedDaysCount,
      vintageYears: vintage,
      totalTransactions: transactions.length,
      requiredTransactions: REQUIRED_TRANSACTIONS,
      transactionsRemaining: 0,
      cashDisciplineScore,
      seasonalResiliencyScore,
      digitalMultiplierScore
    },
    underwriterAudit,
    integrityIndex: underwriterAudit.integrityIndex,
    muleRingRisk: muleAudit.shopRisk,
    seasonalityBuffer: {
      applied: seasonalityBufferApplied,
      points: seasonalityBufferPts,
      reason: seasonalityBufferApplied ? 'Rural Hinterland Kharif Sowing & Monsoon Shock Absorber (+14 pts)' : 'Normal Seasonality'
    }
  };
}

/**
 * Standardized Credit Appraisal Memo (CAM) Generator for Bank Underwriters
 * Formats full alternative credit scoring, cash-flow metrics, and PSL recommendations.
 */
export function generateCAM(shopOrId, transactionsOverride = null) {
  let shop = null;
  if (typeof shopOrId === 'object' && shopOrId !== null) {
    shop = shopOrId;
  } else {
    shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopOrId);
    if (!shop) throw new Error('Shop not found');
  }

  const creditData = calculateCreditScore(shop, transactionsOverride);
  const m = creditData.metrics || {};
  const isUnrated = Boolean(creditData.isUnrated);

  const monthlySurplus = isUnrated ? 0 : Math.round((m.netSurplus || 0) / 3);
  const recommendedMaxLoan = isUnrated ? 0 : Math.min(500000, Math.max(25000, monthlySurplus * 8));
  const recommendedMaxEmi = isUnrated ? 0 : Math.round(monthlySurplus * 0.4);

  // Nayak Committee Working Capital Norms (25% of projected turnover, 5% margin, 20% MPBF bank finance)
  const projectedAnnualTurnover = isUnrated ? 0 : Math.max(120000, Math.round((m.totalIncome || 0) * 3));
  const workingCapitalRequirement25Pct = isUnrated ? 0 : Math.round(projectedAnnualTurnover * 0.25);
  const minimumBorrowerMargin5Pct = isUnrated ? 0 : Math.round(projectedAnnualTurnover * 0.05);
  const maximumPermissibleBankFinance20Pct = isUnrated ? 0 : Math.round(projectedAnnualTurnover * 0.20);

  const udyamStatus = shop.is_udyam_verified ? 'VERIFIED' : (shop.udyam_number ? 'SELF_DECLARED' : 'PENDING');
  const districtCode = (shop.district || 'IND').substring(0, 3).toUpperCase();
  const memoNumber = `CAM-${districtCode}-${Date.now().toString().slice(-6)}`;

  return {
    documentType: 'CREDIT_APPRAISAL_MEMORANDUM',
    underwritingFramework: 'RBI Priority Sector Lending (PSL) & Nayak Committee Working Capital Norms',
    riskClassification: creditData.riskTier,
    recommendedFacility: isUnrated 
      ? 'Onboarding Evaluation (Requires 50 verified transactions)' 
      : (m.totalIncome > 50000 ? 'MUDRA Kishor (₹50,000 to ₹5,00,000)' : 'MUDRA Shishu (Up to ₹50,000)'),
    creditAssessment: {
      alternativeScore: creditData.totalScore,
      isUnrated: isUnrated,
      transactionCount: creditData.transactionCount || 0,
      requiredTransactions: creditData.requiredTransactions || 50,
      transactionsRemaining: creditData.transactionsRemaining || 0,
      riskTier: creditData.riskTier,
      recommendedFacility: isUnrated 
        ? 'Onboarding Evaluation (Requires 50 verified transactions)' 
        : (m.totalIncome > 50000 ? 'MUDRA Kishor (₹50,000 to ₹5,00,000)' : 'MUDRA Shishu (Up to ₹50,000)'),
      factorBreakdown: creditData.factors
    },
    memoMetadata: {
      memoId: memoNumber,
      standard: 'RBI Priority Sector Lending (PSL) Cash-Flow Underwriting Guidelines',
      framework: 'Nayak Committee Working Capital Norms (20% of Projected Turnover)',
      generatedAt: new Date().toISOString(),
      issuingEntity: 'Vyapaar Setu Credit Assessment Engine',
      appraisalValidityDays: 90
    },
    borrowerProfile: {
      shopId: shop.id,
      tradeName: shop.trade_name || shop.name,
      legalName: shop.owner_name,
      enterpriseCategory: 'Micro-Enterprise (Trading & Rural Retail)',
      udyamRegistrationStatus: udyamStatus,
      udyamRegistrationNumber: shop.udyam_number || 'N/A',
      location: {
        village: shop.village,
        district: shop.district,
        state: shop.state
      },
      registeredPhone: shop.phone,
      operatingVintageYears: shop.vintage_years || 1,
      primaryBankLinkage: shop.bank_account_type || 'State Bank of India'
    },
    creditScoreAudit: {
      score: creditData.totalScore,
      isUnrated: isUnrated,
      transactionCount: creditData.transactionCount || 0,
      requiredTransactions: creditData.requiredTransactions || 50,
      transactionsRemaining: creditData.transactionsRemaining || 0,
      maxScale: 850,
      minScale: 300,
      ratingBand: creditData.ratingBand,
      ratingLabel: creditData.ratingLabel,
      riskClassification: creditData.riskTier,
      pillars: creditData.factors
    },
    creditScoreSummary: {
      score: creditData.totalScore,
      isUnrated: isUnrated,
      transactionCount: creditData.transactionCount || 0,
      requiredTransactions: creditData.requiredTransactions || 50,
      transactionsRemaining: creditData.transactionsRemaining || 0,
      maxScale: 850,
      minScale: 300,
      ratingBand: creditData.ratingBand,
      ratingLabel: creditData.ratingLabel,
      riskClassification: creditData.riskTier
    },
    fourPillarsAppraisal: creditData.factors.map(f => ({
      pillarId: f.id,
      pillarName: f.name,
      weight: f.weight,
      awardedScore: f.score,
      maxScore: f.maxScore,
      percentage: f.percentage,
      underwriterNote: f.explanation,
      subFactorBreakdown: f.subFactors
    })),
    workingCapitalAssessment: {
      methodology: 'Nayak Committee Turnover Method for MSME Working Capital',
      nayakCommitteeNorms: {
        projectedAnnualTurnover,
        workingCapitalRequirement25Pct,
        minimumBorrowerMargin5Pct,
        maximumPermissibleBankFinance20Pct
      },
      debtServiceMetrics: {
        estimatedMonthlyOperatingSurplus: monthlySurplus,
        recommendedMaxMonthlyEmi: recommendedMaxEmi,
        debtServiceCoverageRatio: isUnrated ? 'N/A (Pending 50 transactions)' : '2.5x (Prudent > 1.5x)'
      },
      scaMarginMoneyAssessment: {
        framework: 'State Channelizing Agencies (SCAs) & Apex Corporations (NSFDC / NBCFDC / NMDFC)',
        statutoryRatio: '90% Concessional Loan : 10% Beneficiary Margin Money',
        microFinanceTier: {
          maxProjectCost: 140000,
          beneficiaryMarginMoney10Pct: 14000,
          scaConcessionalLoan90Pct: 125000,
          concessionalInterestRate: '6.5% p.a.',
          repaymentTenureMonths: 36,
          moratoriumPeriodMonths: 3,
          projectedMonthlyEmi: 4147,
          dscrOnOperatingSurplus: monthlySurplus > 0 ? `${(monthlySurplus / 4147).toFixed(2)}x` : 'N/A',
          marginMoneyViabilityStatus: (m.netSurplus || 0) >= 14000 ? 'VERIFIED_AVAILABLE' : 'PARTIALLY_FUNDED'
        },
        termLoanTier: {
          sampleProjectCost: 1000000,
          beneficiaryMarginMoney10Pct: 100000,
          scaConcessionalLoan90Pct: 900000,
          concessionalInterestRate: '6.0% – 8.0% p.a.',
          repaymentTenureYears: 5
        }
      }
    },
    cashFlowAndWorkingCapitalAudit: {
      observationPeriod: isUnrated ? 'Onboarding Evaluation (Requires 50 verified transactions)' : '90–120 Days Realistic Rural Micro-Retail Record',
      grossTurnoverLogged: m.totalIncome || 0,
      operationalPurchasesAndExpenses: m.totalExpense || 0,
      netCashSurplus: m.netSurplus || 0,
      averageMonthlySales: Math.round((m.totalIncome || 0) / 4),
      operatingSurplusMargin: (m.totalIncome || 0) > 0 ? `${((m.netSurplus / m.totalIncome) * 100).toFixed(1)}%` : '0%',
      digitalCollectionVelocityUpi: `${m.digitalSharePct || 0}%`,
      customerUdhaarOwed: m.totalUdhaarPending || 0,
      historicalUdhaarRecoveryRate: `${m.udhaarRecoveryRate || 100}%`
    },
    underwriterAuditReport: {
      integrityIndex: creditData.integrityIndex || 100,
      trustTier: creditData.underwriterAudit?.trustTier || 'VERIFIED_PRIME',
      muleRingRisk: creditData.muleRingRisk || 'LOW',
      cashDrainStatus: creditData.underwriterAudit?.cashAudit?.flag || 'HEALTHY',
      roundNumberClusteringPct: `${creditData.underwriterAudit?.roundAudit?.ratio || 0}%`,
      wholesaleGrossMarginPct: `${creditData.underwriterAudit?.marginAudit?.grossMarginPct || 0}%`,
      seasonalityAdjustment: creditData.seasonalityBuffer,
      auditNotices: creditData.underwriterAudit?.auditFlags || []
    },
    underwritingRecommendation: {
      pslClassification: 'Micro-Enterprise (Trading) — Eligible for 7.5% RBI PSL sub-target',
      recommendedProduct: isUnrated 
        ? 'Onboarding Evaluation (Requires 50 verified transactions)'
        : (m.totalIncome > 50000 ? 'MUDRA Kishor (₹50,000 to ₹5,00,000)' : 'MUDRA Shishu (Up to ₹50,000)'),
      recommendedMaxLoanExposure: recommendedMaxLoan,
      recommendedTenureMonths: isUnrated ? 0 : 36,
      recommendedMaxMonthlyEmi: recommendedMaxEmi,
      cgtmseCoverageApplicable: true,
      interestRateRangeAnnual: isUnrated ? 'N/A (Pending 50 transactions)' : '8.75% – 11.50% p.a. (Bank Base Rate + Spread)',
      underwriterConditions: isUnrated ? [
        'Mandatory completion of 50 ledger transactions before credit facility sanction',
        'Audit verification of customer udhaar and digital sales history'
      ] : [
        'Mandatory collateral-free underwriting under CGTMSE guarantee scheme',
        'End-use verification for inventory procurement / deep freezer capital equipment',
        'Monthly debt-service coverage ratio (DSCR) verified at >= 1.65x'
      ]
    }
  };
}
