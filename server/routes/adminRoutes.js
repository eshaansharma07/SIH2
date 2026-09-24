import express from 'express';
import dataStore from '../db/dataStore.js';
import { getScraperStatus, syncGovernmentSchemes } from '../services/schemeScraperService.js';
import { SCHEMES } from '../db/schemesData.js';
import { messageQueue } from '../services/messageQueueService.js';

const router = express.Router();

/**
 * GET /api/admin/metrics
 * High-level institutional & district-level MSME telemetry.
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dataStore.getAdminMetrics();
    const scraperStatus = await getScraperStatus().catch(() => null);
    const statutorySchemes = SCHEMES || [];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      platform: 'SaakhSetu Institutional Command Center',
      metrics: {
        ...metrics,
        statutorySchemesCount: statutorySchemes.length
      },
      scraperStatus: scraperStatus || {
        status: 'online',
        monitoredSources: 4,
        lastSync: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[AdminRoutes] Error fetching admin metrics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/shops
 * Searchable, filterable list of all registered MSMEs with transaction milestone progress.
 */
router.get('/shops', async (req, res) => {
  try {
    const { search = '', state = '', milestone = '', limit = 100, offset = 0 } = req.query;
    const result = await dataStore.getAllShops({
      search,
      state,
      milestone,
      limit: Math.min(200, Number(limit) || 100),
      offset: Number(offset) || 0
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[AdminRoutes] Error fetching admin shops:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/sync-schemes
 * Triggers live statutory government portal scraping and ingestion on-demand.
 */
router.post('/sync-schemes', async (req, res) => {
  try {
    const syncResult = await syncGovernmentSchemes();
    const updatedStatus = await getScraperStatus();

    res.json({
      success: true,
      message: 'Statutory government portals scanned and synced successfully',
      result: syncResult,
      status: updatedStatus
    });
  } catch (err) {
    console.error('[AdminRoutes] Error syncing schemes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/queue/stats
 * Telemetry and metrics for the Asynchronous Message Broker & Dead Letter Queue (Sessions 15 & 16).
 */
router.get('/queue/stats', (req, res) => {
  try {
    const stats = messageQueue.getQueueStats();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      architecture: 'Asynchronous Event-Driven Producer-Consumer Broker',
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/queue/dlq
 * Inspects all messages currently routed to the Dead Letter Queue.
 */
router.get('/queue/dlq', (req, res) => {
  try {
    const dlq = messageQueue.getDeadLetterQueue();
    res.json({
      success: true,
      count: dlq.length,
      deadLetterQueue: dlq
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
