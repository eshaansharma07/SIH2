import express from 'express';
import { generateAdvisoryResponse, getChatHistory, getLocalCues } from '../services/aiAdvisoryService.js';
import db from '../db/database.js';

const router = express.Router();

// Sliding-window IP rate limiter for AI advisory (20 requests / minute)
const ipChatLimitMap = new Map();

function advisoryRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-client';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const clientHistory = ipChatLimitMap.get(ip) || [];
  const recent = clientHistory.filter(timestamp => now - timestamp < windowMs);

  if (recent.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded: You can send a maximum of 20 advisory messages per minute. Please wait a moment.'
    });
  }

  recent.push(now);
  ipChatLimitMap.set(ip, recent);

  // Periodic cleanup
  if (ipChatLimitMap.size > 1000) {
    for (const [key, timestamps] of ipChatLimitMap.entries()) {
      if (timestamps.every(t => now - t > windowMs)) {
        ipChatLimitMap.delete(key);
      }
    }
  }

  next();
}

// Chat with Setu AI Advisor
router.post('/chat', advisoryRateLimiter, async (req, res) => {
  try {
    const { shopId, question } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

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
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({ success: true, count: 0, history: [] });
    }
    const history = getChatHistory(shopId);
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hyper-Local Seasonal Demand Cues & District Peer Benchmarks (Powered by Google Calendar)
router.get('/cues', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    const shop = shopId ? db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId) : null;

    const tradeType = shop ? shop.trade_type : 'kirana';
    const district = shop ? shop.district : 'Balrampur';

    const cuesData = await getLocalCues(tradeType, district);
    res.json({ success: true, data: cuesData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
