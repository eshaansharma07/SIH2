import express from 'express';
import { accountingService } from '../services/accountingService.js';
import { optionalAuth, requireShopAccess } from '../middleware/auth.js';

const router = express.Router();
router.use(optionalAuth);
router.use(requireShopAccess);

// Helper to extract shopId
function getShopId(req) {
  return req.query?.shopId || req.body?.shopId || req.params?.shopId || req.user?.shopId || 'ramesh-kirana';
}

// =========================================================================
// DASHBOARD & OVERVIEW
// =========================================================================

router.get('/dashboard', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const metrics = await accountingService.getDashboardMetrics(shopId);
    res.json({ success: true, ...metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// PRODUCTS & INVENTORY
// =========================================================================

router.get('/products', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { search, category, lowStockOnly, limit, offset } = req.query;
    const products = await accountingService.getProducts(shopId, {
      search: search || '',
      category: category || '',
      lowStockOnly: lowStockOnly === 'true' || lowStockOnly === true,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0
    });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const product = await accountingService.getProductById(shopId, req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const product = await accountingService.upsertProduct(shopId, req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const product = await accountingService.upsertProduct(shopId, { ...req.body, id: req.params.id });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const result = await accountingService.deleteProduct(shopId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const summary = await accountingService.getInventorySummary(shopId);
    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/inventory/adjust', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { productId, quantity, type, unitPrice, notes } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'productId and quantity are required' });
    }
    const result = await accountingService.adjustStock(shopId, productId, { quantity, type, unitPrice, notes });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/inventory/movements', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { productId, limit, offset } = req.query;
    const movements = await accountingService.getStockMovements(shopId, {
      productId: productId || '',
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    res.json({ success: true, count: movements.length, movements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// SUPPLIERS
// =========================================================================

router.get('/suppliers', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const suppliers = await accountingService.getSuppliers(shopId);
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/suppliers/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const supplier = await accountingService.getSupplierById(shopId, req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.json({ success: true, supplier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const supplier = await accountingService.upsertSupplier(shopId, req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const supplier = await accountingService.upsertSupplier(shopId, { ...req.body, id: req.params.id });
    res.json({ success: true, supplier });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const result = await accountingService.deleteSupplier(shopId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// INVOICES & BILLING
// =========================================================================

router.get('/invoices', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { search, status, paymentMode, from, to, limit, offset } = req.query;
    const invoices = await accountingService.getInvoices(shopId, {
      search,
      status,
      paymentMode,
      from,
      to,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    res.json({ success: true, count: invoices.length, invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const invoice = await accountingService.getInvoiceById(shopId, req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const invoice = await accountingService.createInvoice(shopId, req.body);
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// PURCHASES & PROCUREMENT
// =========================================================================

router.get('/purchases', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { search, status, from, to, limit, offset } = req.query;
    const purchases = await accountingService.getPurchases(shopId, {
      search,
      status,
      from,
      to,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    res.json({ success: true, count: purchases.length, purchases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/purchases/:id', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const purchase = await accountingService.getPurchaseById(shopId, req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase record not found' });
    }
    res.json({ success: true, purchase });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/purchases', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const purchase = await accountingService.createPurchase(shopId, req.body);
    res.status(201).json({ success: true, purchase });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// RECEIVABLES & PAYMENTS
// =========================================================================

router.get('/receivables', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const receivables = await accountingService.getReceivables(shopId);
    res.json({ success: true, ...receivables });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const payment = await accountingService.recordPayment(shopId, req.body);
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// REPORTS & GST
// =========================================================================

router.get('/reports/gst', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { from, to } = req.query;
    const report = await accountingService.getGstReport(shopId, { from, to });
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports/pnl', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { from, to } = req.query;
    const report = await accountingService.getProfitLoss(shopId, { from, to });
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports/sales', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { from, to, limit, offset } = req.query;
    const invoices = await accountingService.getInvoices(shopId, {
      from,
      to,
      limit: limit ? Number(limit) : 1000,
      offset: offset ? Number(offset) : 0
    });
    
    let totalSales = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    for (const inv of invoices) {
      totalSales += Number(inv.grand_total || 0);
      totalTaxable += Number(inv.subtotal || 0);
      totalTax += Number(inv.tax_total || 0);
      totalPaid += Number(inv.paid_amount || 0);
      totalBalance += Number(inv.balance_amount || 0);
    }

    res.json({
      success: true,
      summary: {
        count: invoices.length,
        totalSales: Math.round(totalSales * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalBalance: Math.round(totalBalance * 100) / 100
      },
      invoices
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/reports/purchases', async (req, res) => {
  try {
    const shopId = getShopId(req);
    const { from, to, limit, offset } = req.query;
    const purchases = await accountingService.getPurchases(shopId, {
      from,
      to,
      limit: limit ? Number(limit) : 1000,
      offset: offset ? Number(offset) : 0
    });

    let totalPurchases = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    for (const p of purchases) {
      totalPurchases += Number(p.grand_total || 0);
      totalTaxable += Number(p.subtotal || 0);
      totalTax += Number(p.tax_total || 0);
      totalPaid += Number(p.paid_amount || 0);
      totalBalance += Number(p.balance_amount || 0);
    }

    res.json({
      success: true,
      summary: {
        count: purchases.length,
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalBalance: Math.round(totalBalance * 100) / 100
      },
      purchases
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
