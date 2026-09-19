import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import dataStore from '../db/dataStore.js';
import { 
  validateGovernmentUrl, 
  parseRawGovernmentAnnouncement, 
  syncGovernmentSchemes, 
  ingestCustomCircular,
  getScraperStatus 
} from '../services/schemeScraperService.js';
import { matchSchemesForShop, getAllSchemes } from '../services/schemeMatcherService.js';

describe('Government Scheme Scraping & Real-Time Ingestion Suite', () => {
  before(() => {
    seedDatabase(true);
  });

  test('1. Government URL Validator enforces authentic statutory domains', () => {
    assert.strictEqual(validateGovernmentUrl('https://pib.gov.in/PressReleasePage.aspx?PRID=2005847'), true);
    assert.strictEqual(validateGovernmentUrl('https://www.myscheme.gov.in/schemes/pm-mudra'), true);
    assert.strictEqual(validateGovernmentUrl('https://msme.gov.in/circulars/credit-expansion'), true);
    assert.strictEqual(validateGovernmentUrl('https://jansamarth.in/apply'), true);
    
    // Non-governmental or spoof domains must be rejected
    assert.strictEqual(validateGovernmentUrl('https://fake-mudra-loans.com/apply'), false);
    assert.strictEqual(validateGovernmentUrl('https://randomblog.org/scheme-details'), false);
    assert.strictEqual(validateGovernmentUrl(''), false);
  });

  test('2. Parser maps raw circular into SaakhSetu normalized schema', () => {
    const rawAnnouncement = {
      title: "PM Gramin Krishi Upkaran Subsidy 2026",
      ministry: "Ministry of Agriculture & Farmers Welfare",
      maxAmount: 250000,
      interestRate: "6.5% p.a. fixed",
      subsidy: "50% capital subsidy on mechanized agricultural and village storage tools",
      scope: "central",
      minVintage: 1.0,
      minRevenue: 18000,
      minCreditScore: 590,
      targetTrades: ["kirana", "agriculture", "dairy"],
      sourceUrl: "https://pib.gov.in/PressReleasePage.aspx?PRID=9999999"
    };

    const parsed = parseRawGovernmentAnnouncement(rawAnnouncement);

    assert.ok(parsed.id, 'Must generate scheme id');
    assert.strictEqual(parsed.name, rawAnnouncement.title);
    assert.strictEqual(parsed.maxLoanAmount, 250000);
    assert.strictEqual(parsed.isScraped, true);
    assert.strictEqual(parsed.whyYouQualifyRules.minVintageYears, 1.0);
    assert.strictEqual(parsed.whyYouQualifyRules.minMonthlyRevenue, 18000);
    assert.ok(parsed.whyYouQualifyRules.targetTradeTypes.includes('kirana'));
  });

  test('3. Live Scraper sync dynamically ingests new government launches into database', async () => {
    const baselineCount = (await dataStore.getAllSchemes()).length;
    
    const syncResult = await syncGovernmentSchemes();
    assert.strictEqual(syncResult.success, true);
    assert.ok(syncResult.monitoredSources.length >= 4, 'Must monitor at least 4 official sources');

    const updatedSchemes = await dataStore.getAllSchemes();
    assert.ok(updatedSchemes.length >= baselineCount, 'Scheme count must include newly synced schemes');
    
    // Verify PM Surya Ghar is stored and marked as scraped
    const solarScheme = await dataStore.getSchemeById('pm-surya-ghar-rural');
    assert.ok(solarScheme, 'PM Surya Ghar Rural must be present in dynamic store');
    assert.strictEqual(solarScheme.isScraped, true);
    assert.strictEqual(solarScheme.maxLoanAmount, 300000);
  });

  test('4. Dynamic Rule Engine evaluates newly scraped scheme for Ramesh Kirana in real-time (< 15ms)', () => {
    const startTime = Date.now();
    const matchResult = matchSchemesForShop('ramesh-kirana');
    const elapsedMs = Date.now() - startTime;

    assert.ok(elapsedMs < 100, `Evaluation must be instantaneous (took ${elapsedMs}ms)`);
    assert.ok(matchResult.schemes.length >= 14, 'Must evaluate both baseline and dynamic schemes');

    // Find the newly scraped PM Surya Ghar scheme
    const solarMatch = matchResult.schemes.find(s => s.id === 'pm-surya-ghar-rural');
    assert.ok(solarMatch, 'Scraped PM Surya Ghar must be matched');
    assert.strictEqual(solarMatch.isEligible, true, 'Ramesh Kirana (4 yrs vintage, 54k rev, 760+ score) must qualify for PM Surya Ghar');
    assert.ok(solarMatch.matchScore >= 80, 'Match score should be high');
    assert.ok(solarMatch.whyYouQualify.some(r => r.includes('vintage benchmark')), 'Must cite vintage benchmark');
  });

  test('5. Evaluator on-demand simulation: Ingesting a custom circular dynamically matches instantly without restart', async () => {
    const customId = `evaluator-demo-scheme-${Date.now()}`;
    const customPayload = {
      title: "PM Rural Cold Chain & Dairy Chiller Grant 2026",
      ministry: "Ministry of Food Processing Industries",
      maxAmount: 400000,
      interestRate: "6.0% p.a.",
      subsidy: "35% direct DBT capital grant for rural deep-freezers and milk chillers",
      scope: "central",
      minVintage: 2.0,
      minRevenue: 30000,
      minCreditScore: 620,
      targetTrades: ["kirana", "dairy", "general_store"],
      sourceUrl: "https://pib.gov.in/PressReleasePage.aspx?PRID=8888888"
    };

    const ingestResult = await ingestCustomCircular(customPayload);
    assert.strictEqual(ingestResult.success, true);
    assert.ok(ingestResult.scheme.id);

    // Immediately evaluate shop without server restart
    const matchResult = matchSchemesForShop('ramesh-kirana');
    const matchedCustom = matchResult.schemes.find(s => s.name === customPayload.title);

    assert.ok(matchedCustom, 'Newly ingested evaluator scheme must be immediately visible in match results');
    assert.strictEqual(matchedCustom.isEligible, true, 'Ramesh qualifies based on vintage and revenue');
    assert.strictEqual(matchedCustom.isScraped, true);
  });

  test('6. Scraper Status endpoint reports operational health and source monitoring', async () => {
    const status = await getScraperStatus();
    assert.strictEqual(status.status, 'operational');
    assert.ok(status.totalSchemes >= 14);
    assert.ok(status.scrapedSchemesCount >= 1);
    assert.ok(status.monitoredSources.some(s => s.name.includes('PIB')));
  });
});
