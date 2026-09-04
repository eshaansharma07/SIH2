import express from 'express';
import { generateAdvisoryResponse, getChatHistory, getLocalCues } from '../services/aiAdvisoryService.js';
import db from '../db/database.js';

const router = express.Router();

// Chat with Vyapaar Saathi Advisor
router.post('/chat', async (req, res) => {
  try {
    const { shopId = 'ramesh-kirana', question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const advice = await generateAdvisoryResponse(shopId, question);
    res.json({ success: true, advice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Chat history
router.get('/history', (req, res) => {
  try {
    const shopId = req.query.shopId || 'ramesh-kirana';
    const history = getChatHistory(shopId);
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hyper-Local Seasonal Demand Cues & District Peer Benchmarks (Powered by Google Calendar)
router.get('/cues', async (req, res) => {
  try {
    const shopId = req.query.shopId || 'ramesh-kirana';
    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);

    const tradeType = shop ? shop.trade_type : 'kirana';
    const district = shop ? shop.district : 'Balrampur';

    const cuesData = await getLocalCues(tradeType, district);
    res.json({ success: true, data: cuesData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
