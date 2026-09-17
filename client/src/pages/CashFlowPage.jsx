import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  ArrowDownRight, 
  ArrowUpRight, 
  IndianRupee, 
  FileText, 
  BarChart3, 
  Plus, 
  Search, 
  Calendar, 
  Filter, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Trash2, 
  Lightbulb, 
  Sprout, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  Share2, 
  Printer, 
  Download, 
  Mic, 
  UserPlus
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { RegisterCustomerModal } from '../components/RegisterCustomerModal';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';
import { VoiceInputDialog } from '../components/VoiceInputDialog';
import { DEMO_TRANSACTIONS, DEMO_SUMMARY, DEMO_UDHAAR_LEDGER } from '../data/demoData';

export function CashFlowPage({ 
  shop, 
  isDemoMode,
  summaryData,
  onOpenKeypad, 
  onOpenWholesale, 
  refreshKey, 
  latestTx, 
  onTransactionSaved 
}) {
  const { t, language } = useTranslation();
  const isDemo = Boolean(isDemoMode || shop?.is_demo === 1 || shop?.id === 'ramesh-kirana');

  // Core transaction state
  const [transactions, setTransactions] = useState(() => (isDemo ? DEMO_TRANSACTIONS : []));
  const [udhaarLedger, setUdhaarLedger] = useState(() => (isDemo ? DEMO_UDHAAR_LEDGER : []));
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all'); // 'all', 'sales', 'purchases', 'expenses', 'udhaar'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all'); // 'all', 'today', 'week', 'month'

  // Modals & Drawers
  const [selectedTx, setSelectedTx] = useState(null); // Detail drawer
  const [isRegisterCustomerOpen, setIsRegisterCustomerOpen] = useState(false);
  const [selectedWhatsAppCustomer, setSelectedWhatsAppCustomer] = useState(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Custom event listeners for external navigation (from Overview Bento cards or Sidebar)
  useEffect(() => {
    const handleSwitch = (e) => {
      if (e.detail?.tab === 'udhaar') {
        setSelectedCategoryTab('udhaar');
        setTypeFilter('all');
        setCurrentPage(1);
      }
    };
    const handleFilter = (e) => {
      if (e.detail?.filter !== undefined) {
        const f = e.detail.filter;
        if (f === 'income') {
          setSelectedCategoryTab('sales');
          setTypeFilter('income');
        } else if (f === 'expense') {
          setSelectedCategoryTab('expenses');
          setTypeFilter('expense');
        } else {
          setSelectedCategoryTab('all');
          setTypeFilter('all');
        }
        setCurrentPage(1);
      }
    };
    window.addEventListener('saakhsetu:switch-tab', handleSwitch);
    window.addEventListener('saakhsetu:filter-tx', handleFilter);
    return () => {
      window.removeEventListener('saakhsetu:switch-tab', handleSwitch);
      window.removeEventListener('saakhsetu:filter-tx', handleFilter);
    };
  }, []);

  // Fetch real data on mount or shop/refresh change
  useEffect(() => {
    loadData();
  }, [shop?.id, isDemo, refreshKey]);

  // Optimistic update when a new transaction is logged
  useEffect(() => {
    if (!latestTx) return;
    setTransactions(prev => {
      if (prev.some(t => t.id === latestTx.id)) return prev;
      return [latestTx, ...prev];
    });
  }, [latestTx]);

  const loadData = async () => {
    const targetShopId = shop?.id || (isDemo ? 'ramesh-kirana' : null);
    if (!targetShopId) {
      if (!isDemo) {
        setLoading(false);
        setTransactions([]);
        setUdhaarLedger([]);
      }
      return;
    }

    if (transactions.length === 0) setLoading(true);

    try {
      const [txResult, udhResult] = await Promise.allSettled([
        api.getTransactions(targetShopId, '', 300),
        api.getUdhaarLedger(targetShopId)
      ]);

      if (txResult.status === 'fulfilled' && txResult.value?.transactions?.length > 0) {
        setTransactions(txResult.value.transactions);
      } else if (isDemo && transactions.length === 0) {
        setTransactions(DEMO_TRANSACTIONS);
      }

      if (udhResult.status === 'fulfilled' && udhResult.value?.customers?.length > 0) {
        setUdhaarLedger(udhResult.value.customers);
      } else if (isDemo && udhaarLedger.length === 0) {
        setUdhaarLedger(DEMO_UDHAAR_LEDGER);
      }
    } catch (err) {
      console.warn('Failed to load bahi-khata data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    const confirmMsg = language === 'hi'
      ? 'क्या आप इस लेन-देन को हटाना चाहते हैं?'
      : 'Are you sure you want to delete this transaction?';
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(txId);
    setTransactions(prev => prev.filter(t => t.id !== txId));
    if (selectedTx?.id === txId) setSelectedTx(null);

    try {
      await api.deleteTransaction(txId, shop?.id);
    } catch (err) {
      console.warn('Delete transaction error:', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Extract unique categories for the filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions computation
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Category Tab Filter
      if (selectedCategoryTab === 'sales') {
        if (tx.type !== 'income') return false;
      } else if (selectedCategoryTab === 'purchases') {
        if (tx.type !== 'expense') return false;
      } else if (selectedCategoryTab === 'expenses') {
        if (tx.type !== 'expense') return false;
      } else if (selectedCategoryTab === 'udhaar') {
        if (tx.type !== 'udhaar_given' && tx.type !== 'udhaar_repaid') return false;
      }

      // 2. Type Dropdown Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 3. Payment Mode Dropdown Filter
      if (paymentFilter !== 'all') {
        const mode = (tx.payment_mode || '').toLowerCase();
        if (paymentFilter === 'cash' && mode !== 'cash') return false;
        if (paymentFilter === 'upi' && mode !== 'upi') return false;
        if (paymentFilter === 'khata' && mode !== 'khata' && mode !== 'udhaar') return false;
      }

      // 4. Category Dropdown Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // 5. Date Preset Filter
      if (datePreset !== 'all') {
        const txDate = new Date(tx.date || Date.now());
        const now = new Date();
        if (datePreset === 'today') {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (datePreset === 'week') {
          const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (datePreset === 'month') {
          const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        }
      }

      // 6. Search Query (Particulars, Party, Amount, Category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const particulars = (tx.notes || '').toLowerCase();
        const party = (tx.customer_vendor_name || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        const amt = String(tx.amount || '');
        if (
          !particulars.includes(q) &&
          !party.includes(q) &&
          !cat.includes(q) &&
          !amt.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedCategoryTab, typeFilter, paymentFilter, categoryFilter, datePreset, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryTab, typeFilter, paymentFilter, categoryFilter, datePreset, searchQuery]);

  // Formatting helpers
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (_) {
      return dateStr;
    }
  };

  const formatParticulars = (tx) => {
    if (tx.notes && tx.notes.trim()) return tx.notes;
    if (tx.type === 'income') return 'Counter Sales';
    if (tx.type === 'expense') return 'Stock / Supplies';
    if (tx.type === 'udhaar_given') return 'Groceries on Khata';
    if (tx.type === 'udhaar_repaid') return 'Previous Balance Settlement';
    return tx.category || 'General';
  };

  const getPartyName = (tx) => {
    if (tx.customer_vendor_name && tx.customer_vendor_name.trim()) {
      return tx.customer_vendor_name;
    }
    if (tx.type === 'income') return 'Walk-in Customer';
    if (tx.type === 'expense') return 'Local Wholesale Distributor';
    return 'Village Customer';
  };

  const getTypeMeta = (tx) => {
    switch (tx.type) {
      case 'income':
        return {
          label: 'Sale',
          labelHi: 'बिक्री',
          icon: ShoppingCart,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
          sign: '+',
          amountColor: 'text-emerald-800'
        };
      case 'expense':
        return {
          label: 'Purchase / Expense',
          labelHi: 'खरीद / खर्च',
          icon: ArrowDownRight,
          color: 'text-stone-700 bg-stone-100 border-stone-200',
          sign: '-',
          amountColor: 'text-stone-900'
        };
      case 'udhaar_given':
        return {
          label: 'Udhaar Given',
          labelHi: 'उधार दिया',
          icon: IndianRupee,
          color: 'text-amber-700 bg-amber-50 border-amber-200/80',
          sign: '—',
          amountColor: 'text-amber-800'
        };
      case 'udhaar_repaid':
        return {
          label: 'Udhaar Received',
          labelHi: 'उधार मिला',
          icon: ArrowDownRight,
          color: 'text-sky-700 bg-sky-50 border-sky-200/80',
          sign: '+',
          amountColor: 'text-sky-800'
        };
      default:
        return {
          label: 'Record',
          labelHi: 'रिकॉर्ड',
          icon: FileText,
          color: 'text-stone-600 bg-stone-50 border-stone-200',
          sign: '',
          amountColor: 'text-stone-800'
        };
    }
  };

  const getPaymentBadge = (mode) => {
    const m = (mode || 'cash').toLowerCase();
    if (m === 'upi') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
          UPI
        </span>
      );
    }
    if (m === 'khata' || m === 'udhaar') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]">
          Udhaar
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
        Cash
      </span>
    );
  };

  // Export CSV helper
  const handleExportCSV = () => {
    try {
      const headers = ['Type', 'Particulars', 'Party', 'Amount', 'Date', 'Payment Mode', 'Category'];
      const rows = filteredTransactions.map(t => [
        t.type,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${(t.customer_vendor_name || '').replace(/"/g, '""')}"`,
        t.amount,
        t.date,
        t.payment_mode || 'cash',
        t.category || 'General'
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SaakhSetu_BahiKhata_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      
      {/* 1. BAHI-KHATA HERO SECTION (Exact Reference Style) */}
      <section className="w-full relative rounded-3xl bg-[#FAF7F2] border border-[#EFE9DF] p-6 sm:p-7 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Hero Typography */}
          <div className="lg:col-span-6 space-y-2 z-10">
            <h1 className="font-serif font-black text-3xl sm:text-4xl text-stone-900 tracking-tight leading-none">
              Bahi-Khata
            </h1>

            <p className="font-sans font-bold text-stone-800 text-sm sm:text-base leading-snug">
              {language === 'hi'
                ? 'हर लेन-देन, एक बेहतर कल की तरफ।'
                : 'Har len-den, ek behtar kal ki taraf.'
              }
            </p>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-md">
              {language === 'hi'
                ? 'अपने दैनिक लेन-देन दर्ज करें, उधार प्रबंधित करें, स्टॉक गतिविधि ट्रैक करें और अपने व्यापार को व्यवस्थित रखें।'
                : 'Record your daily transactions, manage udhaar, track inventory movement, and keep your business organised.'
              }
            </p>
          </div>

          {/* Right Visual: Shopkeeper writing in ledger + Handwritten quote */}
          <div className="lg:col-span-6 relative flex items-center justify-end overflow-hidden select-none pointer-events-none">
            <div className="relative w-full max-w-[530px] rounded-2xl overflow-hidden">
              <img 
                src="/images/bahi-khata-hero-full-2x.png" 
                alt="Chhote hisaab, badi tasveer banate hain" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 2. HORIZONTAL TRANSACTION CATEGORY SELECTOR */}
      <section className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {/* All Transactions */}
        <button
          type="button"
          onClick={() => { setSelectedCategoryTab('all'); setTypeFilter('all'); }}
          className={`flex-1 min-w-[145px] p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            selectedCategoryTab === 'all'
              ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
              : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText className={`w-4 h-4 ${selectedCategoryTab === 'all' ? 'text-white' : 'text-stone-500'}`} />
            <span className="font-serif font-bold text-xs">
              {language === 'hi' ? 'सभी लेन-देन' : 'All Transactions'}
            </span>
          </div>
          <p className={`text-[10px] ${selectedCategoryTab === 'all' ? 'text-emerald-200' : 'text-stone-500'}`}>
            View every record
          </p>
        </button>

        {/* Sales */}
        <button
          type="button"
          onClick={() => { setSelectedCategoryTab('sales'); setTypeFilter('income'); }}
          className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            selectedCategoryTab === 'sales'
              ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
              : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className={`w-4 h-4 ${selectedCategoryTab === 'sales' ? 'text-white' : 'text-emerald-700'}`} />
            <span className="font-serif font-bold text-xs">
              {language === 'hi' ? 'बिक्री' : 'Sales'}
            </span>
          </div>
          <p className={`text-[10px] ${selectedCategoryTab === 'sales' ? 'text-emerald-200' : 'text-stone-500'}`}>
            Money in
          </p>
        </button>

        {/* Purchases */}
        <button
          type="button"
          onClick={() => { setSelectedCategoryTab('purchases'); setTypeFilter('expense'); }}
          className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            selectedCategoryTab === 'purchases'
              ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
              : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className={`w-4 h-4 ${selectedCategoryTab === 'purchases' ? 'text-white' : 'text-indigo-600'}`} />
            <span className="font-serif font-bold text-xs">
              {language === 'hi' ? 'खरीद' : 'Purchases'}
            </span>
          </div>
          <p className={`text-[10px] ${selectedCategoryTab === 'purchases' ? 'text-emerald-200' : 'text-stone-500'}`}>
            Money out
          </p>
        </button>

        {/* Expenses */}
        <button
          type="button"
          onClick={() => { setSelectedCategoryTab('expenses'); setTypeFilter('expense'); }}
          className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            selectedCategoryTab === 'expenses'
              ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
              : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className={`w-4 h-4 ${selectedCategoryTab === 'expenses' ? 'text-white' : 'text-teal-600'}`} />
            <span className="font-serif font-bold text-xs">
              {language === 'hi' ? 'खर्च' : 'Expenses'}
            </span>
          </div>
          <p className={`text-[10px] ${selectedCategoryTab === 'expenses' ? 'text-emerald-200' : 'text-stone-500'}`}>
            Business costs
          </p>
        </button>

        {/* Udhaar */}
        <button
          type="button"
          onClick={() => { setSelectedCategoryTab('udhaar'); setTypeFilter('all'); }}
          className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            selectedCategoryTab === 'udhaar'
              ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
              : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className={`w-4 h-4 ${selectedCategoryTab === 'udhaar' ? 'text-white' : 'text-amber-600'}`} />
            <span className="font-serif font-bold text-xs">
              {language === 'hi' ? 'उधार' : 'Udhaar'}
            </span>
          </div>
          <p className={`text-[10px] ${selectedCategoryTab === 'udhaar' ? 'text-emerald-200' : 'text-stone-500'}`}>
            Given & received
          </p>
        </button>

        {/* More Actions Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMoreActionsOpen(!moreActionsOpen)}
            className="p-3.5 px-4 rounded-2xl border border-stone-200/80 bg-white/95 text-stone-700 hover:text-stone-950 hover:bg-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <span>More Actions</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${moreActionsOpen ? 'rotate-90' : ''}`} />
          </button>

          {moreActionsOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-2xl p-1.5 shadow-xl z-30 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => { setIsRegisterCustomerOpen(true); setMoreActionsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-950 text-left transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Add Customer Account</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsVoiceOpen(true); setMoreActionsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-950 text-left transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4 text-amber-600" />
                <span>Voice Khata Entry</span>
              </button>
              <button
                type="button"
                onClick={() => { handleExportCSV(); setMoreActionsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-950 text-left transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-500" />
                <span>Export CSV Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => { window.print(); setMoreActionsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-stone-950 text-left transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-500" />
                <span>Print Ledger</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <section className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/90 border border-stone-200/80 p-2.5 sm:p-3 rounded-2xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions (e.g. Amul, Ramu, ₹500...)"
            className="w-full pl-9.5 pr-4 py-2 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="appearance-none bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-stone-700 hover:border-stone-300 focus:outline-none focus:border-[#0F3E2E] cursor-pointer"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          {/* Type Dropdown Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-stone-700 hover:border-stone-300 focus:outline-none focus:border-[#0F3E2E] cursor-pointer"
            >
              <option value="all">Type: All</option>
              <option value="income">Sale (Income)</option>
              <option value="expense">Purchase / Expense</option>
              <option value="udhaar_given">Udhaar Given</option>
              <option value="udhaar_repaid">Udhaar Repaid</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="appearance-none bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-stone-700 hover:border-stone-300 focus:outline-none focus:border-[#0F3E2E] cursor-pointer"
            >
              <option value="all">Payment Mode: All</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="khata">Udhaar / Khata</option>
            </select>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div className="relative hidden xl:block">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-stone-700 hover:border-stone-300 focus:outline-none focus:border-[#0F3E2E] cursor-pointer"
              >
                <option value="all">Category: All</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Primary CTA: + Record Transaction */}
          <button
            type="button"
            onClick={onOpenKeypad}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </section>

      {/* 4. MAIN CONTENT AREA: TABLE (LEFT 8 COLS) + SIDEBAR ACTIONS (RIGHT 4 COLS) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 8/9 COLS: MAIN TRANSACTION TABLE */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="rounded-2xl bg-white border border-stone-200/90 overflow-hidden shadow-2xs">
            
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-stone-200/80 bg-[#FAF8F5]/60 text-stone-500 font-serif">
                    <th className="py-3 px-3.5 sm:px-4 font-bold">Type</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Particulars</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Party / Customer</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-2 sm:px-3 font-bold text-center">Payment Mode</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Category</th>
                    <th className="py-3 px-3 sm:px-4 font-bold text-right">Amount</th>
                    <th className="py-3 px-2 font-bold text-center">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-stone-100">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx) => {
                      const meta = getTypeMeta(tx);
                      const Icon = meta.icon;

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="hover:bg-[#FAF8F5] transition-colors cursor-pointer group"
                        >
                          {/* Type with Context Icon */}
                          <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${meta.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-serif font-bold text-stone-900 group-hover:text-[#0F3E2E] transition-colors">
                                {meta.label}
                              </span>
                            </div>
                          </td>

                          {/* Particulars / Item Description */}
                          <td className="py-3 px-3 sm:px-4 font-medium text-stone-800 max-w-[160px] truncate">
                            {formatParticulars(tx)}
                          </td>

                          {/* Party / Customer */}
                          <td className="py-3 px-3 sm:px-4 text-stone-600 max-w-[140px] truncate">
                            {getPartyName(tx)}
                          </td>

                          {/* Date & Time */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                            {formatDateTime(tx.date)}
                          </td>

                          {/* Payment Mode Badge */}
                          <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                            {getPaymentBadge(tx.payment_mode)}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 sm:px-4 text-stone-600 whitespace-nowrap">
                            {tx.category || 'General'}
                          </td>

                          {/* Amount */}
                          <td className={`py-3 px-3 sm:px-4 text-right font-bold tabular-nums whitespace-nowrap ${meta.amountColor}`}>
                            {meta.sign} ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedTx(tx)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              title="View details"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="w-8 h-8 text-stone-300" />
                          <div className="font-serif font-bold text-sm text-stone-800">
                            {language === 'hi' ? 'कोई लेन-देन नहीं मिला' : 'No transactions found'}
                          </div>
                          <p className="text-xs text-stone-400 max-w-xs">
                            {searchQuery || typeFilter !== 'all' || paymentFilter !== 'all'
                              ? 'Try adjusting your search query or reset the filters above.'
                              : 'Log your first sale or expense using the "+ Record Transaction" button.'
                            }
                          </p>
                          {(searchQuery || typeFilter !== 'all' || paymentFilter !== 'all' || categoryFilter !== 'all') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                setTypeFilter('all');
                                setPaymentFilter('all');
                                setCategoryFilter('all');
                                setDatePreset('all');
                                setSelectedCategoryTab('all');
                              }}
                              className="mt-2 text-xs text-[#0F3E2E] font-bold underline"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 sm:p-3.5 border-t border-stone-200/80 bg-[#FAF8F5]/50 flex items-center justify-between flex-wrap gap-2 text-xs text-stone-600">
              <span className="font-medium text-stone-500">
                Showing{' '}
                <strong className="text-stone-900 font-bold">
                  {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </strong>
                –
                <strong className="text-stone-900 font-bold">
                  {Math.min(currentPage * pageSize, filteredTransactions.length)}
                </strong>{' '}
                of <strong className="text-stone-900 font-bold">{filteredTransactions.length}</strong> transactions
              </span>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-all cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }

                  const isActive = currentPage === pageNum;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0F3E2E] text-white'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-1 text-stone-400">...</span>
                )}

                {totalPages > 5 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === totalPages
                        ? 'bg-[#0F3E2E] text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:hover:bg-white text-stone-700 transition-all cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT 4/3 COLS: QUICK ACTIONS & HELP CARDS */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          
          {/* Quick Actions Panel */}
          <div className="rounded-2xl bg-white border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-sm text-stone-900 pb-1 border-b border-stone-100">
              Quick Actions
            </h3>

            <div className="space-y-1.5">
              {/* Record Sale */}
              <button
                type="button"
                onClick={onOpenKeypad}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-stone-200 text-xs font-medium text-stone-800 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <span>Record Sale</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Record Purchase */}
              <button
                type="button"
                onClick={onOpenKeypad}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-stone-200 text-xs font-medium text-stone-800 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>Record Purchase</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Add Expense */}
              <button
                type="button"
                onClick={onOpenKeypad}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-stone-200 text-xs font-medium text-stone-800 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <span>Add Expense</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Manage Udhaar */}
              <button
                type="button"
                onClick={() => { setSelectedCategoryTab('udhaar'); setTypeFilter('all'); }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-stone-200 text-xs font-medium text-stone-800 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <span>Manage Udhaar</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Need Help? Card */}
          <div className="rounded-2xl bg-white border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-serif font-bold text-xs text-stone-900">Need Help?</h4>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Learn how to manage your Bahi-Khata efficiently.
            </p>
            <button
              type="button"
              onClick={() => {
                alert("Watch Guide: Record daily entries via voice or keypad. Regular logging directly enhances your RBI Priority Sector Lending alternative credit score!");
              }}
              className="mt-1 text-xs font-bold text-[#0F3E2E] hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Watch Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Khata Saaf, Mann Saaf Card */}
          <div className="rounded-2xl bg-[#EEF5F0] border border-[#D5E7DB] p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F3E2E] text-white flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs text-[#0F3E2E] leading-tight">
                Khata saaf, mann saaf.
              </h4>
              <p className="text-[10px] text-emerald-800/80 mt-0.5 font-medium">
                Digital hisaab, behtar kal.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* 5. LOWER INFORMATION BANNER (Keep Your Records Updated) */}
      <section className="w-full relative rounded-3xl bg-[#FAF7F2] border border-[#EFE9DF] p-6 sm:p-7 overflow-hidden shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
              Keep Your Records Updated
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
              A well-maintained Bahi-Khata helps you build credit, access government schemes, and grow your business.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('saakhsetu:switch-tab', { detail: { tab: 'schemes' } }));
            // Also trigger navigation via location or App state
            const btn = document.querySelector('button[title*="Schemes"], button[title*="योजनाएं"]');
            if (btn) btn.click();
          }}
          className="px-5 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap z-10 shrink-0"
        >
          Explore Schemes →
        </button>

        {/* Decorative Rural Trees Illustration Backdrop */}
        <div className="absolute right-0 bottom-0 top-0 opacity-15 pointer-events-none overflow-hidden select-none">
          <img 
            src="/images/rural-landscape.png" 
            alt="Rural Backdrop" 
            className="h-full w-auto object-cover object-right"
          />
        </div>
      </section>

      {/* 6. CLEAN FOOTER */}
      <footer className="pt-3 pb-8 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap">
          <span className="font-bold text-stone-800">© 2026 SaakhSetu</span>
          <span className="text-stone-300">•</span>
          <span>Bridging Businesses to Credit</span>
          <span className="text-stone-300">•</span>
          <span className="font-semibold text-emerald-800">Built for Bharat</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-stone-600">
          <a href="#privacy" className="hover:text-stone-900 transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-stone-900 transition-colors">Terms</a>
          <a href="#contact" className="hover:text-stone-900 transition-colors">Contact</a>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-2 text-stone-500 font-bold">
            <span>in</span>
            <span>𝕏</span>
            <span>▶</span>
          </div>
        </div>
      </footer>

      {/* TRANSACTION DETAILS MODAL / SIDE DRAWER */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${getTypeMeta(selectedTx).color}`}>
                  {React.createElement(getTypeMeta(selectedTx).icon, { className: 'w-4 h-4' })}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                    Transaction Details
                  </span>
                  <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                    {getTypeMeta(selectedTx).label}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-center space-y-0.5">
              <span className="text-[10px] text-stone-500 font-medium">Transaction Amount</span>
              <div className={`text-2xl sm:text-3xl font-serif font-black ${getTypeMeta(selectedTx).amountColor}`}>
                ₹{Number(selectedTx.amount || 0).toLocaleString('en-IN')}
              </div>
              <div className="pt-1">
                {getPaymentBadge(selectedTx.payment_mode)}
              </div>
            </div>

            {/* Details Fields */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Particulars:</span>
                <span className="font-bold text-stone-900 text-right">{formatParticulars(selectedTx)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Party / Customer:</span>
                <span className="font-bold text-stone-900 text-right">{getPartyName(selectedTx)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Date & Time:</span>
                <span className="font-mono text-stone-800 text-right">{formatDateTime(selectedTx.date)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Category:</span>
                <span className="font-semibold text-stone-800 text-right">{selectedTx.category || 'General'}</span>
              </div>
              {selectedTx.customer_phone && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Phone:</span>
                  <span className="font-mono text-stone-800 text-right">{selectedTx.customer_phone}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={deletingId === selectedTx.id}
                onClick={() => handleDeleteTransaction(selectedTx.id)}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId === selectedTx.id ? 'Deleting...' : 'Delete'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Customer Registration Modal */}
      <RegisterCustomerModal
        isOpen={isRegisterCustomerOpen}
        onClose={() => setIsRegisterCustomerOpen(false)}
        shopId={shop?.id}
        onCustomerRegistered={(newCust) => {
          setUdhaarLedger(prev => [newCust, ...prev]);
        }}
      />

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={Boolean(selectedWhatsAppCustomer)}
        onClose={() => setSelectedWhatsAppCustomer(null)}
        customer={selectedWhatsAppCustomer}
        shop={shop}
        onReminderSent={() => {
          setSelectedWhatsAppCustomer(null);
        }}
      />

      {/* Voice Bahi-Khata Dialog */}
      <VoiceInputDialog
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        shopId={shop?.id}
        onTransactionSaved={(newTx) => {
          onTransactionSaved?.(newTx);
          setTransactions(prev => [newTx, ...prev]);
        }}
      />

    </div>
  );
}
