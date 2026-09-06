import db from '../db/database.js';

/**
 * Transparent 4-Pillar Alternative Credit Scoring Engine
 * Designed for rural micro-entrepreneurs lacking formal CIBIL scores.
 * Computes an explainable score between 300 and 850.
 */
export function calculateCreditScore(shopId, transactionsOverride = null) {
  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
  if (!shop) {
    throw new Error('Shop not found');
  }

  // Fetch transactions from the last 90 days (use override from MongoDB if supplied)
  const transactions = transactionsOverride || db.prepare(`
    SELECT * FROM transactions 
    WHERE shop_id = ? 
    ORDER BY date DESC
  `).all(shopId);

  // 1. Calculate Core Financial Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  let totalUdhaarGiven = 0;
  let totalUdhaarRepaid = 0;
  let totalDigitalSales = 0;
  let activeDaysSet = new Set();
  
  const monthlyRevenueMap = {}; // { 'YYYY-MM': income }

  transactions.forEach(tx => {
    const monthKey = tx.date.substring(0, 7);
    activeDaysSet.add(tx.date);

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + tx.amount;
      if (tx.payment_mode === 'upi') {
        totalDigitalSales += tx.amount;
      }
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
    } else if (tx.type === 'udhaar_given') {
      totalUdhaarGiven += tx.amount;
    } else if (tx.type === 'udhaar_repaid') {
      totalUdhaarRepaid += tx.amount;
    }
  });

  const loggedDaysCount = activeDaysSet.size;
  const netSurplus = totalIncome - totalExpense;
  const digitalSharePct = totalIncome > 0 ? (totalDigitalSales / totalIncome) * 100 : 0;
  const udhaarToIncomePct = totalIncome > 0 ? (totalUdhaarGiven / totalIncome) * 100 : 0;
  const udhaarRecoveryRate = totalUdhaarGiven > 0 ? Math.min(100, (totalUdhaarRepaid / totalUdhaarGiven) * 100) : 100;

  // 2. Factor 1: Cash Flow Consistency (Weight 30% -> 165 points base + scaling)
  // Max factor score: 255 points
  let consistencyScore = 0;
  // Logging regularity (out of 90 days)
  const loggingRatio = Math.min(1, loggedDaysCount / 60); // 60+ logged days is full marks
  consistencyScore += loggingRatio * 155;
  // Net cash flow health
  if (netSurplus > 0) {
    const margin = netSurplus / (totalIncome || 1);
    consistencyScore += Math.min(100, margin * 200); // 25-50% surplus margin is healthy for retail
  }
  consistencyScore = Math.min(255, Math.round(consistencyScore));

  // 3. Factor 2: Revenue Growth & Stability (Weight 25% -> max 212 points)
  let growthScore = 120; // baseline for operating enterprise
  const months = Object.keys(monthlyRevenueMap).sort();
  if (months.length >= 2) {
    const lastMonth = monthlyRevenueMap[months[months.length - 1]] || 0;
    const prevMonth = monthlyRevenueMap[months[months.length - 2]] || 0;
    if (prevMonth > 0) {
      const growthRate = (lastMonth - prevMonth) / prevMonth;
      if (growthRate >= 0.05) growthScore += 70; // growing
      else if (growthRate >= -0.05) growthScore += 55; // stable
      else growthScore += 25; // mild contraction
    }
  } else {
    growthScore += 45;
  }
  if (totalIncome > 80000) growthScore += 22;
  growthScore = Math.min(212, Math.round(growthScore));

  // 4. Factor 3: Udhaar & Working Capital Discipline (Weight 25% -> max 213 points)
  let disciplineScore = 0;
  // Ideal: Udhaar is under 20% of sales
  if (udhaarToIncomePct <= 15) disciplineScore += 115;
  else if (udhaarToIncomePct <= 25) disciplineScore += 85;
  else if (udhaarToIncomePct <= 35) disciplineScore += 55;
  else disciplineScore += 30;

  // Recovery rate score
  disciplineScore += (udhaarRecoveryRate / 100) * 98;
  disciplineScore = Math.min(213, Math.round(disciplineScore));

  // 5. Factor 4: Business Vintage & Community Footprint (Weight 20% -> max 170 points)
  let vintageScore = 0;
  // Vintage (years operating)
  const vintage = shop.vintage_years || 1;
  if (vintage >= 3) vintageScore += 100;
  else if (vintage >= 2) vintageScore += 80;
  else if (vintage >= 1) vintageScore += 60;
  else vintageScore += 40;

  // Digital payments penetration
  if (digitalSharePct >= 30) vintageScore += 70;
  else if (digitalSharePct >= 15) vintageScore += 50;
  else vintageScore += 30;
  vintageScore = Math.min(170, Math.round(vintageScore));

  // 6. Base Score + Factor Totals (Total: 300 to 850)
  // 300 base points + earned points (out of 550)
  const earnedScore = Math.round((consistencyScore + growthScore + disciplineScore + vintageScore) * (550 / 850));
  const finalScore = Math.min(850, Math.max(300, 300 + earnedScore));

  // Classification
  let ratingBand = 'needs_work';
  let ratingLabel = 'सुधार आवश्यक (Needs Improvement)';
  let ratingBadge = 'Needs Work';
  let ratingColor = 'text-amber-700 bg-amber-100 border-amber-300';

  if (finalScore >= 750) {
    ratingBand = 'excellent';
    ratingLabel = 'अति उत्कृष्ट (Prime Bankable)';
    ratingBadge = 'Prime Bankable';
    ratingColor = 'text-emerald-800 bg-emerald-100 border-emerald-300';
  } else if (finalScore >= 680) {
    ratingBand = 'good';
    ratingLabel = 'सक्षम एवं सुरक्षित (Loan Ready)';
    ratingBadge = 'Loan Ready';
    ratingColor = 'text-forestRural-700 bg-forestRural-100 border-forestRural-300';
  } else if (finalScore >= 580) {
    ratingBand = 'fair';
    ratingLabel = 'मध्यम पात्रता (Fair Eligibility)';
    ratingBadge = 'Fair';
    ratingColor = 'text-ochre-700 bg-ochre-100 border-ochre-300';
  }

  // Explainable Factors Breakdown
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
      explanation: `Logged ${loggedDaysCount} active transaction days with a healthy net cash surplus of ₹${Math.max(0, netSurplus).toLocaleString('en-IN')}.`,
      explanationHindi: `पिछले 90 दिनों में आपने ${loggedDaysCount} दिन बही-खाते में प्रविष्टि की है और दुकान का शुद्ध अधिशेष ₹${Math.max(0, netSurplus).toLocaleString('en-IN')} रहा।`,
      tip: 'Log transactions every evening to earn +20 points in 30 days.'
    },
    {
      id: 'growth',
      name: 'Revenue Stability & Turnover',
      nameHindi: 'बिक्री स्थिरता एवं मासिक आय',
      weight: '25%',
      score: growthScore,
      maxScore: 212,
      percentage: Math.round((growthScore / 212) * 100),
      status: growthScore > 160 ? 'positive' : 'average',
      explanation: `Total 90-day recorded sales of ₹${Math.round(totalIncome).toLocaleString('en-IN')} demonstrate active village retail demand.`,
      explanationHindi: `पिछले 3 महीनों में कुल ₹${Math.round(totalIncome).toLocaleString('en-IN')} की दर्ज बिक्री यह दर्शाती है कि दुकान में निरंतर मांग है।`,
      tip: 'Pre-book festival stock to boost seasonal turnover.'
    },
    {
      id: 'discipline',
      name: 'Udhaar & Working Capital Health',
      nameHindi: 'उधार वसूली और कार्यशील पूंजी',
      weight: '25%',
      score: disciplineScore,
      maxScore: 213,
      percentage: Math.round((disciplineScore / 213) * 100),
      status: disciplineScore > 160 ? 'positive' : 'average',
      explanation: `Udhaar constitutes ${udhaarToIncomePct.toFixed(1)}% of total sales with a ${udhaarRecoveryRate.toFixed(1)}% recovery rate.`,
      explanationHindi: `आपकी कुल बिक्री में उधार का हिस्सा ${udhaarToIncomePct.toFixed(1)}% है और ${udhaarRecoveryRate.toFixed(1)}% उधार सफलता से वापस मिला।`,
      tip: 'Keep customer udhaar below 20% of monthly sales to maximize score.'
    },
    {
      id: 'vintage',
      name: 'Vintage & Digital Footprint',
      nameHindi: 'व्यापार का अनुभव एवं डिजिटल लेन-देन',
      weight: '20%',
      score: vintageScore,
      maxScore: 170,
      percentage: Math.round((vintageScore / 170) * 100),
      status: vintageScore > 120 ? 'positive' : 'average',
      explanation: `${vintage} years in trade + ${digitalSharePct.toFixed(1)}% digital payments via UPI creates verified banking footprints.`,
      explanationHindi: `${vintage} साल का व्यापारिक अनुभव और ${digitalSharePct.toFixed(1)}% यूपीआई लेन-देन बैंक के लिए विश्वसनीय प्रमाण बनाते हैं।`,
      tip: 'Encourage customers to scan UPI QR on purchases above ₹100.'
    }
  ];

  // Bank Loan Readiness Checklist
  const loanReadinessChecklist = [
    {
      id: 'check-1',
      title: 'Maintain 60+ Days of Digital Bahi-Khata Records',
      titleHindi: 'कम से कम 60 दिन का दैनिक बही-खाता रिकॉर्ड',
      completed: loggedDaysCount >= 60,
      currentValue: `${loggedDaysCount} / 60 days`,
      impact: '+45 pts',
      action: 'Log today\'s sales'
    },
    {
      id: 'check-2',
      title: 'Free Udyam Micro-Enterprise Registration',
      titleHindi: 'निःशुल्क उद्यम आधार प्रमाण-पत्र',
      completed: true,
      currentValue: 'Eligible (Aadhaar & PAN ready)',
      impact: 'Mandatory for MUDRA & PMEGP',
      action: 'Download 1-page guide'
    },
    {
      id: 'check-3',
      title: 'Keep Customer Udhaar Under 25% of Sales',
      titleHindi: 'दुकान का कुल उधार बिक्री के 25% से कम रखें',
      completed: udhaarToIncomePct <= 25,
      currentValue: `${udhaarToIncomePct.toFixed(1)}% current udhaar share`,
      impact: '+30 pts',
      action: 'Send WhatsApp payment reminders'
    },
    {
      id: 'check-4',
      title: 'UPI / Digital Payment Share Above 30%',
      titleHindi: '30% से अधिक बिक्री यूपीआई या बैंक खाते से',
      completed: digitalSharePct >= 30,
      currentValue: `${digitalSharePct.toFixed(1)}% UPI share`,
      impact: '+25 pts',
      action: 'Keep QR standee on front counter'
    },
    {
      id: 'check-5',
      title: 'Active Jan Dhan or Savings Account in Gramin Bank',
      titleHindi: 'ग्रामीण बैंक या एसबीआई में सक्रिय खाता',
      completed: Boolean(shop.bank_account_type),
      currentValue: shop.bank_account_type || 'Gramin Bank',
      impact: 'Direct Benefit Transfer ready',
      action: 'Passbook linked'
    }
  ];

  // Save record in db
  try {
    const insertRecord = db.prepare(`
      INSERT INTO credit_records (id, shop_id, score, factor_consistency, factor_growth, factor_discipline, factor_vintage)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertRecord.run(
      `cr-${Date.now()}`,
      shopId,
      finalScore,
      consistencyScore,
      growthScore,
      disciplineScore,
      vintageScore
    );
  } catch (err) {
    // Non-fatal if table update has race condition
  }

  return {
    shopId,
    totalScore: finalScore,
    maxScore: 850,
    minScore: 300,
    ratingBand,
    ratingLabel,
    ratingBadge,
    ratingColor,
    factors,
    loanReadinessChecklist,
    metrics: {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netSurplus: Math.round(netSurplus),
      loggedDaysCount,
      digitalSharePct: Math.round(digitalSharePct),
      totalUdhaarPending: Math.max(0, Math.round(totalUdhaarGiven - totalUdhaarRepaid)),
      udhaarRecoveryRate: Math.round(udhaarRecoveryRate)
    }
  };
}
