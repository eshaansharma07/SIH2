import { test } from 'node:test';
import assert from 'node:assert';
import { calculateCreditScore, generateCAM } from '../services/creditScoringService.js';
import { seedDatabase } from '../db/seed.js';
import { WHOLESALE_CATALOG } from '../db/wholesaleCatalogData.js';

test('DPI Gateway, Credit CAM & ONDC Wholesale Suite', async (t) => {
  seedDatabase();

  await t.test('1. CAM Generation produces valid Nayak Committee norms and credit memo', async () => {
    const cam = await generateCAM('ramesh-kirana');

    assert.ok(cam, 'CAM memo must be generated');
    assert.strictEqual(cam.documentType, 'CREDIT_APPRAISAL_MEMORANDUM', 'Document type must match');
    assert.strictEqual(cam.underwritingFramework, 'RBI Priority Sector Lending (PSL) & Nayak Committee Working Capital Norms');
    assert.ok(cam.riskClassification, 'Risk classification must exist');
    assert.ok(cam.recommendedFacility, 'Facility recommendation must exist');
    assert.ok(cam.workingCapitalAssessment, 'Working capital assessment must exist');
    assert.ok(cam.workingCapitalAssessment.nayakCommitteeNorms, 'Nayak committee norms must exist');

    const nayak = cam.workingCapitalAssessment.nayakCommitteeNorms;
    assert.ok(nayak.projectedAnnualTurnover > 0, 'Projected turnover must be > 0');
    assert.strictEqual(nayak.workingCapitalRequirement25Pct, Math.round(nayak.projectedAnnualTurnover * 0.25));
    assert.strictEqual(nayak.minimumBorrowerMargin5Pct, Math.round(nayak.projectedAnnualTurnover * 0.05));
    assert.strictEqual(nayak.maximumPermissibleBankFinance20Pct, Math.round(nayak.projectedAnnualTurnover * 0.20));

    // Scoring pillars must have subFactors
    assert.ok(Array.isArray(cam.creditScoreAudit.pillars), 'Pillars must be an array');
    for (const pillar of cam.creditScoreAudit.pillars) {
      assert.ok(Array.isArray(pillar.subFactors), `Pillar ${pillar.id} must have subFactors array`);
      assert.ok(pillar.subFactors.length > 0, `Pillar ${pillar.id} must have at least 1 subFactor`);
    }
  });

  await t.test('2. Udyam Regex format validator strictly adheres to UDYAM-XX-00-0000000', () => {
    const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i;

    // Valid formats
    assert.ok(UDYAM_REGEX.test('UDYAM-UP-01-0024891'), 'Valid UP Udyam');
    assert.ok(UDYAM_REGEX.test('UDYAM-MH-12-0049281'), 'Valid MH Udyam');
    assert.ok(UDYAM_REGEX.test('UDYAM-DL-05-9988771'), 'Valid DL Udyam');
    assert.ok(UDYAM_REGEX.test('udyam-up-01-0024891'), 'Case-insensitive match');

    // Invalid formats
    assert.strictEqual(UDYAM_REGEX.test('UDYAM-12345'), false, 'Incomplete format');
    assert.strictEqual(UDYAM_REGEX.test('UDYAM-UP-001-0024891'), false, '3-digit district code');
    assert.strictEqual(UDYAM_REGEX.test('UDYAM-UP-01-002489'), false, 'Only 6 digits at end');
    assert.strictEqual(UDYAM_REGEX.test('AADHAAR-1234'), false, 'Wrong prefix');
  });

  await t.test('3. ONDC Wholesale Catalog contains realistic commodity items with positive savings', () => {
    assert.ok(Array.isArray(WHOLESALE_CATALOG), 'Catalog must be array');
    assert.ok(WHOLESALE_CATALOG.length >= 8, 'Catalog should contain multiple commodities across categories');

    for (const item of WHOLESALE_CATALOG) {
      assert.ok(item.id, 'Item must have id');
      assert.ok(item.itemName, 'Item must have name');
      assert.ok(item.localMandiPrice > 0, 'Local mandi price must be > 0');
      assert.ok(item.ondcB2BPrice > 0, 'ONDC price must be > 0');
      assert.ok(item.localMandiPrice > item.ondcB2BPrice, `ONDC price (${item.ondcB2BPrice}) must be lower than local mandi price (${item.localMandiPrice}) for ${item.itemName}`);
      assert.ok(item.supplierName, 'Must list FPO or seller node supplier name');
    }
  });

  await t.test('4. Sub-factors (Cash Discipline, Seasonal Resiliency, Digital Adoption) are computed properly', () => {
    const scoreResult = calculateCreditScore('ramesh-kirana');
    assert.ok(scoreResult.factors, 'Factors must exist');

    const consistencyPillar = scoreResult.factors.find(f => f.id === 'consistency');
    assert.ok(consistencyPillar, 'Consistency pillar must exist');
    const cashDisciplineSub = consistencyPillar.subFactors.find(s => s.id === 'cash_discipline');
    assert.ok(cashDisciplineSub, 'Cash discipline subFactor must be present in Consistency pillar');
    assert.ok(typeof cashDisciplineSub.score === 'number', 'Cash discipline score must be a number');

    const growthPillar = scoreResult.factors.find(f => f.id === 'growth');
    assert.ok(growthPillar, 'Growth pillar must exist');
    const seasonalSub = growthPillar.subFactors.find(s => s.id === 'seasonal_resiliency');
    assert.ok(seasonalSub, 'Seasonal resiliency subFactor must be present in Growth pillar');

    const disciplinePillar = scoreResult.factors.find(f => f.id === 'discipline');
    assert.ok(disciplinePillar, 'Discipline pillar must exist');
    const digitalSub = disciplinePillar.subFactors.find(s => s.id === 'digital_adoption');
    assert.ok(digitalSub, 'Digital adoption subFactor must be present in Discipline pillar');
  });

  await t.test('5. CAM HTTP verification endpoint supports public verification with JSON & HTML content negotiation', async () => {
    const { default: router } = await import('../routes/creditRoutes.js');

    // Find the cam route handler on creditRoutes
    const camLayer = router.stack.find(s => s.route && (
      (Array.isArray(s.route.path) && s.route.path.some(p => p.includes('cam'))) ||
      (typeof s.route.path === 'string' && s.route.path.includes('cam'))
    ));
    assert.ok(camLayer, 'CAM route must be registered on creditRoutes');
    const handler = camLayer.route.stack[0].handle;

    // 5.1 Public verification with JSON format
    let jsonBody = null;
    let headersSet = {};
    const mockResJson = {
      status(code) { return this; },
      json(data) { jsonBody = data; return this; },
      set(k, v) { headersSet[k] = v; return this; },
      send(html) { return this; }
    };
    const mockReqJson = {
      params: { shopId: 'ramesh-kirana' },
      query: { format: 'json' },
      headers: { accept: 'application/json' },
      method: 'GET'
    };

    await handler(mockReqJson, mockResJson);
    assert.ok(jsonBody, 'Must return JSON body');
    assert.strictEqual(jsonBody.success, true);
    assert.ok(jsonBody.cam, 'Must contain cam payload');
    assert.strictEqual(jsonBody.cam.documentType, 'CREDIT_APPRAISAL_MEMORANDUM');
    assert.ok(jsonBody.cam.workingCapitalAssessment?.nayakCommitteeNorms, 'Nayak norms in HTTP payload');

    // 5.2 Browser QR code scan returns official bank verification HTML certificate
    let htmlContent = null;
    const mockResHtml = {
      status(code) { return this; },
      json(data) { return this; },
      set(k, v) { headersSet[k] = v; return this; },
      send(html) { htmlContent = html; return this; }
    };
    const mockReqHtml = {
      params: { shopId: 'ramesh-kirana' },
      query: {},
      headers: { accept: 'text/html,application/xhtml+xml' },
      method: 'GET'
    };

    await handler(mockReqHtml, mockResHtml);
    assert.ok(htmlContent, 'Must return HTML for browser scans');
    assert.ok(headersSet['Content-Type']?.includes('text/html'), 'Content-Type must be text/html');
    assert.ok(htmlContent.includes('SAAKHSETU'), 'Must include SaakhSetu branding');
    assert.ok(htmlContent.includes('Nayak Committee Working Capital Assessment'), 'Must render Nayak Committee section');
    assert.ok(htmlContent.includes('TAMPER-PROOF VERIFIED'), 'Must display verified status banner');

    const { closeMongoConnection } = await import('../db/mongoClient.js');
    await closeMongoConnection();
  });
});
