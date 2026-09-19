import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  ChevronDown,
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
  UserPlus,
  Users,
  Phone,
  MapPin,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { RegisterCustomerModal } from '../components/RegisterCustomerModal';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';
import { VoiceInputDialog } from '../components/VoiceInputDialog';
import { DEMO_TRANSACTIONS, DEMO_SUMMARY, DEMO_UDHAAR_LEDGER } from '../data/demoData';
import { getCustomerDetails, cleanIndianPhone, maskIndianPhone } from '../utils/customerMatcher';
import { TricolorBrush } from '../components/TricolorBrush';

export function CashFlowPage({ 
  shop, 
  isDemoMode,
  summaryData,
  onOpenKeypad, 
  onOpenWholesale,
  onNavigateTab,
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

  // Read one-time initial navigation target from sessionStorage (e.g. from Mega-Menu)
  const initialCategoryTab = (() => {
    try {
      const stored = sessionStorage.getItem('saakhsetu_cashflow_tab');
      if (stored) {
        sessionStorage.removeItem('saakhsetu_cashflow_tab');
        return stored;
      }
    } catch (_) {}
    return 'all';
  })();

  // Search & Filter State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState(initialCategoryTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(
    initialCategoryTab === 'sales' ? 'income' : 
    (initialCategoryTab === 'purchases' || initialCategoryTab === 'expenses') ? 'expense' : 'all'
  );
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all'); // 'all', 'today', 'week', 'month'

  // Customer Ledger State & Drawers
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [customerTxFilter, setCustomerTxFilter] = useState('all');
  const [customerTxSearch, setCustomerTxSearch] = useState('');

  // Modals & Drawers
  const [selectedTx, setSelectedTx] = useState(null); // Detail drawer
  const [isRegisterCustomerOpen, setIsRegisterCustomerOpen] = useState(false);
  const [selectedWhatsAppCustomer, setSelectedWhatsAppCustomer] = useState(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const moreActionsContainerRef = useRef(null);

  // Close More Actions dropdown on outside click, Escape key, or category switch
  useEffect(() => {
    if (!moreActionsOpen) return;

    const handleClickOutside = (e) => {
      if (moreActionsContainerRef.current && !moreActionsContainerRef.current.contains(e.target)) {
        setMoreActionsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMoreActionsOpen(false);
      }
    };

    // Attach click listener on next tick so the opening click does not immediately trigger it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreActionsOpen]);

  // Close dropdown on category or tab switch
  useEffect(() => {
    setMoreActionsOpen(false);
  }, [selectedCategoryTab]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Custom event listeners for external navigation (from Overview Bento cards or Sidebar)
  useEffect(() => {
    const handleSwitch = (e) => {
      const target = e.detail?.tab || 'all';
      try { sessionStorage.setItem('saakhsetu_cashflow_tab', target); } catch (_) {}
      if (target === 'sales') {
        setSelectedCategoryTab('sales');
        setTypeFilter('income');
      } else if (target === 'purchases') {
        setSelectedCategoryTab('purchases');
        setTypeFilter('expense');
      } else if (target === 'expenses') {
        setSelectedCategoryTab('expenses');
        setTypeFilter('expense');
      } else if (target === 'udhaar') {
        setSelectedCategoryTab('udhaar');
        setTypeFilter('all');
      } else if (target === 'customers') {
        setSelectedCategoryTab('customers');
      } else {
        setSelectedCategoryTab('all');
        setTypeFilter('all');
      }
      setCurrentPage(1);
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
        setCustomerList([]);
      }
      return;
    }

    if (transactions.length === 0) setLoading(true);

    try {
      const [txResult, udhResult, custListResult] = await Promise.allSettled([
        api.getTransactions(targetShopId, '', 300),
        api.getUdhaarLedger(targetShopId),
        api.getCustomers(targetShopId)
      ]);

      if (txResult.status === 'fulfilled') {
        if (txResult.value?.transactions?.length > 0) {
          setTransactions(txResult.value.transactions);
        } else if (isDemo) {
          setTransactions(DEMO_TRANSACTIONS);
        } else {
          setTransactions([]);
        }
      } else if (isDemo && transactions.length === 0) {
        setTransactions(DEMO_TRANSACTIONS);
      } else if (!isDemo) {
        setTransactions([]);
      }

      if (udhResult.status === 'fulfilled') {
        if (udhResult.value?.customers?.length > 0) {
          setUdhaarLedger(udhResult.value.customers);
        } else if (isDemo) {
          setUdhaarLedger(DEMO_UDHAAR_LEDGER);
        } else {
          setUdhaarLedger([]);
        }
      } else if (isDemo && udhaarLedger.length === 0) {
        setUdhaarLedger(DEMO_UDHAAR_LEDGER);
      } else if (!isDemo) {
        setUdhaarLedger([]);
      }

      if (custListResult.status === 'fulfilled') {
        setCustomerList(custListResult.value?.customers || []);
      } else if (!isDemo) {
        setCustomerList([]);
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

  // Group and link ALL transactions to Customers Directory
  const customerDirectory = useMemo(() => {
    const map = new Map();

    // 1. Seed with registered / known customers
    const baseCustomers = (customerList.length > 0 ? customerList : udhaarLedger) || [];
    baseCustomers.forEach(c => {
      const details = getCustomerDetails(c);
      if (!details.name) return;
      const key = (details.id || details.name).toLowerCase();
      map.set(key, {
        ...details,
        isRegistered: c.isRegistered ?? true,
        transactions: []
      });
    });

    // 2. Associate ALL transactions with customers
    transactions.forEach(tx => {
      const party = (tx.customer_vendor_name || '').trim();
      const phone = cleanIndianPhone(tx.customer_phone);
      const cId = tx.customer_id;

      let matchedKey = null;

      // A. By customer_id
      if (cId) {
        for (const [k, c] of map.entries()) {
          if (c.id === cId) {
            matchedKey = k;
            break;
          }
        }
      }

      // B. By exact clean phone
      if (!matchedKey && phone && phone.length === 10) {
        for (const [k, c] of map.entries()) {
          if (c.cleanPhone === phone) {
            matchedKey = k;
            break;
          }
        }
      }

      // C. By exact normalized name
      if (!matchedKey && party) {
        for (const [k, c] of map.entries()) {
          if (c.name.trim().toLowerCase() === party.toLowerCase()) {
            matchedKey = k;
            break;
          }
        }
      }

      // D. Unregistered counterparty from ledger
      if (!matchedKey && party && party !== 'Walk-in Customer' && party !== 'Walk-in Village Customers' && party !== 'Demo') {
        const newKey = `party-${party.toLowerCase()}`;
        map.set(newKey, {
          id: newKey,
          name: party,
          phone: tx.customer_phone || '',
          cleanPhone: phone,
          village: '',
          balanceOwed: 0,
          txCount: 0,
          udhaarStatus: 'No Pending Udhaar',
          createdAt: tx.date,
          isRegistered: false,
          transactions: []
        });
        matchedKey = newKey;
      }

      if (matchedKey && map.has(matchedKey)) {
        map.get(matchedKey).transactions.push(tx);
      }
    });

    // 3. Compute live transaction count and udhaar status for each customer
    const list = Array.from(map.values()).map(c => {
      const txCount = Math.max(c.transactions.length, c.txCount || 0);
      let udhaarGiven = 0;
      let udhaarRepaid = 0;
      c.transactions.forEach(t => {
        if (t.type === 'udhaar_given') udhaarGiven += Number(t.amount || 0);
        else if (t.type === 'udhaar_repaid') udhaarRepaid += Number(t.amount || 0);
      });
      const balanceOwed = Math.max(0, (c.balanceOwed || 0), (udhaarGiven - udhaarRepaid));
      const udhaarStatus = balanceOwed > 0 ? 'Udhaar Active' : 'No Pending Udhaar';

      // Sort customer's transactions by date descending
      c.transactions.sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0));

      let customerSince = c.createdAt;
      if (!customerSince && c.transactions.length > 0) {
        customerSince = c.transactions[c.transactions.length - 1].date;
      }

      return {
        ...c,
        txCount,
        balanceOwed,
        udhaarStatus,
        customerSince: customerSince || 'Active customer'
      };
    });

    return list.sort((a, b) => {
      if (b.txCount !== a.txCount) return b.txCount - a.txCount;
      return b.balanceOwed - a.balanceOwed;
    });
  }, [customerList, udhaarLedger, transactions]);

  // Real-time filtered customers list
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customerDirectory;
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/\D/g, '');
    return customerDirectory.filter(c => {
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchPhone = cleanQ && c.cleanPhone && c.cleanPhone.includes(cleanQ);
      const matchVillage = c.village && c.village.toLowerCase().includes(q);
      return matchName || matchPhone || matchVillage;
    });
  }, [customerDirectory, searchQuery]);

  // Open customer detail drawer from a transaction row
  const handleOpenCustomerByTx = (tx) => {
    const party = (tx.customer_vendor_name || '').trim();
    const phone = cleanIndianPhone(tx.customer_phone);
    const cId = tx.customer_id;

    let found = null;
    if (cId) found = customerDirectory.find(c => c.id === cId);
    if (!found && phone) found = customerDirectory.find(c => c.cleanPhone === phone);
    if (!found && party) found = customerDirectory.find(c => c.name.trim().toLowerCase() === party.toLowerCase());

    if (found) {
      setSelectedCustomerDetail(found);
    } else if (party) {
      setSelectedCustomerDetail({
        id: `party-${party.toLowerCase()}`,
        name: party,
        phone: tx.customer_phone || '',
        cleanPhone: phone,
        village: '',
        customerSince: tx.date || 'Active',
        txCount: 1,
        udhaarStatus: tx.type === 'udhaar_given' ? 'Udhaar Active' : 'No Pending Udhaar',
        transactions: [tx]
      });
    }
    setCustomerTxFilter('all');
    setCustomerTxSearch('');
  };

  // Transactions filtered inside the customer detail drawer
  const drawerTransactions = useMemo(() => {
    if (!selectedCustomerDetail) return [];
    const cust = selectedCustomerDetail;
    const cleanPhone = cust.cleanPhone;
    const custName = (cust.name || '').trim().toLowerCase();
    const cId = cust.id;

    const matched = transactions.filter(t => {
      if (cId && t.customer_id === cId) return true;
      if (cleanPhone && cleanIndianPhone(t.customer_phone) === cleanPhone) return true;
      if (custName && (t.customer_vendor_name || '').trim().toLowerCase() === custName) return true;
      return false;
    });

    return matched.filter(t => {
      if (customerTxFilter !== 'all') {
        if ((customerTxFilter === 'sales' || customerTxFilter === 'income') && t.type !== 'income') return false;
        if ((customerTxFilter === 'purchases' || customerTxFilter === 'expenses' || customerTxFilter === 'expense') && t.type !== 'expense') return false;
        if (customerTxFilter === 'udhaar_given' && t.type !== 'udhaar_given') return false;
        if (customerTxFilter === 'udhaar_repaid' && t.type !== 'udhaar_repaid') return false;
      }
      if (customerTxSearch.trim()) {
        const q = customerTxSearch.toLowerCase();
        const matchNote = (t.notes || '').toLowerCase().includes(q);
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchAmt = String(t.amount || '').includes(q);
        if (!matchNote && !matchCat && !matchAmt) return false;
      }
      return true;
    });
  }, [selectedCustomerDetail, transactions, customerTxFilter, customerTxSearch]);

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
      link.setAttribute('download', `VyapaarSetu_BahiKhata_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <div className="lg:col-span-6 relative flex items-center justify-end select-none">
            <div className="relative w-full max-w-[530px] rounded-2xl bg-[#FAF7F2] border border-[#EAE3D6] overflow-hidden shadow-2xs">
              <img 
                src="/assets/saakhsetu/bahikhata-hero.png" 
                alt="Rural Shopkeeper Recording Bahi-Khata Ledger" 
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
              {/* Authentic Motivational Calligraphic Strip */}
              <div className="px-4 py-2.5 bg-[#FAF7F2]/95 border-t border-[#EAE3D6] flex items-center justify-between flex-wrap gap-2">
                <span className="font-serif italic font-bold text-xs sm:text-sm text-[#0F3E2E] tracking-wide">
                  "छोटे हिसाब, बड़ी तस्वीर बनाते हैं।"
                </span>
                <TricolorBrush className="w-20 h-2.5 shrink-0" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. HORIZONTAL TRANSACTION CATEGORY SELECTOR & MORE ACTIONS */}
      <section className="relative flex items-center justify-between gap-3">
        {/* Category Pills (horizontally scrollable without trapping More Actions) */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar flex-1 min-w-0">
          {/* All Transactions */}
          <button
            type="button"
            onClick={() => { setSelectedCategoryTab('all'); setTypeFilter('all'); }}
            className={`flex-1 min-w-[145px] p-3.5 rounded-2xl border text-left cursor-pointer shrink-0 transition-all duration-200 ${
              selectedCategoryTab === 'all'
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
                : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white hover-lift'
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

          {/* Customers */}
          <button
            type="button"
            onClick={() => { setSelectedCategoryTab('customers'); }}
            className={`flex-1 min-w-[135px] p-3.5 rounded-2xl border text-left cursor-pointer shrink-0 transition-all duration-200 ${
              selectedCategoryTab === 'customers'
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
                : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white hover-lift'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className={`w-4 h-4 ${selectedCategoryTab === 'customers' ? 'text-white' : 'text-emerald-700'}`} />
              <span className="font-serif font-bold text-xs">
                {language === 'hi' ? 'ग्राहक खाता' : 'Customers'}
              </span>
            </div>
            <p className={`text-[10px] ${selectedCategoryTab === 'customers' ? 'text-emerald-200' : 'text-stone-500'}`}>
              Party accounts & ledger
            </p>
          </button>

          {/* Sales */}
          <button
            type="button"
            onClick={() => { setSelectedCategoryTab('sales'); setTypeFilter('income'); }}
            className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left cursor-pointer shrink-0 transition-all duration-200 ${
              selectedCategoryTab === 'sales'
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
                : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white hover-lift'
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
            className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left cursor-pointer shrink-0 transition-all duration-200 ${
              selectedCategoryTab === 'purchases'
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
                : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white hover-lift'
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
            className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left cursor-pointer shrink-0 transition-all duration-200 ${
              selectedCategoryTab === 'expenses'
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
                : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white hover-lift'
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
            className={`flex-1 min-w-[130px] p-3.5 rounded-2xl border text-left cursor-pointer shrink-0 transition-all duration-200 ${
              selectedCategoryTab === 'udhaar'
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E] shadow-sm'
                : 'bg-white/95 text-stone-800 border-stone-200/80 hover:border-stone-300 hover:bg-white hover-lift'
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
        </div>

        {/* More Actions Trigger & Anchored Popover */}
        <div ref={moreActionsContainerRef} className="relative shrink-0">
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={moreActionsOpen}
            onClick={() => setMoreActionsOpen(prev => !prev)}
            className={`h-full py-3.5 px-4 rounded-2xl border transition-all duration-150 flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-2xs select-none ${
              moreActionsOpen
                ? 'bg-[#0F3E2E] text-white border-[#0F3E2E]'
                : 'bg-white/95 text-stone-700 border-stone-200/80 hover:text-stone-950 hover:border-stone-300 hover:bg-white'
            }`}
          >
            <span>{language === 'hi' ? 'अन्य विकल्प' : 'More Actions'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreActionsOpen ? 'rotate-180 text-white' : 'text-stone-500'}`} />
          </button>

          {/* Desktop/Tablet Anchored Popover (sm and up) */}
          {moreActionsOpen && (
            <div
              className="hidden sm:block absolute right-0 top-full mt-2 w-60 z-[60] bg-white border border-stone-200/90 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] space-y-1 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1 flex items-center justify-between">
                <span>{language === 'hi' ? 'त्वरित कार्य' : 'Actions'}</span>
                <span className="text-[9px] text-stone-400 lowercase font-normal">esc to close</span>
              </div>

              {/* Record Sale */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); onOpenKeypad?.('income'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'बिक्री दर्ज करें' : 'Record Sale'}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    {language === 'hi' ? 'दुकान की बिक्री' : 'Daily sales (Money In)'}
                  </span>
                </div>
              </button>

              {/* Record Purchase */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); onOpenKeypad?.('expense', 'Stock Purchase / माल खरीद'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'खरीद दर्ज करें' : 'Record Purchase'}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    {language === 'hi' ? 'स्टॉक / माल खरीद' : 'Stock & goods'}
                  </span>
                </div>
              </button>

              {/* Add Expense */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); onOpenKeypad?.('expense', 'Operational Expense / खर्च'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'खर्च जोड़ें' : 'Add Expense'}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    {language === 'hi' ? 'बिजली, किराया आदि' : 'Bills, transport, misc'}
                  </span>
                </div>
              </button>

              {/* Add Customer Account */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); setIsRegisterCustomerOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'नया ग्राहक खाता' : 'Add Customer Account'}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    {language === 'hi' ? 'उधार खाता शुरू करें' : 'Open party khata'}
                  </span>
                </div>
              </button>

              {/* Voice Khata Entry */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); setIsVoiceOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'बोलकर खाता लिखें' : 'Voice Khata Entry'}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    {language === 'hi' ? 'हिंदी / अंग्रेजी वॉइस' : 'Speak to record'}
                  </span>
                </div>
              </button>

              {/* Subtle Divider */}
              <div className="my-1 border-t border-stone-100" />

              {/* Export CSV Ledger */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); handleExportCSV(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'CSV लेजर डाउनलोड करें' : 'Export CSV Ledger'}
                  </span>
                </div>
              </button>

              {/* Print Ledger */}
              <button
                type="button"
                onClick={() => { setMoreActionsOpen(false); window.print(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-950 text-left transition-colors cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs block truncate text-stone-800">
                    {language === 'hi' ? 'लेजर प्रिंट करें' : 'Print Ledger'}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Mobile Action Bottom Sheet (< 640px) */}
          {moreActionsOpen && (
            <div className="sm:hidden">
              <div
                className="fixed inset-0 z-[100] bg-stone-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={() => setMoreActionsOpen(false)}
                aria-hidden="true"
              />
              <div
                className="fixed inset-x-3 bottom-5 z-[101] bg-white border border-stone-200/90 rounded-3xl p-4 shadow-2xl space-y-2 text-xs select-none animate-in slide-in-from-bottom-4 duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-1">
                  <span className="font-serif font-bold text-xs text-stone-900 tracking-wide uppercase">
                    {language === 'hi' ? 'कार्य व विकल्प' : 'Actions & Tools'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMoreActionsOpen(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1 max-h-[60vh] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setMoreActionsOpen(false); onOpenKeypad?.('income'); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs block text-stone-800">
                        {language === 'hi' ? 'बिक्री दर्ज करें' : 'Record Sale'}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {language === 'hi' ? 'दुकान की बिक्री' : 'Daily sales (Money In)'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMoreActionsOpen(false); onOpenKeypad?.('expense', 'Stock Purchase / माल खरीद'); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs block text-stone-800">
                        {language === 'hi' ? 'खरीद दर्ज करें' : 'Record Purchase'}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {language === 'hi' ? 'स्टॉक / माल खरीद' : 'Stock & goods'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMoreActionsOpen(false); onOpenKeypad?.('expense', 'Operational Expense / खर्च'); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs block text-stone-800">
                        {language === 'hi' ? 'खर्च जोड़ें' : 'Add Expense'}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {language === 'hi' ? 'बिजली, किराया आदि' : 'Bills, transport, misc'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMoreActionsOpen(false); setIsRegisterCustomerOpen(true); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs block text-stone-800">
                        {language === 'hi' ? 'नया ग्राहक खाता' : 'Add Customer Account'}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {language === 'hi' ? 'उधार खाता शुरू करें' : 'Open party khata'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMoreActionsOpen(false); setIsVoiceOpen(true); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs block text-stone-800">
                        {language === 'hi' ? 'बोलकर खाता लिखें' : 'Voice Khata Entry'}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {language === 'hi' ? 'हिंदी / अंग्रेजी' : 'Speak to record'}
                      </span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-stone-100" />

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setMoreActionsOpen(false); handleExportCSV(); }}
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMoreActionsOpen(false); window.print(); }}
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
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
            placeholder={
              selectedCategoryTab === 'customers'
                ? "Search customers by name, phone, or village..."
                : "Search transactions (e.g. Amul, Ramu, ₹500...)"
            }
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
          {selectedCategoryTab === 'customers' ? (
            <button
              type="button"
              onClick={() => setIsRegisterCustomerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'hi' ? '+ नया ग्राहक' : '+ Add Customer'}</span>
            </button>
          ) : (
            <>
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
                onClick={() => onOpenKeypad?.('income')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Record Transaction</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* 4. MAIN CONTENT AREA: TABLE (LEFT 8 COLS) + SIDEBAR ACTIONS (RIGHT 4 COLS) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 8/9 COLS: MAIN TRANSACTION TABLE OR CUSTOMER DIRECTORY */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {selectedCategoryTab === 'customers' ? (
            <div className="rounded-2xl bg-white border border-stone-200/90 overflow-hidden shadow-2xs">
              {/* Customer List Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-[#FAF8F5]/60 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0F3E2E]" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      {language === 'hi' ? 'ग्राहक एवं पार्टी खाता' : 'Customer & Party Directory'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer record' : 'customer records'} • Select any customer to view their full ledger
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRegisterCustomerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs btn-tactile cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? '+ नया ग्राहक' : '+ Add Customer'}</span>
                </button>
              </div>

              {/* Customers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200/80 bg-[#FAF8F5]/40 text-stone-500 font-serif">
                      <th className="py-3 px-3.5 sm:px-4 font-bold">Customer Name</th>
                      <th className="py-3 px-3 sm:px-4 font-bold">Phone Number</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-center">Transactions</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-center">Udhaar Status</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => {
                        const initial = (cust.name || 'C').charAt(0).toUpperCase();
                        const isUdhaarActive = cust.udhaarStatus === 'Udhaar Active';

                        return (
                          <tr
                            key={cust.id || cust.name}
                            onClick={() => {
                              setSelectedCustomerDetail(cust);
                              setCustomerTxFilter('all');
                              setCustomerTxSearch('');
                            }}
                            className="hover:bg-[#F5EFE6]/70 transition-all duration-150 cursor-pointer group"
                          >
                            {/* Name with Avatar */}
                            <td className="py-3 px-3.5 sm:px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#0F3E2E] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0 shadow-2xs group-hover:scale-110 transition-transform duration-200">
                                  {initial}
                                </div>
                                <div>
                                  <div className="font-serif font-bold text-stone-900 group-hover:text-[#0F3E2E] transition-colors">
                                    {cust.name}
                                  </div>
                                  {cust.village && (
                                    <div className="text-[11px] text-stone-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-stone-400" />
                                      <span>{cust.village}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="py-3 px-3 sm:px-4 text-stone-600 font-mono text-[11px]">
                              {cust.phone ? (
                                <span className="inline-flex items-center gap-1 text-stone-700">
                                  <Phone className="w-3 h-3 text-stone-400" />
                                  {cust.phone}
                                </span>
                              ) : (
                                <span className="text-stone-400 italic">No phone</span>
                              )}
                            </td>

                            {/* Transactions Count */}
                            <td className="py-3 px-3 sm:px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
                                {cust.txCount || cust.transactions?.length || 0} transactions
                              </span>
                            </td>

                            {/* Udhaar Status */}
                            <td className="py-3 px-3 sm:px-4 text-center">
                              {isUdhaarActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Udhaar Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  No Pending Udhaar
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="py-3 px-3 sm:px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomerDetail(cust);
                                  setCustomerTxFilter('all');
                                  setCustomerTxSearch('');
                                }}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#0F3E2E] group-hover:underline cursor-pointer"
                              >
                                <span>View Ledger</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-stone-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Users className="w-8 h-8 text-stone-300" />
                            <div className="font-serif font-bold text-sm text-stone-800">
                              No customers found
                            </div>
                            <p className="text-xs text-stone-400 max-w-xs">
                              {searchQuery
                                ? 'No customers match your search query.'
                                : 'Customers will appear here automatically when you record transactions or register accounts.'}
                            </p>
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="mt-2 text-xs text-[#0F3E2E] font-bold underline cursor-pointer"
                              >
                                Clear Search
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
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
                          className="hover:bg-[#F5EFE6]/70 transition-all duration-150 cursor-pointer group"
                        >
                          {/* Type with Context Icon */}
                          <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 group-hover:scale-110 transition-transform duration-200 ${meta.color}`}>
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCustomerByTx(tx);
                              }}
                              className="text-left font-medium text-stone-700 hover:text-[#0F3E2E] hover:underline cursor-pointer transition-colors inline-flex items-center gap-1 group/party truncate max-w-full"
                              title="Open customer ledger"
                            >
                              <span className="truncate">{getPartyName(tx)}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/party:opacity-100 text-[#0F3E2E] shrink-0 transition-opacity" />
                            </button>
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
        )}
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
                onClick={() => onOpenKeypad?.('income')}
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
                onClick={() => onOpenKeypad?.('expense', 'Stock Purchase / माल खरीद')}
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
                onClick={() => onOpenKeypad?.('expense', 'Operational Expense / खर्च')}
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
            onNavigateTab?.('schemes');
            window.dispatchEvent(new CustomEvent('saakhsetu:navigate', { detail: { tab: 'schemes' } }));
          }}
          className="px-5 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap z-10 shrink-0"
        >
          Explore Schemes →
        </button>

        {/* Decorative Rural Trees Illustration Backdrop */}
        <div className="absolute right-0 bottom-0 top-0 opacity-15 pointer-events-none overflow-hidden select-none">
          <img 
            src="/assets/saakhsetu/rural-landscape.png" 
            alt="Rural Backdrop" 
            className="h-full w-auto object-cover object-right"
          />
        </div>
      </section>

      {/* 6. CLEAN FOOTER */}
      <footer className="pt-3 pb-8 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap">
          <span className="font-bold text-stone-800">© 2026 Vyapaar Setu</span>
          <span className="text-stone-300">•</span>
          <span>Bridging Businesses to Credit</span>
          <span className="text-stone-300">•</span>
          <span className="font-semibold text-emerald-800">Built for Bharat</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-stone-600">
          <button 
            type="button" 
            onClick={() => alert('Vyapaar Setu adheres to strict RBI Priority Sector Lending borrower data privacy principles. All merchant records remain confidential.')}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button 
            type="button" 
            onClick={() => alert('Vyapaar Setu MSME Terms: Governed under RBI PSL norms and MSMED Act framework for Indian micro-enterprises.')}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Terms
          </button>
          <button 
            type="button" 
            onClick={() => window.open('tel:18008897388', '_self')}
            className="hover:text-stone-900 transition-colors cursor-pointer"
          >
            Contact (1800-889-SETU)
          </button>
          <span className="text-stone-300">|</span>
          <div className="flex items-center gap-2.5 text-stone-500">
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-stone-800 cursor-pointer font-bold" aria-label="LinkedIn">in</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-stone-800 cursor-pointer font-bold" aria-label="Twitter">𝕏</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-stone-800 cursor-pointer font-bold" aria-label="YouTube">▶</a>
          </div>
        </div>
      </footer>

      {/* CUSTOMER DETAIL DRAWER / LEDGER PANEL */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setSelectedCustomerDetail(null)}
          />

          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-[#FAF8F5] border-l border-stone-300 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F3E2E] text-white flex items-center justify-center font-serif font-bold text-base shadow-2xs">
                  {(selectedCustomerDetail.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                      Customer Ledger
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedCustomerDetail.udhaarStatus === 'Udhaar Active'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedCustomerDetail.udhaarStatus}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                    {selectedCustomerDetail.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerDetail(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Profile Card */}
              <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Phone */}
                  <div className="flex items-center gap-2 text-stone-600">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Phone:</span>
                    {selectedCustomerDetail.phone ? (
                      <a 
                        href={`tel:${selectedCustomerDetail.phone}`}
                        className="font-mono font-bold text-stone-900 hover:text-[#0F3E2E] hover:underline"
                      >
                        {selectedCustomerDetail.phone}
                      </a>
                    ) : (
                      <span className="text-stone-400 italic">Not recorded</span>
                    )}
                  </div>

                  {/* Village / Area */}
                  <div className="flex items-center gap-2 text-stone-600">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Village/Area:</span>
                    <span className="font-semibold text-stone-900">
                      {selectedCustomerDetail.village || 'Local'}
                    </span>
                  </div>

                  {/* Customer Since */}
                  <div className="flex items-center gap-2 text-stone-600">
                    <CalendarDays className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Customer Since:</span>
                    <span className="font-mono text-stone-800">
                      {selectedCustomerDetail.customerSince ? formatDateTime(selectedCustomerDetail.customerSince).split(',')[0] : 'Active'}
                    </span>
                  </div>

                  {/* Total Transactions */}
                  <div className="flex items-center gap-2 text-stone-600">
                    <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Total Activity:</span>
                    <span className="font-bold text-stone-900">
                      {drawerTransactions.length} transactions
                    </span>
                  </div>
                </div>

                {/* Udhaar Balance Status & WhatsApp Reminder */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs">
                    <span className="text-stone-500">Khata / Udhaar Balance: </span>
                    <span className={`font-serif font-black text-sm ${selectedCustomerDetail.balanceOwed > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {selectedCustomerDetail.balanceOwed > 0 ? `₹${Number(selectedCustomerDetail.balanceOwed).toLocaleString('en-IN')} pending` : '₹0 (Settled)'}
                    </span>
                  </div>

                  {selectedCustomerDetail.phone && selectedCustomerDetail.balanceOwed > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedWhatsAppCustomer(selectedCustomerDetail)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Reminder</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions History Header & Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-stone-900">
                    Transaction History
                  </h4>
                  <span className="text-xs text-stone-500">
                    {drawerTransactions.length} {drawerTransactions.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {/* Search Within Customer History */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    value={customerTxSearch}
                    onChange={(e) => setCustomerTxSearch(e.target.value)}
                    placeholder="Search notes, particulars, amount..."
                    className="w-full pl-8.5 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#0F3E2E]"
                  />
                  {customerTxSearch && (
                    <button
                      onClick={() => setCustomerTxSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'sales', label: 'Sales' },
                    { id: 'purchases', label: 'Purchases' },
                    { id: 'expenses', label: 'Expenses' },
                    { id: 'udhaar_given', label: 'Udhaar Given' },
                    { id: 'udhaar_repaid', label: 'Udhaar Received' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCustomerTxFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                        customerTxFilter === tab.id
                          ? 'bg-[#0F3E2E] text-white shadow-2xs'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Transaction List */}
                <div className="space-y-2">
                  {drawerTransactions.length > 0 ? (
                    drawerTransactions.map(tx => {
                      const meta = getTypeMeta(tx);
                      const Icon = meta.icon;

                      return (
                        <div
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="p-3 bg-white border border-stone-200/80 hover:border-stone-300 rounded-xl flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${meta.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-xs text-stone-900 group-hover:text-[#0F3E2E] transition-colors truncate">
                                  {formatParticulars(tx)}
                                </span>
                                {getPaymentBadge(tx.payment_mode)}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono mt-0.5">
                                <span>{formatDateTime(tx.date)}</span>
                                {tx.category && <span>• {tx.category}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`font-serif font-bold text-xs tabular-nums ${meta.amountColor}`}>
                              {meta.sign} ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-stone-400">View details →</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center bg-white border border-stone-200/80 rounded-2xl p-6">
                      <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <div className="font-serif font-bold text-xs text-stone-800">
                        No transactions found
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {customerTxSearch || customerTxFilter !== 'all'
                          ? 'No records match your filter criteria.'
                          : 'No recorded transactions for this customer yet.'}
                      </p>
                      {(customerTxSearch || customerTxFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerTxFilter('all');
                            setCustomerTxSearch('');
                          }}
                          className="mt-2 text-xs text-[#0F3E2E] font-bold underline cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustomerDetail(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenKeypad?.('income');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs shadow-2xs hover:shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Transaction</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
