import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { generateAdvisoryResponse } from '../services/aiAdvisoryService.js';

test('AI Advisory Offline Fallback Suite', async (t) => {
  seedDatabase();
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = ''; // Force offline to test fallback suite reliably without wasting quota

  try {
    await t.test('1. Festival query triggers grounded festive stock advisory without API key', async () => {
      const response = await generateAdvisoryResponse('ramesh-kirana', 'दीवाली के लिए कितना स्टॉक रखना चाहिए?');
      assert.ok(response, 'Response must exist');
      assert.ok(response.content, 'Content must not be empty');
      assert.ok(response.content.length > 50, 'Content must have meaningful length');
      assert.ok(
        response.content.includes('Ramesh') || response.content.includes('रमेश') || response.content.includes('Balrampur') || response.content.includes('बलरामपुर'),
        'Content must be grounded in shop profile'
      );
    });

    await t.test('2. Loan enquiry triggers MUDRA advisory with alternative credit score grounding', async () => {
      const response = await generateAdvisoryResponse('ramesh-kirana', 'क्या मुझे नया डीप फ्रीजर खरीदने के लिए बैंक लोन मिलेगा?');
      assert.ok(response, 'Response must exist');
      assert.ok(
        response.content.includes('MUDRA') || response.content.includes('मुद्रा') || response.content.includes('लोन') || response.content.includes('credit'),
        'Response must address loan feasibility'
      );
    });

    await t.test('3. Query about process to log transactions in English responds in English with exact POS & Keypad steps', async () => {
      const response = await generateAdvisoryResponse('ramesh-kirana', 'How do I record a daily cash or udhaar sale in SaakhSetu?', '', 'en');
      assert.ok(response, 'Response must exist');
      assert.ok(response.content, 'Content must not be empty');
      assert.ok(response.content.includes('POS Bill') || response.content.includes('Keypad'), 'Must explain POS or Keypad steps');
      assert.ok(response.content.includes('Namaste'), 'Must be in English');
      assert.ok(!response.content.includes('राम राम'), 'Must not be in Hindi when dashboard language is en');
    });

    await t.test('4. Query about recording sales in Hindi responds in Hindi with exact steps', async () => {
      const response = await generateAdvisoryResponse('ramesh-kirana', 'दैनिक नकद या उधार बिक्री कैसे दर्ज करें?', '', 'hi');
      assert.ok(response, 'Response must exist');
      assert.ok(response.content, 'Content must not be empty');
      assert.ok(response.content.includes('POS') || response.content.includes('कीपैड'), 'Must explain POS or Keypad in Hindi');
      assert.ok(response.content.includes('राम राम'), 'Must be in Hindi when dashboard language is hi');
    });
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }
});
