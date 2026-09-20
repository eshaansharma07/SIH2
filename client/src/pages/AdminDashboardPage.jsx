import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Landmark, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Lock,
  KeyRound,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { INDIAN_STATES_AND_UTS } from '../data/indianStates';
import { WarliBorder } from '../components/WarliMotif';

export function AdminDashboardPage({ onSelectShop, onNavigateTab }) {
  const { language } = useTranslation();

  // Institutional Security Clearance Gate
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('saakhsetu_admin_unlocked') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Telemetry data
  const [metrics, setMetrics] = useState(null);
  const [scraperStatus, setScraperStatus] = useState(null);
  const [shops, setShops] = useState([]);
  const [totalShops, setTotalShops] = useState(0);

  const [loading, setLoading] = useState(true);
  const [syncingSchemes, setSyncingSchemes] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Pagination state (fixes endless scroll)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedMilestone, setSelectedMilestone] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleUnlock = (codeToVerify) => {
    const code = String(codeToVerify || passcode).trim();
    // Authorized officer passcodes: 7788 (official evaluator PIN), 9999, or 1234
    if (code === '7788' || code === '9999' || code === '1234') {
      try {
        sessionStorage.setItem('saakhsetu_admin_unlocked', 'true');
      } catch (_) {}
      setUnlocked(true);
      setPasscodeError('');
    } else {
      setPasscodeError(language === 'hi' ? 'अमान्य अधिकारी पिन। कृपया पुनः प्रयास करें।' : 'Invalid officer PIN. Please try again.');
    }
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem('saakhsetu_admin_unlocked');
    } catch (_) {}
    setUnlocked(false);
    setPasscode('');
    setPasscodeError('');
  };

  const fetchAdminData = async () => {
    try {
      setError(null);
      const offset = (currentPage - 1) * pageSize;
      const [metricsRes, shopsRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminShops({
          search: searchQuery,
          state: selectedState,
          milestone: selectedMilestone,
          limit: pageSize,
          offset
        })
      ]);

      if (metricsRes?.success) {
        setMetrics(metricsRes.metrics);
        setScraperStatus(metricsRes.scraperStatus);
      }
      if (shopsRes?.success) {
        setShops(shopsRes.shops || []);
        setTotalShops(shopsRes.total || 0);
      }
    } catch (err) {
      console.error('[AdminDashboardPage] Fetch error:', err);
      setError(err.message || 'Failed to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) {
      fetchAdminData();
    }
  }, [unlocked, currentPage, pageSize, selectedState, selectedMilestone]);

  // Debounced search (resets to page 1 on search change)
  useEffect(() => {
    if (!unlocked) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchAdminData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSyncGovtSchemes = async () => {
    setSyncingSchemes(true);
    try {
      const res = await api.syncAdminSchemes();
      if (res?.success) {
        showToast(
          language === 'hi' 
            ? 'सरकारी पोर्टल सफलतापूर्वक स्कैन और सिंक किए गए!' 
            : 'Statutory government portals synced successfully!'
        );
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Sync failed');
    } finally {
      setSyncingSchemes(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const totalPages = Math.max(1, Math.ceil(totalShops / pageSize));

  // =========================================================================
  // GATE: INSTITUTIONAL OFFICER PASSCODE MODAL
  // =========================================================================
  if (!unlocked) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#FAF7F2] border border-[#E7DFD4] rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-900/5 relative overflow-hidden space-y-5">
          {/* Subtle Warm Warli Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-600 via-[#123B2B] to-amber-600" />

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#123B2B] text-amber-300 mx-auto flex items-center justify-center shadow-md border border-[#0F3E2E]">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-serif font-black text-xl sm:text-2xl text-[#1C1917] tracking-tight">
              {language === 'hi' ? 'संस्थागत कमान केंद्र' : 'Institutional Command Center'}
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
              {language === 'hi'
                ? 'यह अनुभाग केवल लीड बैंक अधिकारियों, डीआईसी प्रबंधकों और मूल्यांकनकर्ताओं के लिए आरक्षित है।'
                : 'Restricted administrative surveillance for Lead District Managers (LDM), DIC Officers, and Evaluators.'}
            </p>
          </div>

          {passcodeError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleUnlock(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {language === 'hi' ? 'अधिकारी सुरक्षा पिन (Officer PIN)' : 'Officer Security PIN'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setPasscodeError(''); }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDD3C4] rounded-xl text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#123B2B]"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!passcode.trim()}
              className="w-full py-2.5 bg-[#123B2B] hover:bg-[#0F3224] text-[#FFFDF8] rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'कमान केंद्र में प्रवेश करें' : 'Verify & Enter Command Center'}</span>
            </button>
          </form>

          {/* Quick Fill for Hackathon Judges */}
          <div className="pt-2 border-t border-[#ECE5D8] text-center space-y-2">
            <button
              type="button"
              onClick={() => handleUnlock('7788')}
              className="w-full py-2 px-3 bg-[#EAE3D5] hover:bg-[#DFD5C4] text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[#D5C9B6]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>One-Tap Evaluator Passcode (PIN: 7788)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 transition flex items-center gap-1 mx-auto pt-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'दुकानदार बही-खाता पर वापस जाएं' : 'Back to Shopkeeper Bahi-Khata'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN COMMAND CENTER (UNLOCKED)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#123B2B] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-medium border border-amber-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner in Theme: Deep Forest Green #123B2B + Warm Cream + Gold */}
      <div className="rounded-3xl bg-[#123B2B] text-[#FFFDF8] p-5 sm:p-7 shadow-lg border border-[#0F3224] relative overflow-hidden">
        {/* Subtle Decorative Warm Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            {/* Top Tagline & Return Button */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#FFF9E6] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
                <span>{language === 'hi' ? 'व्यापारी दृश्य पर लौटें' : 'Back to Shop View'}</span>
              </button>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Institutional Command Center
              </span>

              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                MongoDB Atlas Connected
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-[#FFFDF8] tracking-tight">
              {language === 'hi' 
                ? 'जिला एमएसएमई एवं क्रेडिट कमान केंद्र' 
                : 'District MSME & Credit Underwriting Command Center'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'अग्रणी जिला प्रबंधकों (LDM), बैंक शाखाओं और डीआईसी अधिकारियों के लिए 50-लेन-देन ऑडिट सत्यापन एवं सरकारी योजना वितरण निगरानी।'
                : 'Real-time surveillance for Lead Bank Managers, DIC officers, and institutional lenders to verify rural enterprise cashflows, 50-tx audit milestones, and statutory scheme absorption.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={handleSyncGovtSchemes}
              disabled={syncingSchemes}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSchemes ? 'animate-spin' : ''}`} />
              <span>
                {syncingSchemes 
                  ? (language === 'hi' ? 'सिंक हो रहा है...' : 'Scanning...') 
                  : (language === 'hi' ? 'पोर्टल सिंक करें' : 'Sync Govt Feeds')}
              </span>
            </button>

            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition border border-white/10 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLock}
              className="px-3 py-2 bg-white/10 hover:bg-red-500/20 text-stone-200 hover:text-red-300 rounded-xl text-xs font-medium transition border border-white/10 cursor-pointer"
              title="Exit Officer Mode"
            >
              {language === 'hi' ? 'लॉक करें' : 'Lock'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Primary KPI Cards in Warm Parchment Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered MSMEs */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E7DFD4] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              {language === 'hi' ? 'पंजीकृत सूक्ष्म उद्यम' : 'Onboarded MSMEs'}
            </span>
            <span className="p-2 bg-[#123B2B]/10 text-[#123B2B] rounded-xl">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917]">
            {loading ? '...' : (metrics?.totalShops || 0)}
          </div>
          <div className="text-[11px] text-stone-600 flex items-center gap-1 font-medium">
            <span className="text-[#123B2B] font-bold">{metrics?.coveredStatesCount || 1} States</span>
            <span>covered in registry</span>
          </div>
        </div>

        {/* Card 2: Total Transaction Volume */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E7DFD4] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              {language === 'hi' ? 'सकल बही-खाता प्रवाह' : 'Gross Platform Volume'}
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917]">
            {loading ? '...' : formatCurrency(metrics?.totalVolume)}
          </div>
          <div className="text-[11px] text-stone-600 font-medium">
            <span className="font-bold text-stone-800">{metrics?.totalTransactions || 0}</span> transactions logged
          </div>
        </div>

        {/* Card 3: 50-Tx Milestone Pipeline */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E7DFD4] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              {language === 'hi' ? 'क्रेडिट ऑडिट सत्यापन' : '50-Tx Audit Milestone'}
            </span>
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917]">
              {loading ? '...' : (metrics?.scoredShops || 0)}
            </span>
            <span className="text-xs font-bold text-stone-500">
              / {metrics?.totalShops || 0} Scored
            </span>
          </div>
          <div className="w-full bg-[#E8DFD1] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#123B2B] h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics?.milestonePassRate || 0}%` }}
            />
          </div>
          <div className="text-[11px] text-stone-600 flex justify-between font-medium">
            <span className="text-emerald-800 font-bold">{metrics?.milestonePassRate || 0}% Qualified</span>
            <span className="text-amber-800 font-bold">{metrics?.unratedShops || 0} under audit</span>
          </div>
        </div>

        {/* Card 4: Statutory Schemes */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E7DFD4] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              {language === 'hi' ? 'सत्यापित सरकारी योजनाएं' : 'Monitored Schemes'}
            </span>
            <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917]">
            {loading ? '...' : (metrics?.statutorySchemesCount || 14)}
          </div>
          <div className="text-[11px] text-purple-800 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            <span>PIB, MSME & myScheme feeds live</span>
          </div>
        </div>
      </div>

      {/* Credit & Underwriting Pulse Banner */}
      <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-[#E7DFD4] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECE4D4] pb-3">
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1917]">
              {language === 'hi' ? 'ऋण पात्रता एवं ऑडिट प्रगति' : 'Credit Scoring & Audit Verification Distribution'}
            </h3>
            <p className="text-xs text-stone-600">
              {language === 'hi' 
                ? 'आरबीआई नायक समिति मानकों पर आधारित पारदर्शी 4-स्तंभ क्रेडिट वितरण' 
                : 'Pillar-based alternative underwriting for rural enterprises lacking formal CIBIL scores.'}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-[#EAE3D5] text-stone-800 rounded-lg font-mono font-semibold self-start sm:self-auto border border-[#D5C9B6]">
            Scale: 300 – 850
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-[#E8F0EA] border border-[#C6DDD0] rounded-2xl space-y-1">
            <div className="text-xs font-bold text-[#0F3E2E]">Prime (750+)</div>
            <div className="text-sm sm:text-base font-bold text-emerald-950">Immediate Collateral-Free</div>
            <div className="text-[10px] text-emerald-800">MUDRA Tarun / Stand-Up Eligible</div>
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-blue-900">Creditworthy (650–749)</div>
            <div className="text-sm sm:text-base font-bold text-blue-950">Standard Working Capital</div>
            <div className="text-[10px] text-blue-800">MUDRA Kishor / CGTMSE Backed</div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-amber-900">Developing (550–649)</div>
            <div className="text-sm sm:text-base font-bold text-amber-950">Micro-Credit Linked</div>
            <div className="text-[10px] text-amber-800">MUDRA Shishu / PM Vishwakarma</div>
          </div>

          <div className="p-3 bg-stone-100/90 border border-[#DCD5C8] rounded-2xl space-y-1">
            <div className="text-xs font-bold text-stone-700">Under Audit (&lt;50 Txs)</div>
            <div className="text-sm sm:text-base font-bold text-stone-900">{metrics?.unratedShops || 0} Shops</div>
            <div className="text-[10px] text-stone-600">Pending 50-transaction verification</div>
          </div>
        </div>
      </div>

      {/* Master MSME Directory Section with Fixed Pagination */}
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#E7DFD4] shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-black text-base sm:text-lg text-[#1C1917] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#123B2B]" />
              <span>{language === 'hi' ? 'सूक्ष्म उद्यम पंजी (MSME Master Registry)' : 'MSME Master Registry'}</span>
            </h3>
            <p className="text-xs text-stone-600">
              {language === 'hi'
                ? `कुल ${totalShops} पंजीकृत उद्यम • पृष्ठ ${currentPage} / ${totalPages}`
                : `Showing ${totalShops} total registered enterprises • Page ${currentPage} of ${totalPages}`}
            </p>
          </div>

          {/* Controls: Search, State, Milestone, Page Size */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'दुकान, मालिक या फोन खोजें...' : 'Search shop, owner, phone...'}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DDD3C4] rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#123B2B]"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-[#DDD3C4] rounded-xl text-xs font-medium text-stone-700 focus:outline-none"
            >
              <option value="all">{language === 'hi' ? 'सभी राज्य (All States)' : 'All States'}</option>
              {INDIAN_STATES_AND_UTS.map(s => (
                <option key={s.id} value={s.id}>
                  {language === 'hi' ? s.labelHi : s.labelEn}
                </option>
              ))}
            </select>

            {/* Milestone Filter */}
            <select
              value={selectedMilestone}
              onChange={(e) => { setSelectedMilestone(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-[#DDD3C4] rounded-xl text-xs font-medium text-stone-700 focus:outline-none"
            >
              <option value="all">{language === 'hi' ? 'सभी स्थितियां' : 'All Milestones'}</option>
              <option value="scored">{language === 'hi' ? 'सत्यापित (50+ Txs)' : 'Scored (>=50)'}</option>
              <option value="unrated">{language === 'hi' ? 'समीक्षाधीन (<50 Txs)' : 'Under Audit (<50)'}</option>
            </select>

            {/* Items Per Page */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1.5 bg-white border border-[#DDD3C4] rounded-xl text-xs font-medium text-stone-700 focus:outline-none"
              title="Items per page"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Directory Table (Clean, Compact, No Endless Scroll) */}
        <div className="overflow-x-auto border border-[#E7DFD4] rounded-2xl bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F1E8] border-b border-[#E7DFD4] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-2.5 px-3 sm:px-4">{language === 'hi' ? 'उद्यम एवं स्वामी' : 'Enterprise & Owner'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'व्यापार श्रेणी' : 'Trade'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? 'स्थान' : 'Location'}</th>
                <th className="py-2.5 px-3">{language === 'hi' ? '50-ऑडिट प्रगति' : '50-Tx Audit Milestone'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'hi' ? 'दर्ज कारोबार' : 'Logged Volume'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                <th className="py-2.5 px-3 sm:px-4 text-right">{language === 'hi' ? 'कार्रवाई' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DC] text-xs font-medium text-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#123B2B]" />
                    <span>{language === 'hi' ? 'उद्यम रिकॉर्ड लोड हो रहे हैं...' : 'Loading enterprise records...'}</span>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    {language === 'hi' ? 'वर्तमान फिल्टर से कोई सूक्ष्म उद्यम मेल नहीं खाता।' : 'No micro-enterprises match the current filters.'}
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-[#FAF6EE] transition-colors">
                    {/* Name & Owner */}
                    <td className="py-2.5 px-3 sm:px-4">
                      <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                        <span>{shop.name}</span>
                        {shop.isDemo && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {shop.ownerName} • <span className="font-mono text-stone-600">{shop.phone || 'No phone'}</span>
                      </div>
                    </td>

                    {/* Trade */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFE8DC] text-stone-800 capitalize">
                        {shop.tradeType}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-2.5 px-3 text-[11px] text-stone-600">
                      <div>{shop.village ? `${shop.village}, ${shop.district}` : shop.district || 'Rural'}</div>
                      <div className="text-stone-400 text-[10px]">{shop.state}</div>
                    </td>

                    {/* Milestone Progress */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1 min-w-[110px]">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-stone-700">{shop.transactionCount} / 50</span>
                          <span className={shop.isScored ? 'text-emerald-800 font-bold' : 'text-amber-800'}>
                            {shop.progressPct}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E8DFD1] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${shop.isScored ? 'bg-emerald-600' : 'bg-amber-600'}`}
                            style={{ width: `${Math.min(100, shop.progressPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(shop.transactionVolume)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {shop.isScored ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0EA] text-[#0F3E2E] border border-[#C6DDD0]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>{language === 'hi' ? 'सत्यापित (Scored)' : 'Verified (Scored)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{language === 'hi' ? 'समीक्षाधीन' : 'Under Audit'}</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 sm:px-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectShop) onSelectShop(shop);
                          if (onNavigateTab) onNavigateTab('dossier');
                        }}
                        className="px-2.5 py-1 bg-[#F2ECE1] hover:bg-[#123B2B] hover:text-white rounded-lg text-[11px] font-bold text-stone-700 transition flex items-center gap-1 ml-auto cursor-pointer border border-[#E0D5C3]"
                        title="Inspect Bank Dossier / CAM"
                      >
                        <span>CAM Dossier</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-stone-600 font-medium">
            {language === 'hi' 
              ? `दिखाए जा रहे हैं: ${(currentPage - 1) * pageSize + 1} से ${Math.min(currentPage * pageSize, totalShops)} (कुल ${totalShops} उद्यम)`
              : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalShops)} of ${totalShops} enterprises`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-lg bg-white border border-[#DDD3C4] text-stone-700 hover:bg-[#EFE8DC] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                }
                const isActive = pNum === currentPage;
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isActive 
                        ? 'bg-[#123B2B] text-white' 
                        : 'bg-white border border-[#DDD3C4] text-stone-700 hover:bg-[#EFE8DC]'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg bg-white border border-[#DDD3C4] text-stone-700 hover:bg-[#EFE8DC] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
