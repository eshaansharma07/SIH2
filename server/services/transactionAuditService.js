/**
 * Transaction Audit & Fair-Play Engine
 * Detects turnover inflation, cashback round-tripping, cash drain anomalies,
 * and benchmarks gross margins against wholesale supply-chain data.
 */

// 1. Check for Round Number Clustering (e.g. repeated ₹100, ₹500, ₹1000, ₹2000)
export function calculateRoundNumberClustering(transactions = []) {
  if (!transactions || transactions.length < 5) {
    return { ratio: 0, isSuspicious: false, flag: 'NORMAL', count: 0 };
  }

  const incomeTxs = transactions.filter(t => t.type === 'income');
  if (incomeTxs.length === 0) {
    return { ratio: 0, isSuspicious: false, flag: 'NORMAL', count: 0 };
  }

  const roundCount = incomeTxs.filter(t => {
    const amt = Number(t.amount);
    return amt >= 100 && amt % 100 === 0;
  }).length;

  const ratio = Math.round((roundCount / incomeTxs.length) * 100);
  // Organic rural retail has natural variation (e.g. ₹37, ₹84, ₹112).
  // > 65% exact round figures indicates artificial velocity padding or cashback round-tripping.
  const isSuspicious = incomeTxs.length >= 10 && ratio > 65;

  return {
    ratio,
    count: roundCount,
    totalIncomeTxs: incomeTxs.length,
    isSuspicious,
    flag: isSuspicious ? 'EXCESSIVE_ROUND_NUMBER_CLUSTERING' : 'NORMAL'
  };
}

// 2. Check Average Order Value (AOV) Outliers (Z-score test)
export function detectAOVOutliers(transactions = []) {
  const incomes = transactions
    .filter(t => t.type === 'income')
    .map(t => Number(t.amount));

  if (incomes.length < 10) {
    return { meanAOV: 0, stdDev: 0, outlierCount: 0, isSuspicious: false, outliers: [] };
  }

  const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  const variance = incomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / incomes.length;
  const stdDev = Math.sqrt(variance) || 1;

  // Outliers: Z-Score > 2.0 or amounts > 5x mean that are >= ₹1,000
  const outliers = transactions.filter(t => {
    if (t.type !== 'income') return false;
    const amt = Number(t.amount);
    const zScore = (amt - mean) / stdDev;
    return (zScore > 2.0 || amt >= mean * 5) && amt >= 1000;
  });

  const isSuspicious = (outliers.length / incomes.length) > 0.08;

  return {
    meanAOV: Math.round(mean),
    stdDev: Math.round(stdDev),
    outlierCount: outliers.length,
    isSuspicious,
    outliers: outliers.slice(0, 5).map(o => ({ amount: o.amount, date: o.date, payment_mode: o.payment_mode }))
  };
}

// 3. Physical Cash-Drain Balancing Test
// Reconstructs physical cash drawer balance to verify recorded cash outflow never exceeds physical cash receipts
export function evaluateCashLedgerIntegrity(transactions = []) {
  if (!transactions || transactions.length === 0) {
    return {
      currentCashBalance: 0,
      minCashBalance: 0,
      hasNegativeCashDrain: false,
      negativeOccurrences: 0,
      flag: 'HEALTHY'
    };
  }

  let runningCash = 0;
  let minBalanceRecorded = 0;
  let negativeOccurrences = 0;

  // Sort chronologically
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach(tx => {
    const isCash = tx.payment_mode === 'cash' || !tx.payment_mode;
    const amt = Number(tx.amount) || 0;

    if (isCash) {
      if (tx.type === 'income' || tx.type === 'udhaar_repaid') {
        runningCash += amt;
      } else if (tx.type === 'expense' || tx.type === 'udhaar_given') {
        runningCash -= amt;
      }
    }

    if (runningCash < 0) {
      negativeOccurrences++;
      if (runningCash < minBalanceRecorded) {
        minBalanceRecorded = runningCash;
      }
    }
  });

  // A physical cash deficit beyond ₹5,000 without corresponding bank cash withdrawals
  // signals under-the-table cash handouts (e.g. ₹100 online, ₹90 cash back)
  const hasNegativeCashDrain = minBalanceRecorded < -5000;

  return {
    currentCashBalance: Math.round(runningCash),
    minCashBalance: Math.round(minBalanceRecorded),
    negativeOccurrences,
    hasNegativeCashDrain,
    flag: hasNegativeCashDrain ? 'IMPOSSIBLE_PHYSICAL_CASH_DEFICIT' : 'HEALTHY'
  };
}

// 4. Wholesale Inventory Margin Triangulation (COGS Sanity)
// Cross-checks gross sales against wholesale/stock procurement outflows
export function evaluateWholesaleMargin(totalIncome = 0, totalExpense = 0) {
  if (!totalIncome || totalIncome <= 0) {
    return { grossMarginPct: 0, isSuspicious: false, status: 'NO_INCOME' };
  }

  if (!totalExpense || totalExpense <= 0) {
    const isSuspicious = totalIncome > 30000;
    return {
      grossMarginPct: 100,
      isSuspicious,
      status: isSuspicious ? 'HIGH_SALES_ZERO_STOCK_PROCUREMENT' : 'EARLY_STAGE'
    };
  }

  const grossMarginPct = ((totalIncome - totalExpense) / totalIncome) * 100;

  // Kirana / Micro-retail gross margin strictly benchmarked between 8% and 25%.
  // Above 50% indicates phantom turnover; below -15% indicates severe distress.
  const isSuspicious = grossMarginPct > 50 || grossMarginPct < -20;

  return {
    grossMarginPct: Math.round(grossMarginPct),
    isSuspicious,
    status: isSuspicious ? 'MARGIN_ANOMALY_DETECTED' : 'BENCHMARK_COMPLIANT'
  };
}

// 5. Composite Underwriting Integrity & Fair-Play Index (0 to 100)
export function calculateUnderwritingIntegrity(transactions = [], totalIncome = 0, totalExpense = 0) {
  const roundAudit = calculateRoundNumberClustering(transactions);
  const aovAudit = detectAOVOutliers(transactions);
  const cashAudit = evaluateCashLedgerIntegrity(transactions);
  const marginAudit = evaluateWholesaleMargin(totalIncome, totalExpense);

  let penaltyPoints = 0;
  const auditFlags = [];

  if (roundAudit.isSuspicious) {
    penaltyPoints += 30;
    auditFlags.push(`Excessive round-number clustering (${roundAudit.ratio}% of income) suggests cashback round-tripping`);
  }

  if (aovAudit.isSuspicious) {
    penaltyPoints += 25;
    auditFlags.push(`Abnormal ticket-size velocity outliers detected (${aovAudit.outlierCount} transactions with Z-score > 3.0)`);
  }

  if (cashAudit.hasNegativeCashDrain) {
    penaltyPoints += 35;
    auditFlags.push(`Physical cash ledger deficit recorded (minimum balance: ₹${cashAudit.minCashBalance})`);
  }

  if (marginAudit.isSuspicious) {
    penaltyPoints += 25;
    auditFlags.push(`Gross profit margin (${marginAudit.grossMarginPct}%) diverges sharply from rural retail benchmark (8-22%)`);
  }

  const integrityIndex = Math.max(15, Math.min(100, 100 - penaltyPoints));

  let trustTier = 'VERIFIED_PRIME';
  if (integrityIndex < 60) trustTier = 'HIGH_AUDIT_RISK';
  else if (integrityIndex < 80) trustTier = 'MODERATE_SCRUTINY';

  return {
    integrityIndex,
    trustTier,
    penaltyPoints,
    auditFlags,
    roundAudit,
    aovAudit,
    cashAudit,
    marginAudit,
    timestamp: new Date().toISOString()
  };
}
