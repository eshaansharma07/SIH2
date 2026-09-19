import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Package, 
  Truck, 
  Users, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Percent, 
  Building2, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Send, 
  Eye, 
  X, 
  Calendar,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { TricolorBrush } from '../components/TricolorBrush';

export function AccountingPage({ 
  currentShop, 
  onOpenWholesale, 
  onOpenBahiKhata,
  onRefreshLedger 
}) {
  const { language } = useTranslation();
  const shopId = currentShop?.id || 'ramesh-kirana';
  const shopName = currentShop?.name || "Ramesh's Kirana Store";
  const shopState = currentShop?.state || 'Uttar Pradesh';

  // Sub-tabs: 'overview', 'invoices', 'purchases', 'inventory', 'receivables', 'suppliers', 'reports'
  const [activeSubTab, setActiveSubTab] = useState(() => {
    try {
      return sessionStorage.getItem('saakhsetu_accounting_tab') || 'overview';
    } catch (_) {
      return 'overview';
    }
  });

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [receivables, setReceivables] = useState(null);
  const [gstReport, setGstReport] = useState(null);
  const [pnlReport, setPnlReport] = useState(null);

  // Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
  const [stockMovementsModalOpen, setStockMovementsModalOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState([]);

  // Search and filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [purchaseSearch, setPurchaseSearch] = useState('');

  // Status message / toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all accounting data
  const loadAllData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const [dashRes, prodRes, suppRes, invRes, purRes, recRes, gstRes, pnlRes] = await Promise.all([
        api.getAccountingDashboard(shopId).catch(() => null),
        api.getProducts(shopId, { limit: 200 }).catch(() => null),
        api.getSuppliers(shopId).catch(() => null),
        api.getInvoices(shopId, { limit: 100 }).catch(() => null),
        api.getPurchases(shopId, { limit: 100 }).catch(() => null),
        api.getReceivables(shopId).catch(() => null),
        api.getGstReport(shopId).catch(() => null),
        api.getPnlReport(shopId).catch(() => null)
      ]);

      if (dashRes?.success) setDashboardData(dashRes);
      if (prodRes?.success) setProducts(prodRes.products || []);
      if (suppRes?.success) setSuppliers(suppRes.suppliers || []);
      if (invRes?.success) setInvoices(invRes.invoices || []);
      if (purRes?.success) setPurchases(purRes.purchases || []);
      if (recRes?.success) setReceivables(recRes);
      if (gstRes?.success) setGstReport(gstRes);
      if (pnlRes?.success) setPnlReport(pnlRes);
    } catch (err) {
      console.error('Failed to load accounting data:', err);
      showToast(language === 'hi' ? 'डेटा लोड करने में समस्या' : 'Failed to load accounting data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [shopId]);

  // Handle external mega-menu navigation events
  useEffect(() => {
    const handleAccountingTabEvent = (e) => {
      const targetTab = e.detail?.tab;
      if (targetTab) {
        setActiveSubTab(targetTab);
        try { sessionStorage.setItem('saakhsetu_accounting_tab', targetTab); } catch (_) {}
      }
      if (e.detail?.action === 'new_invoice') {
        setInvoiceModalOpen(true);
      }
    };
    window.addEventListener('saakhsetu:accounting-tab', handleAccountingTabEvent);
    return () => window.removeEventListener('saakhsetu:accounting-tab', handleAccountingTabEvent);
  }, []);

  const switchSubTab = (tab) => {
    setActiveSubTab(tab);
    try { sessionStorage.setItem('saakhsetu_accounting_tab', tab); } catch (_) {}
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !productSearch || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.hsn_code && p.hsn_code.includes(productSearch));
      const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter;
      const matchesLowStock = !lowStockFilter || (p.current_stock <= p.reorder_level);
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, productSearch, productCategoryFilter, lowStockFilter]);

  // Unique product categories
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = !invoiceSearch || 
        inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(invoiceSearch.toLowerCase()));
      const matchesStatus = invoiceStatusFilter === 'all' || inv.payment_status === invoiceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(pur => {
      return !purchaseSearch || 
        pur.purchase_number.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        (pur.supplier_name && pur.supplier_name.toLowerCase().includes(purchaseSearch.toLowerCase()));
    });
  }, [purchases, purchaseSearch]);

  // CSV Export helper
  const exportCsv = (filename, rows) => {
    if (!rows || !rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'hi' ? 'CSV फाइल डाउनलोड हो गई!' : 'CSV file downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1B2A4A] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border font-medium text-sm transition-all ${
          toastMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white border-b border-[#ECE5D8] px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/60 shadow-sm">
                <Receipt className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B2A4A] flex items-center gap-2">
                  {language === 'hi' ? 'व्यापार अकाउंटिंग व बिलिंग' : 'Vyapaar Accounting & Billing'}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    GST Ready
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  {language === 'hi' 
                    ? `${shopName} • पक्की बिलिंग, इन्वेंटरी, सप्लायर और बही-खाता से 100% सिंक्रोनाइज़्ड`
                    : `${shopName} • Invoicing, inventory, procurement & 100% synced with core Bahi-Khata`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-[#E5DFD5] bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50"
              title={language === 'hi' ? 'रिफ्रेश करें' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
            <button
              onClick={() => setInvoiceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'नया बिल (POS)' : '+ New Bill (POS)'}</span>
            </button>
            <button
              onClick={() => setPurchaseModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E5DFD5] hover:bg-stone-50 text-stone-800 text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Truck className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">{language === 'hi' ? 'खरीद दर्ज करें' : 'Record Purchase'}</span>
              <span className="sm:hidden">{language === 'hi' ? 'खरीद' : 'Purchase'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="max-w-7xl mx-auto mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', labelHi: 'अवलोकन', labelEn: 'Overview', icon: FileText },
            { id: 'invoices', labelHi: 'बिक्री बिल (Invoices)', labelEn: 'Sales Invoices', icon: Receipt },
            { id: 'purchases', labelHi: 'थोक खरीद (Purchases)', labelEn: 'Purchases', icon: Truck },
            { id: 'inventory', labelHi: 'इन्वेंटरी व स्टॉक', labelEn: 'Inventory & Stock', icon: Package },
            { id: 'receivables', labelHi: 'उधार वसूली (Debtors)', labelEn: 'Receivables Aging', icon: Users },
            { id: 'suppliers', labelHi: 'सप्लायर (Suppliers)', labelEn: 'Suppliers', icon: Building2 },
            { id: 'reports', labelHi: 'जीएसटी व पीएंडएल', labelEn: 'GST & P&L Reports', icon: Percent },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1B2A4A] text-white shadow-sm'
                    : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{language === 'hi' ? tab.labelHi : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Low stock alert strip if any */}
            {dashboardData?.lowStockProducts?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">
                      {language === 'hi'
                        ? `${dashboardData.lowStockProducts.length} सामान का स्टॉक खत्म होने वाला है!`
                        : `${dashboardData.lowStockProducts.length} items are running low on stock!`}
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {dashboardData.lowStockProducts.slice(0, 3).map(p => `${p.name} (${p.current_stock} ${p.unit})`).join(', ')}
                      {dashboardData.lowStockProducts.length > 3 ? ' ...' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLowStockFilter(true);
                    switchSubTab('inventory');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium self-start sm:self-auto transition-colors whitespace-nowrap"
                >
                  {language === 'hi' ? 'स्टॉक देखें व रीऑर्डर करें' : 'View & Reorder'}
                </button>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Today Invoiced Sales */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE5D8] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {language === 'hi' ? 'आज की बिल बिक्री' : "Today's Invoiced Sales"}
                    </span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                      <Receipt className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#1B2A4A]">
                    ₹{Number(dashboardData?.todaySales || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {language === 'hi' ? 'कुल बिल:' : 'Total bills:'} <span className="font-semibold text-stone-700">{dashboardData?.invoiceCount || invoices.length}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">{language === 'hi' ? 'मासिक बिक्री:' : 'Monthly Sales:'}</span>
                  <span className="font-semibold text-stone-800">
                    ₹{Number(dashboardData?.monthSales || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Inventory Valuation */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE5D8] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {language === 'hi' ? 'कुल स्टॉक मूल्यांकन' : 'Inventory Valuation'}
                    </span>
                    <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                      <Package className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#1B2A4A]">
                    ₹{Number(dashboardData?.inventoryValuation || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {language === 'hi' ? 'उत्पाद संख्या:' : 'Products tracked:'} <span className="font-semibold text-stone-700">{products.length}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">{language === 'hi' ? 'कम स्टॉक अलर्ट:' : 'Low stock items:'}</span>
                  <span className={`font-semibold ${dashboardData?.lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {dashboardData?.lowStockCount || 0}
                  </span>
                </div>
              </div>

              {/* Card 3: Pending Receivables / Debtors */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE5D8] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {language === 'hi' ? 'बकाया उधार (Receivables)' : 'Pending Receivables'}
                    </span>
                    <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-amber-900">
                    ₹{Number(dashboardData?.totalReceivables || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {language === 'hi' ? 'ऋणी ग्राहक:' : 'Debtor accounts:'} <span className="font-semibold text-stone-700">{receivables?.customerCount || 0}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">{language === 'hi' ? 'अति-देय (30+ दिन):' : 'Overdue (30d+):'}</span>
                  <span className="font-semibold text-rose-600">
                    ₹{Number((receivables?.buckets?.d31_60 || 0) + (receivables?.buckets?.d61_90 || 0) + (receivables?.buckets?.d90_plus || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Card 4: Net GST Position */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE5D8] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {language === 'hi' ? 'जीएसटी स्थिति (Tax Balance)' : 'Net GST Status'}
                    </span>
                    <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                      <Percent className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#1B2A4A]">
                    ₹{Number(gstReport?.netGstPayable || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {language === 'hi' ? 'इनपुट टैक्स क्रेडिट (ITC):' : 'Input Tax Credit:'} <span className="font-semibold text-emerald-700">₹{Number(gstReport?.itcTotal || 0).toLocaleString('en-IN')}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">{language === 'hi' ? 'आउटपुट टैक्स:' : 'Output Tax:'}</span>
                  <span className="font-semibold text-stone-800">
                    ₹{Number(gstReport?.outputTaxTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Two Column Section: Recent Invoices & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Invoices */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ECE5D8] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1B2A4A]">
                      {language === 'hi' ? 'हाल के पक्के बिल (Recent Invoices)' : 'Recent Invoices'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {language === 'hi' ? 'सीधे बही-खाते और स्टॉक से जुड़े पक्के बिल' : 'Directly synced with inventory & ledger'}
                    </p>
                  </div>
                  <button
                    onClick={() => switchSubTab('invoices')}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {invoices.length === 0 ? (
                  <div className="text-center py-10 text-stone-400 text-sm">
                    {language === 'hi' ? 'कोई बिल नहीं मिला। नया बिल बनाएं।' : 'No invoices yet. Create your first bill.'}
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {invoices.slice(0, 5).map(inv => (
                      <div key={inv.id} className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/60 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`p-2 rounded-xl ${
                            inv.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            inv.payment_status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            <Receipt className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-[#1B2A4A]">
                              {inv.customer_name || (language === 'hi' ? 'नकद ग्राहक' : 'Cash Walk-in')}
                            </div>
                            <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                              <span>{inv.invoice_number}</span>
                              <span>•</span>
                              <span>{inv.invoice_date}</span>
                              <span>•</span>
                              <span className="uppercase font-mono text-[10px] px-1.5 py-0.2 bg-stone-100 rounded">
                                {inv.payment_mode}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-sm font-bold text-[#1B2A4A]">
                              ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              inv.payment_status === 'paid' ? 'bg-emerald-100/70 text-emerald-800' :
                              inv.payment_status === 'partial' ? 'bg-amber-100/70 text-amber-800' : 'bg-rose-100/70 text-rose-800'
                            }`}>
                              {inv.payment_status === 'paid' ? (language === 'hi' ? 'पूर्ण चुकता' : 'Paid') :
                               inv.payment_status === 'partial' ? (language === 'hi' ? 'आंशिक' : 'Partial') :
                               (language === 'hi' ? 'उधार' : 'Khata')}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-stone-200 text-stone-500 hover:text-stone-800 rounded-lg transition-colors"
                            title={language === 'hi' ? 'रसीद देखें / प्रिंट' : 'View / Print Receipt'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 1 Col: Quick Accounting Workflows */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#ECE5D8] p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#1B2A4A] mb-3">
                    {language === 'hi' ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setInvoiceModalOpen(true)}
                      className="p-3 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl text-left transition-colors"
                    >
                      <Receipt className="w-5 h-5 text-emerald-700 mb-1.5" />
                      <div className="text-xs font-bold text-emerald-950">
                        {language === 'hi' ? 'नया बिल' : '+ New Bill'}
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        {language === 'hi' ? 'POS काउंटर' : 'Counter POS'}
                      </div>
                    </button>

                    <button
                      onClick={() => setPurchaseModalOpen(true)}
                      className="p-3 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 rounded-xl text-left transition-colors"
                    >
                      <Truck className="w-5 h-5 text-blue-700 mb-1.5" />
                      <div className="text-xs font-bold text-blue-950">
                        {language === 'hi' ? 'थोक खरीद' : '+ Purchase'}
                      </div>
                      <div className="text-[11px] text-blue-700">
                        {language === 'hi' ? 'स्टॉक बढ़ोतरी' : 'Add Stock'}
                      </div>
                    </button>

                    <button
                      onClick={() => setProductModalOpen(true)}
                      className="p-3 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 rounded-xl text-left transition-colors"
                    >
                      <Package className="w-5 h-5 text-amber-700 mb-1.5" />
                      <div className="text-xs font-bold text-amber-950">
                        {language === 'hi' ? 'नया सामान' : '+ Product'}
                      </div>
                      <div className="text-[11px] text-amber-700">
                        {language === 'hi' ? 'कैटलॉग में जोड़ें' : 'Add to Catalog'}
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="p-3 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/60 rounded-xl text-left transition-colors"
                    >
                      <IndianRupee className="w-5 h-5 text-purple-700 mb-1.5" />
                      <div className="text-xs font-bold text-purple-950">
                        {language === 'hi' ? 'उधार वसूली' : 'Settle Udhaar'}
                      </div>
                      <div className="text-[11px] text-purple-700">
                        {language === 'hi' ? 'खाता जमा' : 'Record Payment'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Audit & Credit Tie-in card */}
                <div className="bg-gradient-to-br from-[#1B2A4A] to-[#253966] text-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'hi' ? 'क्रेडिट इंजन से सीधा जुड़ाव' : 'Credit Scoring Tie-In'}</span>
                  </div>
                  <h4 className="text-base font-bold mb-1">
                    {language === 'hi' ? 'पक्की बिलिंग से मजबूत साख' : 'Audited Invoicing Builds Trust'}
                  </h4>
                  <p className="text-xs text-stone-200 leading-relaxed mb-4">
                    {language === 'hi' 
                      ? 'हर बिल और खरीद स्वतः मुख्य बही-खाते में दर्ज होती है। समय पर उधार वसूली और पक्का स्टॉक रिकॉर्ड आपके 4-स्तंभ क्रेडिट स्कोर को सीधे बढ़ाता है।'
                      : 'Every invoice and procurement automatically flows into your audited ledger. Strict receivables recovery and stock tracking directly lift your credit score.'}
                  </p>
                  <button
                    onClick={onOpenBahiKhata}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/20"
                  >
                    <span>{language === 'hi' ? 'मूल बही-खाता देखें' : 'View Core Bahi-Khata'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INVOICES & BILLING */}
        {/* ========================================================================= */}
        {activeSubTab === 'invoices' && (
          <div className="space-y-4">
            {/* Header / Filter Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-[#ECE5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder={language === 'hi' ? 'बिल नंबर या ग्राहक का नाम खोजें...' : 'Search invoice # or customer...'}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'paid', 'partial', 'unpaid'].map(st => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      invoiceStatusFilter === st
                        ? 'bg-amber-800 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st === 'all' ? (language === 'hi' ? 'सभी' : 'All') :
                     st === 'paid' ? (language === 'hi' ? 'पूर्ण' : 'Paid') :
                     st === 'partial' ? (language === 'hi' ? 'आंशिक' : 'Partial') :
                     (language === 'hi' ? 'उधार' : 'Khata')}
                  </button>
                ))}

                <button
                  onClick={() => exportCsv('invoices.csv', filteredInvoices)}
                  className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Export CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                  onClick={() => setInvoiceModalOpen(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'नया बिल' : '+ New Bill'}</span>
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-2xl border border-[#ECE5D8] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{language === 'hi' ? 'बिल विवरण' : 'Invoice Details'}</th>
                      <th className="py-3 px-4">{language === 'hi' ? 'ग्राहक' : 'Customer'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'कर योग्य' : 'Taxable'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'जीएसटी' : 'GST'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'कुल राशि' : 'Grand Total'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'बकाया' : 'Balance'}</th>
                      <th className="py-3 px-4 text-center">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                      <th className="py-3 px-4 text-center">{language === 'hi' ? 'कार्य' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-stone-400">
                          {language === 'hi' ? 'कोई बिल नहीं मिला' : 'No invoices found'}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1B2A4A]">{inv.invoice_number}</div>
                            <div className="text-stone-400 text-[11px]">{inv.invoice_date}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-800">
                              {inv.customer_name || (language === 'hi' ? 'नकद ग्राहक' : 'Cash Walk-in')}
                            </div>
                            {inv.customer_phone && (
                              <div className="text-stone-400 text-[11px] font-mono">{inv.customer_phone}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            ₹{Number(inv.taxable_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            ₹{Number((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#1B2A4A] font-mono">
                            ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            {Number(inv.balance_due || 0) > 0 ? (
                              <span className="text-rose-600">₹{Number(inv.balance_due).toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-emerald-700">₹0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                              inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              inv.payment_status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {inv.payment_status === 'paid' ? (language === 'hi' ? 'पूर्ण' : 'Paid') :
                               inv.payment_status === 'partial' ? (language === 'hi' ? 'आंशिक' : 'Partial') :
                               (language === 'hi' ? 'उधार' : 'Khata')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setReceiptModalOpen(true);
                                }}
                                className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                                title={language === 'hi' ? 'प्रिंट / रसीद' : 'Print / Receipt'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PURCHASES & PROCUREMENT */}
        {/* ========================================================================= */}
        {activeSubTab === 'purchases' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#ECE5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  placeholder={language === 'hi' ? 'खरीद पर्ची नंबर या सप्लायर का नाम...' : 'Search purchase # or supplier...'}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportCsv('purchases.csv', filteredPurchases)}
                  className="px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setPurchaseModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'नई थोक खरीद' : '+ New Purchase'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#ECE5D8] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{language === 'hi' ? 'खरीद नंबर' : 'Purchase #'}</th>
                      <th className="py-3 px-4">{language === 'hi' ? 'सप्लायर (थोक मंडी)' : 'Supplier'}</th>
                      <th className="py-3 px-4">{language === 'hi' ? 'तारीख' : 'Date'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'मूल राशि' : 'Subtotal'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'जीएसटी (ITC)' : 'GST (ITC)'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'कुल भुगतान' : 'Total Amount'}</th>
                      <th className="py-3 px-4 text-center">{language === 'hi' ? 'मोड' : 'Mode'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-400">
                          {language === 'hi' ? 'कोई खरीद रिकॉर्ड नहीं मिला' : 'No purchase records found'}
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map(pur => (
                        <tr key={pur.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#1B2A4A] font-mono">
                            {pur.purchase_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-800">{pur.supplier_name}</div>
                          </td>
                          <td className="py-3.5 px-4 text-stone-500 text-xs">
                            {pur.purchase_date}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            ₹{Number(pur.subtotal).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                            ₹{Number(pur.gst || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#1B2A4A] font-mono">
                            ₹{Number(pur.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[11px] uppercase font-mono px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                              {pur.payment_mode}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INVENTORY & STOCK */}
        {/* ========================================================================= */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-[#ECE5D8] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={language === 'hi' ? 'सामान का नाम, SKU या HSN खोजें...' : 'Search item, SKU or HSN...'}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-700 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? (language === 'hi' ? 'सभी श्रेणियां' : 'All Categories') : cat}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setLowStockFilter(!lowStockFilter)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    lowStockFilter
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'hi' ? 'कम स्टॉक केवल' : 'Low Stock Only'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    api.getStockMovements(shopId, { limit: 50 }).then(res => {
                      if (res?.movements) {
                        setStockMovements(res.movements);
                        setStockMovementsModalOpen(true);
                      }
                    });
                  }}
                  className="px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'स्टॉक ऑडिट ट्रेल' : 'Stock Audit'}</span>
                </button>

                <button
                  onClick={() => setProductModalOpen(true)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'नया उत्पाद जोड़ें' : '+ Add Product'}</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#ECE5D8] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{language === 'hi' ? 'उत्पाद व SKU' : 'Product & SKU'}</th>
                      <th className="py-3 px-4">{language === 'hi' ? 'श्रेणी / HSN' : 'Category / HSN'}</th>
                      <th className="py-3 px-4 text-center">{language === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'खरीद भाव' : 'Cost Price'}</th>
                      <th className="py-3 px-4 text-right">{language === 'hi' ? 'बिक्री भाव' : 'Selling Price'}</th>
                      <th className="py-3 px-4 text-center">{language === 'hi' ? 'जीएसटी %' : 'GST Rate'}</th>
                      <th className="py-3 px-4 text-center">{language === 'hi' ? 'कार्य' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-400">
                          {language === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No products found'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const isLow = p.current_stock <= p.reorder_level;
                        const marginPct = p.selling_price > 0 && p.purchase_price > 0
                          ? Math.round(((p.selling_price - p.purchase_price) / p.selling_price) * 100)
                          : 0;

                        return (
                          <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#1B2A4A]">{p.name}</div>
                              <div className="text-stone-400 text-[11px] font-mono">{p.sku}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-stone-700">{p.category}</div>
                              <div className="text-stone-400 text-[11px]">HSN: {p.hsn_code}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLow ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800'
                              }`}>
                                {isLow && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                                {p.current_stock} {p.unit}
                              </span>
                              <div className="text-stone-400 text-[10px] mt-0.5">
                                {language === 'hi' ? 'रीऑर्डर:' : 'Reorder:'} {p.reorder_level}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-stone-600">
                              ₹{Number(p.purchase_price).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#1B2A4A]">
                              ₹{Number(p.selling_price).toFixed(2)}
                              <span className="block text-[10px] text-emerald-700 font-semibold">
                                +{marginPct}% {language === 'hi' ? 'मार्जिन' : 'margin'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">
                                {p.gst_rate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedProductForAdjust(p);
                                    setAdjustStockModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
                                  title={language === 'hi' ? 'स्टॉक सुधारें' : 'Adjust Stock'}
                                >
                                  {language === 'hi' ? 'स्टॉक +/-' : 'Adjust'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: RECEIVABLES AGING (DEBTORS) */}
        {/* ========================================================================= */}
        {activeSubTab === 'receivables' && (
          <div className="space-y-6">
            {/* Aging Buckets Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-sm">
                <div className="text-xs font-semibold text-emerald-700 uppercase">
                  {language === 'hi' ? '0-30 दिन (सामान्य)' : '0-30 Days (Current)'}
                </div>
                <div className="text-xl font-bold text-emerald-900 mt-1 font-mono">
                  ₹{Number(receivables?.buckets?.d0_30 || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">
                  {language === 'hi' ? 'सुरक्षित सीमा में' : 'Within normal cycle'}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-sm">
                <div className="text-xs font-semibold text-blue-700 uppercase">
                  {language === 'hi' ? '31-60 दिन (फॉलोअप)' : '31-60 Days (Follow-up)'}
                </div>
                <div className="text-xl font-bold text-blue-900 mt-1 font-mono">
                  ₹{Number(receivables?.buckets?.d31_60 || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">
                  {language === 'hi' ? 'स्मरण भेजना आवश्यक' : 'Follow-up due'}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm">
                <div className="text-xs font-semibold text-amber-700 uppercase">
                  {language === 'hi' ? '61-90 दिन (विलंबित)' : '61-90 Days (Overdue)'}
                </div>
                <div className="text-xl font-bold text-amber-900 mt-1 font-mono">
                  ₹{Number(receivables?.buckets?.d61_90 || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">
                  {language === 'hi' ? 'क्रेडिट स्कोर पर असर' : 'Affects score'}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm">
                <div className="text-xs font-semibold text-rose-700 uppercase">
                  {language === 'hi' ? '90+ दिन (गंभीर/NPA)' : '90+ Days (Critical)'}
                </div>
                <div className="text-xl font-bold text-rose-900 mt-1 font-mono">
                  ₹{Number(receivables?.buckets?.d90_plus || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-rose-600 mt-0.5">
                  {language === 'hi' ? 'तत्काल वसूली आवश्यक' : 'Critical recovery'}
                </div>
              </div>
            </div>

            {/* Debtors List */}
            <div className="bg-white rounded-2xl border border-[#ECE5D8] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A]">
                    {language === 'hi' ? 'ग्राहक बकाया एवं उधार आयु' : 'Customer Balances & Aging'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'hi' 
                      ? 'व्हाट्सएप से एक-क्लिक में तकाजा भेजें अथवा बकाया खाता चुकता करें'
                      : 'Send one-tap WhatsApp payment reminders or record cash collections'}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'खाता जमा (Payment)' : 'Record Payment'}</span>
                </button>
              </div>

              {receivables?.customers?.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm">
                  {language === 'hi' ? 'बधाई! किसी ग्राहक का उधार बकाया नहीं है।' : 'Great! No pending customer receivables.'}
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {receivables?.customers?.map(c => {
                    const phoneClean = (c.phone || '').replace(/\D/g, '');
                    const waText = encodeURIComponent(
                      language === 'hi'
                        ? `राम राम ${c.name} जी! आपकी दुकान ${shopName} पर कुल ₹${c.totalDue} का बकाया है। कृपया समय पर भुगतान करें। धन्यवाद!`
                        : `Namaste ${c.name} ji! A friendly reminder from ${shopName} that an outstanding balance of ₹${c.totalDue} is pending. Kindly settle at your convenience. Thank you!`
                    );
                    const waUrl = `https://wa.me/91${phoneClean}?text=${waText}`;

                    return (
                      <div key={c.customerId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 px-2 rounded-xl transition-colors">
                        <div>
                          <div className="font-bold text-sm text-[#1B2A4A] flex items-center gap-2">
                            <span>{c.name}</span>
                            {c.village && <span className="text-xs text-stone-400 font-normal">({c.village})</span>}
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-3">
                            <span>{language === 'hi' ? 'अंतिम बिल:' : 'Last Bill:'} {c.lastInvoiceDate || 'N/A'}</span>
                            <span>•</span>
                            <span>{language === 'hi' ? 'आयु:' : 'Aging:'} <strong className="text-stone-700">{c.maxAgeDays} {language === 'hi' ? 'दिन' : 'days'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="text-base font-bold text-amber-900 font-mono">
                              ₹{Number(c.totalDue).toLocaleString('en-IN')}
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              c.maxAgeDays <= 30 ? 'bg-emerald-100 text-emerald-800' :
                              c.maxAgeDays <= 60 ? 'bg-blue-100 text-blue-800' :
                              c.maxAgeDays <= 90 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {c.maxAgeDays <= 30 ? '0-30d' : c.maxAgeDays <= 60 ? '31-60d' : c.maxAgeDays <= 90 ? '61-90d' : '90d+'}
                            </span>
                          </div>

                          {phoneClean && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{language === 'hi' ? 'तकाजा' : 'WhatsApp'}</span>
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setPaymentModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
                          >
                            {language === 'hi' ? 'जमा करें' : 'Collect'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SUPPLIERS */}
        {/* ========================================================================= */}
        {activeSubTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#ECE5D8] flex items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-[#1B2A4A]">
                  {language === 'hi' ? 'थोक व्यापारी व सप्लायर डायरेक्टरी' : 'Wholesale Suppliers & Mandis'}
                </h3>
                <p className="text-xs text-stone-500">
                  {language === 'hi' ? 'मंडी आढ़ती, वितरक और पक्के बिल जारीकर्ता' : 'Mandi commission agents & FMCG distributors'}
                </p>
              </div>

              <button
                onClick={() => setSupplierModalOpen(true)}
                className="px-4 py-2 bg-[#1B2A4A] hover:bg-[#253966] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>{language === 'hi' ? 'नया सप्लायर जोड़ें' : '+ Add Supplier'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.map(supp => (
                <div key={supp.id} className="bg-white rounded-2xl border border-[#ECE5D8] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-base text-[#1B2A4A]">{supp.name}</div>
                      <span className="p-1.5 bg-stone-100 text-stone-600 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="space-y-1 mt-3 text-xs text-stone-600">
                      <div>📞 <span className="font-mono text-stone-800">{supp.phone || 'N/A'}</span></div>
                      <div>🏛️ <span>{supp.address || 'Local Mandi'}, {supp.state}</span></div>
                      {supp.gstin && (
                        <div className="mt-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-mono text-[11px] font-semibold">
                            GSTIN: {supp.gstin}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setPurchaseModalOpen(true);
                      }}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                    >
                      <span>{language === 'hi' ? 'माल खरीदें' : 'New Purchase'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: REPORTS & GST */}
        {/* ========================================================================= */}
        {activeSubTab === 'reports' && (
          <div className="space-y-6">
            {/* GST Computation Box */}
            <div className="bg-white rounded-2xl border border-[#ECE5D8] p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A] flex items-center gap-2">
                    {language === 'hi' ? 'जीएसटी सारांश (GSTR-1 व GSTR-3B अनुरूप)' : 'GST Computation (GSTR-1 & 3B Ready)'}
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                      Verified
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'hi' 
                      ? 'बिक्री पर देय टैक्स और खरीद पर इनपुट टैक्स क्रेडिट (ITC) का शुद्ध हिसाब'
                      : 'Output tax collected on sales offset by Input Tax Credit (ITC) on procurement'}
                  </p>
                </div>

                <button
                  onClick={() => exportCsv('gst_summary.csv', [
                    {
                      Metric: 'Total Taxable Sales Turnover',
                      Amount: gstReport?.taxableSales || 0
                    },
                    {
                      Metric: 'Output CGST',
                      Amount: gstReport?.outputTax?.cgst || 0
                    },
                    {
                      Metric: 'Output SGST',
                      Amount: gstReport?.outputTax?.sgst || 0
                    },
                    {
                      Metric: 'Output IGST',
                      Amount: gstReport?.outputTax?.igst || 0
                    },
                    {
                      Metric: 'Input Tax Credit (ITC Total)',
                      Amount: gstReport?.itcTotal || 0
                    },
                    {
                      Metric: 'Net Tax Payable',
                      Amount: gstReport?.netGstPayable || 0
                    }
                  ])}
                  className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'जीएसटी रिपोर्ट डाउनलोड करें (CSV)' : 'Download GST Summary (CSV)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                  <div className="text-xs font-semibold text-stone-500 uppercase">
                    {language === 'hi' ? 'कुल कर योग्य बिक्री' : 'Taxable Turnover'}
                  </div>
                  <div className="text-xl font-bold text-[#1B2A4A] mt-1 font-mono">
                    ₹{Number(gstReport?.taxableSales || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {language === 'hi' ? 'कुल बिल:' : 'Total bills:'} {gstReport?.invoicesCount || 0}
                  </div>
                </div>

                <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200/80">
                  <div className="text-xs font-semibold text-purple-700 uppercase">
                    {language === 'hi' ? 'आउटपुट टैक्स (देय)' : 'Output GST (Liability)'}
                  </div>
                  <div className="text-xl font-bold text-purple-950 mt-1 font-mono">
                    ₹{Number(gstReport?.outputTaxTotal || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5 font-mono">
                    CGST: ₹{Number(gstReport?.outputTax?.cgst || 0).toLocaleString('en-IN')} | SGST: ₹{Number(gstReport?.outputTax?.sgst || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                  <div className="text-xs font-semibold text-emerald-700 uppercase">
                    {language === 'hi' ? 'इनपुट टैक्स क्रेडिट (ITC)' : 'Input Tax Credit (ITC)'}
                  </div>
                  <div className="text-xl font-bold text-emerald-950 mt-1 font-mono">
                    ₹{Number(gstReport?.itcTotal || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {language === 'hi' ? 'थोक खरीद से अर्जित क्रेडिट' : 'Earned on registered purchases'}
                  </div>
                </div>
              </div>
            </div>

            {/* Profit & Loss Statement */}
            <div className="bg-white rounded-2xl border border-[#ECE5D8] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A]">
                    {language === 'hi' ? 'नफा-नुकसान पत्रक (Profit & Loss Statement)' : 'Profit & Loss Statement'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'hi' ? 'व्यापार आय, बेचे गए माल की लागत (COGS) और शुद्ध मुनाफा' : 'Revenue, Cost of Goods Sold & Operating Margin'}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-stone-100 text-sm">
                <div className="py-3 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{language === 'hi' ? 'कुल बिल बिक्री आय (Revenue)' : 'Total Sales Revenue'}</span>
                  <span className="font-bold text-emerald-700 font-mono text-base">
                    +₹{Number(pnlReport?.totalSalesRevenue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{language === 'hi' ? 'बेचे गए सामान की लागत (Cost of Goods Sold)' : 'Cost of Goods Sold (COGS)'}</span>
                  <span className="font-bold text-rose-600 font-mono text-base">
                    -₹{Number(pnlReport?.costOfGoodsSold || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between bg-stone-50/60 px-3 rounded-xl font-bold">
                  <span className="text-[#1B2A4A]">{language === 'hi' ? 'सकल मुनाफा (Gross Profit)' : 'Gross Profit'}</span>
                  <span className="text-[#1B2A4A] font-mono text-lg">
                    ₹{Number(pnlReport?.grossProfit || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{language === 'hi' ? 'दुकान व परिचालन खर्च (Operating Expenses)' : 'Operating Expenses'}</span>
                  <span className="font-bold text-stone-600 font-mono text-base">
                    -₹{Number(pnlReport?.operatingExpenses || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="py-3.5 flex items-center justify-between bg-emerald-50/70 px-3 rounded-xl font-bold border border-emerald-200/80">
                  <div>
                    <div className="text-emerald-950 text-base">{language === 'hi' ? 'शुद्ध परिचालन मुनाफा (Net Profit)' : 'Net Operating Profit'}</div>
                    <div className="text-xs text-emerald-700 font-normal mt-0.5">
                      {language === 'hi' ? 'मार्जिन:' : 'Margin:'} {pnlReport?.netMarginPct || '0'}%
                    </div>
                  </div>
                  <span className="text-emerald-950 font-mono text-xl">
                    ₹{Number(pnlReport?.netOperatingProfit || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RAPID BILLING / POS MODAL */}
      {/* ========================================================================= */}
      {invoiceModalOpen && (
        <InvoiceFormModal
          shopId={shopId}
          products={products}
          language={language}
          onClose={() => setInvoiceModalOpen(false)}
          onSuccess={(newInv) => {
            setInvoiceModalOpen(false);
            showToast(language === 'hi' ? 'बिल सफलतापूर्वक बनाया गया!' : 'Invoice created successfully!');
            setSelectedInvoice(newInv);
            setReceiptModalOpen(true);
            loadAllData(true);
            onRefreshLedger?.();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PURCHASE MODAL */}
      {/* ========================================================================= */}
      {purchaseModalOpen && (
        <PurchaseFormModal
          shopId={shopId}
          products={products}
          suppliers={suppliers}
          language={language}
          onClose={() => setPurchaseModalOpen(false)}
          onSuccess={() => {
            setPurchaseModalOpen(false);
            showToast(language === 'hi' ? 'खरीद सफलतापूर्वक दर्ज की गई!' : 'Purchase recorded successfully!');
            loadAllData(true);
            onRefreshLedger?.();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD PRODUCT MODAL */}
      {/* ========================================================================= */}
      {productModalOpen && (
        <ProductFormModal
          shopId={shopId}
          language={language}
          onClose={() => setProductModalOpen(false)}
          onSuccess={() => {
            setProductModalOpen(false);
            showToast(language === 'hi' ? 'उत्पाद कैटलॉग में जोड़ा गया!' : 'Product added to catalog!');
            loadAllData(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADJUST STOCK MODAL */}
      {/* ========================================================================= */}
      {adjustStockModalOpen && selectedProductForAdjust && (
        <AdjustStockModal
          shopId={shopId}
          product={selectedProductForAdjust}
          language={language}
          onClose={() => {
            setAdjustStockModalOpen(false);
            setSelectedProductForAdjust(null);
          }}
          onSuccess={() => {
            setAdjustStockModalOpen(false);
            setSelectedProductForAdjust(null);
            showToast(language === 'hi' ? 'स्टॉक सफलतापूर्वक सुधारा गया!' : 'Stock adjusted successfully!');
            loadAllData(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD SUPPLIER MODAL */}
      {/* ========================================================================= */}
      {supplierModalOpen && (
        <SupplierFormModal
          shopId={shopId}
          language={language}
          onClose={() => setSupplierModalOpen(false)}
          onSuccess={() => {
            setSupplierModalOpen(false);
            showToast(language === 'hi' ? 'सप्लायर सफलतापूर्वक जोड़ा गया!' : 'Supplier added successfully!');
            loadAllData(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RECORD PAYMENT MODAL */}
      {/* ========================================================================= */}
      {paymentModalOpen && (
        <PaymentFormModal
          shopId={shopId}
          receivables={receivables}
          language={language}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setPaymentModalOpen(false);
            showToast(language === 'hi' ? 'भुगतान सफलतापूर्वक दर्ज किया गया!' : 'Payment recorded successfully!');
            loadAllData(true);
            onRefreshLedger?.();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: THERMAL RECEIPT PREVIEW */}
      {/* ========================================================================= */}
      {receiptModalOpen && selectedInvoice && (
        <ThermalReceiptModal
          shop={currentShop}
          invoice={selectedInvoice}
          language={language}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: STOCK AUDIT TRAIL MODAL */}
      {/* ========================================================================= */}
      {stockMovementsModalOpen && (
        <StockAuditTrailModal
          movements={stockMovements}
          language={language}
          onClose={() => setStockMovementsModalOpen(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: INVOICE FORM MODAL (Rapid POS)
// =============================================================================
function InvoiceFormModal({ shopId, products, language, onClose, onSuccess }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isInterstate, setIsInterstate] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash'); // cash, upi, khata, split
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [discountInput, setDiscountInput] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Items: array of { productId, name, quantity, unitPrice, gstRate, unit, currentStock }
  const [items, setItems] = useState([
    { productId: '', name: '', quantity: 1, unitPrice: 0, gstRate: 5, unit: 'pcs', currentStock: 0 }
  ]);

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { productId: '', name: '', quantity: 1, unitPrice: 0, gstRate: 5, unit: 'pcs', currentStock: 0 }
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx, prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = {
        productId: prod.id,
        name: prod.name,
        quantity: copy[idx].quantity || 1,
        unitPrice: Number(prod.selling_price || 0),
        gstRate: Number(prod.gst_rate || 5),
        unit: prod.unit || 'pcs',
        currentStock: prod.current_stock || 0
      };
      return copy;
    });
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    for (const it of items) {
      const lineGross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const rate = Number(it.gstRate) || 0;
      const taxable = rate > 0 ? (lineGross / (1 + rate / 100)) : lineGross;
      const tax = lineGross - taxable;
      subtotal += taxable;
      totalTax += tax;
    }

    const discount = Math.max(0, Number(discountInput) || 0);
    const grandTotal = Math.max(0, Math.round(subtotal + totalTax - discount));

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      discount,
      grandTotal
    };
  }, [items, discountInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validItems = items.filter(it => it.name && it.quantity > 0 && it.unitPrice > 0);
    if (validItems.length === 0) {
      setFormError(language === 'hi' ? 'कम से कम एक सामान जोड़ें' : 'Please add at least one valid item');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shopId,
        customerName: customerName.trim() || 'Walk-in Customer (नकदी)',
        customerPhone: customerPhone.trim() || undefined,
        paymentMode,
        paidAmount: paymentMode === 'split' ? Number(paidAmountInput) : undefined,
        discount: Number(discountInput) || 0,
        isInterstate,
        notes: notes.trim(),
        items: validItems.map(it => ({
          productId: it.productId || undefined,
          name: it.name,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          gstRate: Number(it.gstRate)
        }))
      };

      const res = await api.createInvoice(payload);
      if (res?.success && res.invoice) {
        onSuccess(res.invoice);
      } else {
        throw new Error(res?.error || 'Failed to create invoice');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#1B2A4A]">
                {language === 'hi' ? 'त्वरित बिलिंग काउंटर (Rapid POS)' : 'Rapid Billing Counter (POS)'}
              </h3>
              <p className="text-xs text-stone-500">
                {language === 'hi' ? 'सामान चुनें, जीएसटी अपने आप जुड़ेगा और स्टॉक घटेगा' : 'Select items, auto calculate GST & sync stock'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Customer & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'ग्राहक का नाम' : 'Customer Name'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={language === 'hi' ? 'नकदी ग्राहक अथवा नाम' : 'Walk-in or Customer Name'}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'मोबाइल नंबर (व्हाट्सएप रसीद हेतु)' : 'Mobile Number'}
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30 font-mono"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                {language === 'hi' ? 'बिल सामग्री (Items)' : 'Bill Items'}
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? '+ लाइन जोड़ें' : '+ Add Line'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Select from catalog */}
                    <div className="sm:col-span-6">
                      <select
                        value={it.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none"
                      >
                        <option value="">{language === 'hi' ? '-- कैटलॉग से सामान चुनें --' : '-- Choose from catalog --'}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (स्टॉक: {p.current_stock} {p.unit} • ₹{p.selling_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-semibold text-center"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        placeholder="Price"
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-right"
                      />
                    </div>

                    {/* GST Rate */}
                    <div className="sm:col-span-1">
                      <select
                        value={it.gstRate}
                        onChange={(e) => handleItemChange(idx, 'gstRate', e.target.value)}
                        className="w-full px-1.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-center font-mono"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    {/* Remove button */}
                    <div className="sm:col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Tax Setting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'भुगतान प्रकार (Payment Mode)' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'cash', label: language === 'hi' ? 'नकद' : 'Cash' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'khata', label: language === 'hi' ? 'उधार' : 'Khata' }
                ].map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMode(pm.id)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      paymentMode === pm.id
                        ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'छूट (Discount ₹)' : 'Discount (₹)'}
              </label>
              <input
                type="number"
                min="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Interstate GST checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600">
            <input
              type="checkbox"
              checked={isInterstate}
              onChange={(e) => setIsInterstate(e.target.checked)}
              className="rounded text-amber-800 focus:ring-amber-600/30"
            />
            <span>{language === 'hi' ? 'अंतर-राज्यीय बिक्री (Inter-state / IGST)' : 'Inter-state Sale (IGST)'}</span>
          </label>

          {/* Grand Total Summary Callout */}
          <div className="p-3.5 bg-stone-100 rounded-xl border border-stone-200 flex items-center justify-between">
            <div className="text-xs text-stone-600 space-y-0.5">
              <div>{language === 'hi' ? 'कर योग्य मूल्य:' : 'Taxable:'} ₹{calculatedTotals.subtotal}</div>
              <div>{language === 'hi' ? 'जीएसटी कर:' : 'GST Tax:'} ₹{calculatedTotals.totalTax}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-stone-500 block">{language === 'hi' ? 'कुल देय राशि' : 'Grand Total'}</span>
              <span className="text-2xl font-bold text-[#1B2A4A] font-mono">
                ₹{calculatedTotals.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{submitting ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...') : (language === 'hi' ? 'बिल बनाएं व रसीद प्रिंट करें' : 'Generate & Print')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: RECORD PURCHASE MODAL
// =============================================================================
function PurchaseFormModal({ shopId, products, suppliers, language, onClose, onSuccess }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || 'Balrampur Galla Mandi');
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [items, setItems] = useState([
    { productId: products[0]?.id || '', name: products[0]?.name || '', quantity: 10, unitPrice: products[0]?.purchase_price || 100, gstRate: 5 }
  ]);

  const handleSelectProduct = (idx, prodId) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = {
        productId: p.id,
        name: p.name,
        quantity: copy[idx].quantity || 10,
        unitPrice: Number(p.purchase_price || 0),
        gstRate: Number(p.gst_rate || 5)
      };
      return copy;
    });
  };

  const handleSupplierChange = (suppId) => {
    setSupplierId(suppId);
    const s = suppliers.find(sup => sup.id === suppId);
    if (s) setSupplierName(s.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const valid = items.filter(it => it.quantity > 0 && it.unitPrice > 0);
    if (valid.length === 0) {
      setFormError(language === 'hi' ? 'कृपया सामान जोड़ें' : 'Please add items');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shopId,
        supplierId,
        supplierName,
        paymentMode,
        items: valid.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          gstRate: Number(it.gstRate)
        }))
      };

      const res = await api.createPurchase(payload);
      if (res?.success) {
        onSuccess(res.purchase);
      } else {
        throw new Error(res?.error || 'Failed to record purchase');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-base text-[#1B2A4A]">
              {language === 'hi' ? 'थोक खरीद दर्ज करें (Stock Inward)' : 'Record Stock Purchase'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'सप्लायर / थोक व्यापारी' : 'Wholesale Supplier'}
            </label>
            <select
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.address || 'Mandi'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'सामान चुनें (Product)' : 'Select Product'}
            </label>
            <select
              value={items[0]?.productId}
              onChange={(e) => handleSelectProduct(0, e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (वर्तमान स्टॉक: {p.current_stock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'खरीद मात्रा (Qty)' : 'Purchase Quantity'}
              </label>
              <input
                type="number"
                min="1"
                value={items[0]?.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setItems(prev => [{ ...prev[0], quantity: val }]);
                }}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'थोक भाव प्रति इकाई (₹)' : 'Unit Price (₹)'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={items[0]?.unitPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setItems(prev => [{ ...prev[0], unitPrice: val }]);
                }}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:opacity-50"
            >
              {submitting ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...') : (language === 'hi' ? 'स्टॉक जोड़ें' : 'Save & Add Stock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: PRODUCT FORM MODAL (Add Product)
// =============================================================================
function ProductFormModal({ shopId, language, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [hsnCode, setHsnCode] = useState('1905');
  const [category, setCategory] = useState('Staples');
  const [unit, setUnit] = useState('pkt');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [gstRate, setGstRate] = useState(5);
  const [currentStock, setCurrentStock] = useState(20);
  const [reorderLevel, setReorderLevel] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(language === 'hi' ? 'उत्पाद का नाम आवश्यक है' : 'Product name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shopId,
        name: name.trim(),
        sku: sku.trim() || undefined,
        hsnCode: hsnCode.trim() || '1905',
        category,
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        gstRate: Number(gstRate),
        currentStock: Number(currentStock) || 0,
        reorderLevel: Number(reorderLevel) || 5
      };

      const res = await api.createProduct(payload);
      if (res?.success) {
        onSuccess(res.product);
      } else {
        throw new Error(res?.error || 'Failed to create product');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-base text-[#1B2A4A]">
              {language === 'hi' ? 'नया उत्पाद जोड़ें' : 'Add New Product'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'सामान का नाम' : 'Product Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fortune Mustard Oil 1L"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'श्रेणी (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              >
                <option value="Staples">Staples (राशन / आटा)</option>
                <option value="Edible Oils">Edible Oils (तेल / घी)</option>
                <option value="Pulses">Pulses (दालें)</option>
                <option value="Spices">Spices (मसाले)</option>
                <option value="Snacks">Snacks (बिस्कुट / नमकीन)</option>
                <option value="Personal Care">Personal Care (साबुन / मंजन)</option>
                <option value="Dairy">Dairy (दूध / छाछ)</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'इकाई (Unit)' : 'Unit'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              >
                <option value="kg">kg (किलो)</option>
                <option value="L">L (लीटर)</option>
                <option value="pkt">pkt (पैकेट)</option>
                <option value="pcs">pcs (नग)</option>
                <option value="bag">bag (बोरी)</option>
                <option value="box">box (डिब्बा)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'खरीद मूल्य (₹)' : 'Cost Price'}
              </label>
              <input
                type="number"
                step="any"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'बिक्री मूल्य (₹)' : 'Selling Price'}
              </label>
              <input
                type="number"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'जीएसटी %' : 'GST %'}
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'प्रारंभिक स्टॉक' : 'Initial Stock'}
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {language === 'hi' ? 'रीऑर्डर चेतावनी स्तर' : 'Reorder Alert Level'}
              </label>
              <input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:opacity-50"
            >
              {submitting ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...') : (language === 'hi' ? 'उत्पाद जोड़ें' : 'Save Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: ADJUST STOCK MODAL
// =============================================================================
function AdjustStockModal({ shopId, product, language, onClose, onSuccess }) {
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [reason, setReason] = useState('Stock Count Audit (भौतिक सत्यापन)');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(adjustmentQuantity);
    if (!qty || isNaN(qty)) {
      setFormError(language === 'hi' ? 'कृपया वैध संख्या भरें' : 'Please enter valid quantity (+ or -)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.adjustStock({
        shopId,
        productId: product.id,
        quantity: qty,
        type: qty > 0 ? 'adjustment_in' : 'adjustment_out',
        notes: reason
      });

      if (res?.success) {
        onSuccess();
      } else {
        throw new Error(res?.error || 'Failed to adjust stock');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 className="font-bold text-base text-[#1B2A4A]">
            {language === 'hi' ? 'स्टॉक सुधार (Adjust Stock)' : 'Adjust Stock Level'}
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1">
          <div className="font-bold text-stone-800">{product.name}</div>
          <div className="text-stone-500">
            {language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current Stock:'} <span className="font-bold text-[#1B2A4A]">{product.current_stock} {product.unit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'जोड़ें (+) अथवा घटाएं (-)' : 'Adjustment (+ or - quantity)'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(e.target.value)}
              placeholder="e.g. +5 or -2"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'कारण (Reason)' : 'Reason'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
            >
              <option value="Stock Count Audit (भौतिक सत्यापन)">Physical Audit (भौतिक सत्यापन)</option>
              <option value="Damaged / Spoilage (खराब माल)">Damaged / Spoilage (खराब माल)</option>
              <option value="Expired Stock (तारीख समाप्त)">Expired Stock (तारीख समाप्त)</option>
              <option value="Personal / Home Use (घरेलू उपयोग)">Personal / Home Use (घरेलू उपयोग)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {submitting ? '...' : (language === 'hi' ? 'लागू करें' : 'Save Adjustment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: SUPPLIER FORM MODAL
// =============================================================================
function SupplierFormModal({ shopId, language, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.createSupplier({
        shopId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        gstin: gstin.trim() || undefined,
        address: address.trim() || undefined,
        state: 'Uttar Pradesh'
      });

      if (res?.success) {
        onSuccess(res.supplier);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-3.5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 className="font-bold text-base text-[#1B2A4A]">
            {language === 'hi' ? 'नया सप्लायर जोड़ें' : 'Add Wholesale Supplier'}
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'सप्लायर / फर्म का नाम' : 'Supplier Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Balrampur Mandi Traders"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'फोन नंबर' : 'Phone'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit phone"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'जीएसटी नंबर (GSTIN)' : 'GSTIN'}
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="09AABCU9603R1ZM"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'मंडी / पता' : 'Address / Mandi'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Galla Mandi, Balrampur"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#1B2A4A] text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {submitting ? '...' : (language === 'hi' ? 'सप्लायर जोड़ें' : 'Save Supplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: PAYMENT FORM MODAL (Collect Udhaar)
// =============================================================================
function PaymentFormModal({ shopId, receivables, language, onClose, onSuccess }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(receivables?.customers?.[0]?.customerId || '');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedCust = receivables?.customers?.find(c => c.customerId === selectedCustomerId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    setSubmitting(true);
    try {
      const res = await api.recordPayment({
        shopId,
        partyType: 'customer',
        partyId: selectedCustomerId,
        partyName: selectedCust?.name || 'Customer',
        amount: amt,
        paymentMode,
        notes: notes.trim()
      });

      if (res?.success) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-3.5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 className="font-bold text-base text-[#1B2A4A]">
            {language === 'hi' ? 'उधार वसूली जमा करें' : 'Record Udhaar Payment'}
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'ग्राहक चुनें' : 'Select Customer'}
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium"
            >
              {receivables?.customers?.map(c => (
                <option key={c.customerId} value={c.customerId}>
                  {c.name} (बकाया: ₹{c.totalDue})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'जमा राशि (₹)' : 'Collection Amount (₹)'}
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={selectedCust ? String(selectedCust.totalDue) : 'Amount'}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-base font-mono font-bold text-center text-emerald-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {language === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  paymentMode === 'cash' ? 'bg-amber-800 text-white border-amber-800' : 'bg-stone-50 border-stone-200'
                }`}
              >
                {language === 'hi' ? 'नकद (Cash)' : 'Cash'}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  paymentMode === 'upi' ? 'bg-amber-800 text-white border-amber-800' : 'bg-stone-50 border-stone-200'
                }`}
              >
                UPI QR
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {submitting ? '...' : (language === 'hi' ? 'जमा दर्ज करें' : 'Record Collection')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: THERMAL RECEIPT / PRINT MODAL
// =============================================================================
function ThermalReceiptModal({ shop, invoice, language, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const isInterstate = Boolean(invoice.is_interstate);
  const taxSum = Number((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 text-stone-900">
        {/* Receipt Header */}
        <div className="text-center border-b border-dashed border-stone-300 pb-3">
          <div className="text-lg font-black tracking-tight uppercase text-[#1B2A4A]">
            {shop?.name || "Ramesh's Kirana Store"}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {shop?.village || 'Utraula Dehat'}, {shop?.district || 'Balrampur'}, {shop?.state || 'UP'}
          </div>
          <div className="text-xs text-stone-500 font-mono">
            📞 {shop?.phone || '+91 98391 24789'}
          </div>
          <div className="text-[11px] font-bold text-amber-800 uppercase mt-1 tracking-wider">
            {language === 'hi' ? 'पक्का बिल / टैक्स इनवॉइस' : 'TAX INVOICE'}
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="text-xs space-y-1 border-b border-dashed border-stone-300 pb-3 font-mono">
          <div className="flex justify-between">
            <span className="text-stone-500">Invoice:</span>
            <span className="font-bold">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Date:</span>
            <span>{invoice.invoice_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Customer:</span>
            <span className="font-bold">{invoice.customer_name || 'Walk-in Cash'}</span>
          </div>
          {invoice.customer_phone && (
            <div className="flex justify-between">
              <span className="text-stone-500">Phone:</span>
              <span>{invoice.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="space-y-2 border-b border-dashed border-stone-300 pb-3 text-xs">
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start font-mono">
                <div>
                  <div className="font-bold text-stone-800">{item.description || item.name}</div>
                  <div className="text-[10px] text-stone-500">
                    {item.quantity} x ₹{item.unit_price} (GST {item.gst_rate}%)
                  </div>
                </div>
                <div className="font-bold text-[#1B2A4A]">
                  ₹{Number(item.total).toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-stone-400 py-1 text-xs">
              General Invoiced Items
            </div>
          )}
        </div>

        {/* Totals Breakdown */}
        <div className="space-y-1 text-xs font-mono border-b border-dashed border-stone-300 pb-3">
          <div className="flex justify-between text-stone-600">
            <span>Taxable Subtotal:</span>
            <span>₹{Number(invoice.taxable_amount || invoice.subtotal).toFixed(2)}</span>
          </div>
          {!isInterstate ? (
            <>
              <div className="flex justify-between text-stone-600">
                <span>CGST:</span>
                <span>₹{Number(invoice.cgst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>SGST:</span>
                <span>₹{Number(invoice.sgst || 0).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-stone-600">
              <span>IGST:</span>
              <span>₹{Number(invoice.igst || 0).toFixed(2)}</span>
            </div>
          )}
          {Number(invoice.discount || 0) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount:</span>
              <span>-₹{Number(invoice.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-[#1B2A4A] pt-1">
            <span>TOTAL:</span>
            <span>₹{Number(invoice.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-600 pt-1 text-[11px]">
            <span>Paid ({invoice.payment_mode}):</span>
            <span>₹{Number(invoice.paid_amount || 0).toFixed(2)}</span>
          </div>
          {Number(invoice.balance_due || 0) > 0 && (
            <div className="flex justify-between text-rose-600 font-bold text-[11px]">
              <span>Balance Due (Khata):</span>
              <span>₹{Number(invoice.balance_due).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-stone-500">
          <div>{language === 'hi' ? 'धन्यवाद! फिर पधारें।' : 'Thank you for shopping with us!'}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Powered by SaakhSetu Vyapaar Accounting
          </div>
        </div>

        {/* Print / Close Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'प्रिंट करें' : 'Print'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: STOCK AUDIT TRAIL MODAL
// =============================================================================
function StockAuditTrailModal({ movements, language, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-base text-[#1B2A4A]">
              {language === 'hi' ? 'स्टॉक ऑडिट ट्रेल (Stock Movements)' : 'Stock Audit Trail'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-stone-100 text-xs">
          {movements.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              {language === 'hi' ? 'कोई स्टॉक हलचल दर्ज नहीं है' : 'No stock movements logged yet'}
            </div>
          ) : (
            movements.map(m => (
              <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-stone-800">{m.product_name || m.product_id}</div>
                  <div className="text-stone-400 text-[11px]">
                    {m.created_at} • {m.notes || m.reference_type}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    m.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
