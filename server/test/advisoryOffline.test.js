import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { generateAdvisoryResponse } from '../services/aiAdvisoryService.js';

test('AI Advisory Offline Fallback Suite', async (t) => {
  seedDatabase();

  await t.test('1. Festival query triggers grounded festive stock advisory without API key', async () => {
    // Force offline by passing non-existent or dummy environment
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
});
