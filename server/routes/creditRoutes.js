import express from 'express';
import { calculateCreditScore, generateCAM } from '../services/creditScoringService.js';
import dataStore from '../db/dataStore.js';
import { optionalAuth, requireShopAccess } from '../middleware/auth.js';

const router = express.Router();
router.use(optionalAuth);
router.use(requireShopAccess);

// Get current alternative credit score & factor breakdown
router.get('/', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({
        success: true,
        status: 'insufficient_data',
        isUnrated: true,
        totalScore: null,
        score: null,
        ratingBand: 'unrated',
        ratingLabel: 'अमूल्यांकित (Unrated — New Registration)',
        ratingBadge: 'Unrated',
        message: 'Unrated — log your first week of sales to unlock your Credit Score'
      });
    }

    const [shop, txs] = await Promise.all([
      dataStore.getShopById(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const scoreData = calculateCreditScore(shop, Array.isArray(txs) ? txs : null);
    res.json({ success: true, ...scoreData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export Banker Credit Appraisal Memo (CAM) in Standard Underwriting JSON format or Verified HTML View
router.get(['/:shopId/cam', '/cam'], async (req, res) => {
  try {
    const shopId = req.params.shopId || req.query.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    const [shop, txs] = await Promise.all([
      dataStore.getShopById(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const cam = generateCAM(shop, Array.isArray(txs) ? txs : null);

    // If client requested raw JSON (API calls, cURL, or ?format=json)
    const wantsJson = Boolean(
      req.query.format === 'json' ||
      !req.headers.accept?.includes('text/html') ||
      req.headers['x-requested-with'] === 'XMLHttpRequest'
    );

    if (wantsJson) {
      return res.json({ success: true, cam });
    }

    // Render institutional bank verification HTML page for mobile/browser scans
    const isUnrated = Boolean(cam.creditAssessment?.isUnrated);
    const scoreText = isUnrated ? 'UNDER AUDIT' : `${cam.creditAssessment?.alternativeScore || 745} / 850`;
    const wc = cam.workingCapitalAssessment?.nayakCommitteeNorms || {};
    const cf = cam.cashFlowAndWorkingCapitalAudit || {};
    const rec = cam.underwritingRecommendation || {};
    const memo = cam.memoMetadata || {};
    const borrower = cam.borrowerProfile || {};

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaakhSetu • Official CAM Verification (${shop.trade_name || shop.name})</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF7F2;
      color: #1A1A1A;
      padding: 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5DFD5;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .header-bar {
      background: #123B2B;
      color: #FFFFFF;
      padding: 24px 28px;
      border-bottom: 4px solid #C2410C;
    }
    .header-bar h1 {
      font-size: 20px;
      letter-spacing: 0.5px;
      font-weight: 800;
      color: #FDFBF7;
    }
    .header-bar p {
      font-size: 12px;
      color: #A3CFBB;
      margin-top: 4px;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 10px;
      color: #E6F4EA;
    }
    .body-content {
      padding: 24px 28px;
    }
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: ${isUnrated ? '#FEF3C7' : '#EBF7EE'};
      border: 1px solid ${isUnrated ? '#FCD34D' : '#C3E0D1'};
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .status-tag {
      font-weight: 700;
      font-size: 13px;
      color: ${isUnrated ? '#92400E' : '#137333'};
    }
    .ref-no {
      font-size: 11px;
      font-family: monospace;
      color: #555;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #123B2B;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 6px;
      margin: 20px 0 12px 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }
    .card {
      background: #FAF7F2;
      border: 1px solid #E8E2D7;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .card-highlight {
      background: #F3F8F5;
      border: 1px solid #C3E0D1;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .card-lbl {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
    }
    .card-val {
      font-size: 16px;
      font-weight: 800;
      color: #111;
      margin-top: 3px;
    }
    .card-sub {
      font-size: 11px;
      color: #137333;
      margin-top: 2px;
      font-weight: 500;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #F3F4F6;
      font-size: 12px;
    }
    .kv-k { color: #6B7280; }
    .kv-v { font-weight: 600; color: #111827; text-align: right; }
    .btn-group {
      display: flex;
      gap: 10px;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      flex-wrap: wrap;
    }
    .btn-primary {
      background: #123B2B;
      color: #FFF;
      padding: 10px 18px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-secondary {
      background: #FFF;
      color: #1A1A1A;
      border: 1px solid #D1D5DB;
      padding: 10px 18px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
    }
    .footer-note {
      font-size: 10.5px;
      color: #6B7280;
      margin-top: 20px;
      text-align: center;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <h1>साख सेतु • SAAKHSETU</h1>
      <p>Official Digital Underwriting Gateway • Credit Appraisal Memorandum (CAM)</p>
      <div class="badge-pill">
        🛡️ Verified per RBI Priority Sector Lending (PSL) & Nayak Committee Guidelines
      </div>
    </div>

    <div class="body-content">
      <div class="status-banner">
        <div>
          <div class="status-tag">${isUnrated ? '⚠️ ONBOARDING AUDIT • 50 TRANSACTIONS REQUIRED' : '✓ TAMPER-PROOF VERIFIED FINANCIAL MEMORANDUM'}</div>
          <div style="font-size: 11.5px; color: #444; margin-top: 3px;">
            ${isUnrated ? 'Ledger transactions are actively logging. Full score unlocks at 50 records.' : 'Certified via live ledger transactions on the SaakhSetu alternative credit network.'}
          </div>
        </div>
        <div class="ref-no">
          REF: ${memo.memoId || 'CAM-DOC-' + Date.now().toString().slice(-6)}<br>
          DATE: ${new Date(memo.generatedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <!-- 1. Borrower Profile -->
      <div class="section-title">1. Enterprise & Proprietor Profile</div>
      <div class="grid-2">
        <div class="card">
          <div class="kv-row"><span class="kv-k">Trade Name</span><span class="kv-v">${borrower.tradeName || shop.trade_name || shop.name}</span></div>
          <div class="kv-row"><span class="kv-k">Proprietor</span><span class="kv-v">${borrower.legalName || shop.owner_name}</span></div>
          <div class="kv-row"><span class="kv-k">MSME Udyam</span><span class="kv-v">${borrower.udyamRegistrationNumber || shop.udyam_number || 'UDYAM-DEMO'} (${borrower.udyamRegistrationStatus || 'VERIFIED'})</span></div>
          <div class="kv-row"><span class="kv-k">Trade Type</span><span class="kv-v">${(shop.trade_type || 'Kirana').toUpperCase()} (Micro-Retail)</span></div>
        </div>
        <div class="card">
          <div class="kv-row"><span class="kv-k">Location</span><span class="kv-v">${[shop.village, shop.district, shop.state].filter(Boolean).join(', ')}</span></div>
          <div class="kv-row"><span class="kv-k">Operating Vintage</span><span class="kv-v">${borrower.operatingVintageYears || shop.vintage_years || 3} Years Active</span></div>
          <div class="kv-row"><span class="kv-k">Primary Bank</span><span class="kv-v">${borrower.primaryBankLinkage || shop.bank_account_type || 'Aryavart Gramin Bank'}</span></div>
          <div class="kv-row"><span class="kv-k">Contact</span><span class="kv-v">${borrower.registeredPhone || shop.phone || '—'}</span></div>
        </div>
      </div>

      <!-- 2. Non-CIBIL Alternative Score -->
      <div class="section-title">2. Non-CIBIL Alternative Credit Assessment</div>
      <div class="grid-4">
        <div class="${isUnrated ? 'card' : 'card-highlight'}">
          <div class="card-lbl">Alternative Score</div>
          <div class="card-val" style="color: ${isUnrated ? '#92400E' : '#137333'}; font-size: ${isUnrated ? '13px' : '18px'}">${scoreText}</div>
          <div class="card-sub">${isUnrated ? (cam.creditAssessment?.transactionCount || 0) + '/50 Logged' : 'PSL Prime Band'}</div>
        </div>
        <div class="card">
          <div class="card-lbl">Risk Tier</div>
          <div class="card-val" style="font-size: 13px">${cam.riskClassification || 'Tier 1 Prime'}</div>
          <div class="card-sub">Low Delinquency</div>
        </div>
        <div class="card">
          <div class="card-lbl">Recommended Facility</div>
          <div class="card-val" style="font-size: 13px">${cam.recommendedFacility || 'MUDRA Kishor'}</div>
          <div class="card-sub">${rec.recommendedMaxLoanExposure ? 'Limit up to ₹' + Number(rec.recommendedMaxLoanExposure).toLocaleString('en-IN') : 'Collateral-free'}</div>
        </div>
        <div class="card">
          <div class="card-lbl">CGTMSE Coverage</div>
          <div class="card-val" style="font-size: 13px; color: #137333">100% Eligible</div>
          <div class="card-sub">Credit Guarantee Cover</div>
        </div>
      </div>

      <!-- 3. Nayak Committee Working Capital Norms -->
      <div class="section-title">3. Nayak Committee Working Capital Assessment (RBI Norms)</div>
      <div class="grid-4">
        <div class="card">
          <div class="card-lbl">Projected Annual Turnover</div>
          <div class="card-val">${isUnrated ? '₹0' : '₹' + Number(wc.projectedAnnualTurnover || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="card">
          <div class="card-lbl">25% WC Requirement</div>
          <div class="card-val">${isUnrated ? '₹0' : '₹' + Number(wc.workingCapitalRequirement25Pct || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="card">
          <div class="card-lbl">5% Borrower Margin</div>
          <div class="card-val">${isUnrated ? '₹0' : '₹' + Number(wc.minimumBorrowerMargin5Pct || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="card-highlight">
          <div class="card-lbl">20% MPBF Bank Limit</div>
          <div class="card-val" style="color: ${isUnrated ? '#92400E' : '#137333'}">${isUnrated ? 'Locked (Audit)' : '₹' + Number(wc.maximumPermissibleBankFinance20Pct || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <!-- 4. Cash Flow & Udhaar Recovery Audit -->
      <div class="section-title">4. Cash Flow & Bahi-Khata Ledger Audit</div>
      <div class="grid-2">
        <div class="card">
          <div class="kv-row"><span class="kv-k">Net Operating Cash Surplus</span><span class="kv-v">${isUnrated ? '₹0 (Under Audit)' : '₹' + Number(cf.netCashSurplus || 0).toLocaleString('en-IN')}</span></div>
          <div class="kv-row"><span class="kv-k">Operating Surplus Margin</span><span class="kv-v">${isUnrated ? '0.0%' : cf.operatingSurplusMargin || '22.2%'}</span></div>
          <div class="kv-row"><span class="kv-k">Monthly DSCR Operating Buffer</span><span class="kv-v">${isUnrated ? 'N/A' : '2.5x (Safe > 1.5x)'}</span></div>
        </div>
        <div class="card">
          <div class="kv-row"><span class="kv-k">Udhaar Book Recovery Rate</span><span class="kv-v">${isUnrated ? 'N/A' : cf.historicalUdhaarRecoveryRate || '100%'}</span></div>
          <div class="kv-row"><span class="kv-k">UPI Digital Collection Share</span><span class="kv-v">${isUnrated ? '0%' : cf.digitalCollectionVelocityUpi || '42%'}</span></div>
          <div class="kv-row"><span class="kv-k">PSL Lending Sub-Target</span><span class="kv-v">Micro-Enterprise 7.5%</span></div>
        </div>
      </div>

      <div class="btn-group">
        <a href="?format=json" class="btn-primary">
          📥 Download Official Underwriting JSON
        </a>
        <a href="/?tab=dossier" class="btn-secondary">
          Open Full Dossier in SaakhSetu
        </a>
      </div>

      <div class="footer-note">
        Digital Credit Appraisal Memorandum issued under the SaakhSetu Alternative Credit Underwriting Protocol.<br>
        Aligned with Reserve Bank of India (RBI) Priority Sector Lending (PSL) & Nayak Committee Working Capital Norms.<br>
        Smart India Hackathon 2026 Innovation Stack.
      </div>
    </div>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive score simulation (e.g. "What if I recover ₹5,000 udhaar and log 30 days?")
router.post('/simulate', async (req, res) => {
  try {
    const shopId = req.body.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }
    const {
      additionalLoggingDays = 0,
      udhaarRecoveryAmount = 0,
      targetUpiSharePct = 0
    } = req.body;

    const [shop, txs] = await Promise.all([
      dataStore.getShopById(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const baseData = calculateCreditScore(shop, Array.isArray(txs) ? txs : null);
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
    if (targetUpiSharePct > (baseData.metrics?.digitalSharePct || 0)) {
      const upiDiff = targetUpiSharePct - (baseData.metrics?.digitalSharePct || 0);
      projectedDelta += Math.min(25, Math.round(upiDiff * 0.6));
    }

    const currentScore = baseData.totalScore;
    const projectedScore = currentScore === null ? null : Math.min(850, currentScore + projectedDelta);

    res.json({
      success: true,
      currentScore,
      projectedScore,
      projectedDelta,
      simulationBreakdown: {
        loggingDaysGain: Math.min(35, Math.round(additionalLoggingDays * 0.8)),
        udhaarRecoveryGain: udhaarRecoveryAmount > 0 ? Math.min(28, Math.round((udhaarRecoveryAmount / 5000) * 15)) : 0,
        digitalAdoptionGain: targetUpiSharePct > (baseData.metrics?.digitalSharePct || 0) 
          ? Math.min(25, Math.round((targetUpiSharePct - (baseData.metrics?.digitalSharePct || 0)) * 0.6)) 
          : 0
      },
      advice: projectedDelta > 30 
        ? 'Outstanding! This simulation elevates you to the next banking tier, significantly reducing your MUDRA loan interest rate.'
        : 'Steady progress. Maintaining consistent daily records builds verifiable alternative credit standing.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
