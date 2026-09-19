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
  ExternalLink,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { INDIAN_STATES_AND_UTS } from '../data/indianStates';

export function AdminDashboardPage({ onSelectShop, onNavigateTab }) {
  const { language } = useTranslation();

  const [metrics, setMetrics] = useState(null);
  const [scraperStatus, setScraperStatus] = useState(null);
  const [shops, setShops] = useState([]);
  const [totalShops, setTotalShops] = useState(0);

  const [loading, setLoading] = useState(true);
  const [syncingSchemes, setSyncingSchemes] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedMilestone, setSelectedMilestone] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchAdminData = async () => {
    try {
      setError(null);
      const [metricsRes, shopsRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminShops({
          search: searchQuery,
          state: selectedState,
          milestone: selectedMilestone,
          limit: 100
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
    fetchAdminData();
  }, [selectedState, selectedMilestone]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1B2A4A] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-medium border border-amber-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1B2A4A] via-[#243B6B] to-[#1B2A4A] rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-stone-700/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Institutional Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                MongoDB Atlas Connected
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-50">
              {language === 'hi' 
                ? 'जिला एमएसएमई एवं क्रेडिट कमान केंद्र' 
                : 'District MSME & Credit Underwriting Command Center'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              {language === 'hi'
                ? 'अग्रणी जिला प्रबंधकों (LDM), बैंक शाखाओं और डीआईसी अधिकारियों के लिए 50-लेन-देन ऑडिट सत्यापन एवं सरकारी योजना वितरण निगरानी।'
                : 'Real-time surveillance for Lead Bank Managers, DIC officers, and institutional lenders to verify rural enterprise cashflows, 50-tx audit milestones, and statutory scheme absorption.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleSyncGovtSchemes}
              disabled={syncingSchemes}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSchemes ? 'animate-spin' : ''}`} />
              <span>
                {syncingSchemes 
                  ? (language === 'hi' ? 'सिंक हो रहा है...' : 'Scanning Portals...') 
                  : (language === 'hi' ? 'पोर्टल सिंक करें' : 'Sync Govt Feeds')}
              </span>
            </button>
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition border border-white/10"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered MSMEs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {language === 'hi' ? 'पंजीकृत सूक्ष्म उद्यम' : 'Onboarded MSMEs'}
            </span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B2A4A]">
            {loading ? '...' : (metrics?.totalShops || 0)}
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
            <span className="text-emerald-600 font-bold">{metrics?.coveredStatesCount || 1} States</span>
            <span>covered in registry</span>
          </div>
        </div>

        {/* Card 2: Total Transaction Volume */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {language === 'hi' ? 'सकल बही-खाता प्रवाह' : 'Gross Platform Volume'}
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B2A4A]">
            {loading ? '...' : formatCurrency(metrics?.totalVolume)}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            <span className="font-bold text-stone-700">{metrics?.totalTransactions || 0}</span> transactions logged
          </div>
        </div>

        {/* Card 3: 50-Tx Milestone Pipeline */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {language === 'hi' ? 'क्रेडिट ऑडिट सत्यापन' : '50-Tx Audit Milestone'}
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1B2A4A]">
              {loading ? '...' : (metrics?.scoredShops || 0)}
            </span>
            <span className="text-xs font-bold text-stone-400">
              / {metrics?.totalShops || 0} Scored
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics?.milestonePassRate || 0}%` }}
            />
          </div>
          <div className="text-[11px] text-stone-500 flex justify-between font-medium">
            <span>{metrics?.milestonePassRate || 0}% Qualified</span>
            <span className="text-amber-700 font-bold">{metrics?.unratedShops || 0} under audit</span>
          </div>
        </div>

        {/* Card 4: Statutory Schemes */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {language === 'hi' ? 'सत्यापित सरकारी योजनाएं' : 'Monitored Schemes'}
            </span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B2A4A]">
            {loading ? '...' : (metrics?.statutorySchemesCount || 19)}
          </div>
          <div className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            <span>PIB, MSME & myScheme feeds live</span>
          </div>
        </div>
      </div>

      {/* Credit & Underwriting Pulse Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1B2A4A]">
              {language === 'hi' ? 'ऋण पात्रता एवं ऑडिट प्रगति' : 'Credit Scoring & Audit Verification Distribution'}
            </h3>
            <p className="text-xs text-stone-500">
              {language === 'hi' 
                ? 'आरबीआई नायक समिति मानकों पर आधारित पारदर्शी 4-स्तंभ क्रेडिट वितरण' 
                : 'Pillar-based alternative underwriting for rural enterprises lacking formal CIBIL scores.'}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-mono font-semibold self-start sm:self-auto">
            Scale: 300 – 850
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-emerald-800">Prime (750+)</div>
            <div className="text-lg font-black text-emerald-900">Immediate Collateral-Free</div>
            <div className="text-[10px] text-emerald-700">MUDRA Tarun / Stand-Up Eligible</div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-blue-800">Creditworthy (650–749)</div>
            <div className="text-lg font-black text-blue-900">Standard Working Capital</div>
            <div className="text-[10px] text-blue-700">MUDRA Kishor / CGTMSE Backed</div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-amber-800">Developing (550–649)</div>
            <div className="text-lg font-black text-amber-900">Micro-Credit Linked</div>
            <div className="text-[10px] text-amber-700">MUDRA Shishu / PM Vishwakarma</div>
          </div>

          <div className="p-3 bg-stone-100/80 border border-stone-200 rounded-xl space-y-1">
            <div className="text-xs font-bold text-stone-700">Under Audit (&lt;50 Txs)</div>
            <div className="text-lg font-black text-stone-900">{metrics?.unratedShops || 0} Shops</div>
            <div className="text-[10px] text-stone-600">Pending 50-transaction verification</div>
          </div>
        </div>
      </div>

      {/* MSME Directory Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1B2A4A] flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>{language === 'hi' ? 'सूक्ष्म उद्यम पंजी (MSME Registry)' : 'Micro-Enterprise Master Registry'}</span>
            </h3>
            <p className="text-xs text-stone-500">
              {language === 'hi'
                ? `कुल ${totalShops} पंजीकृत उद्यमों की लाइव स्थिति एवं बही-खाता प्रगति`
                : `Live directory of all ${totalShops} registered enterprises with milestone metrics`}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'दुकान, मालिक या फोन खोजें...' : 'Search shop, owner, phone...'}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none"
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
              onChange={(e) => setSelectedMilestone(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none"
            >
              <option value="all">{language === 'hi' ? 'सभी ऑडिट स्थितियां' : 'All Milestones'}</option>
              <option value="scored">{language === 'hi' ? 'सत्यापित (50+ Txs)' : 'Scored (>=50 Txs)'}</option>
              <option value="unrated">{language === 'hi' ? 'समीक्षाधीन (<50 Txs)' : 'Under Audit (<50 Txs)'}</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto border border-stone-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3 px-3 sm:px-4">Enterprise & Owner</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">50-Tx Milestone</th>
                <th className="py-3 px-3 text-right">Logged Volume</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 sm:px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs font-medium text-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <span>Loading enterprise registry...</span>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No micro-enterprises match the current filters.
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-amber-50/40 transition">
                    {/* Name & Owner */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="font-bold text-[#1B2A4A] flex items-center gap-1.5">
                        <span>{shop.name}</span>
                        {shop.isDemo && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {shop.ownerName} • <span className="font-mono">{shop.phone || 'No phone'}</span>
                      </div>
                    </td>

                    {/* Trade Category */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-700 capitalize">
                        {shop.tradeType}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-[11px] text-stone-600">
                      <div>{shop.village ? `${shop.village}, ${shop.district}` : shop.district || 'Rural'}</div>
                      <div className="text-stone-400 text-[10px]">{shop.state}</div>
                    </td>

                    {/* Milestone Progress */}
                    <td className="py-3 px-3">
                      <div className="space-y-1 min-w-[110px]">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-stone-700">{shop.transactionCount} / 50</span>
                          <span className={shop.isScored ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                            {shop.progressPct}%
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${shop.isScored ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, shop.progressPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Logged Volume */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-800">
                      {formatCurrency(shop.transactionVolume)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {shop.isScored ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>सत्यापित (Scored)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>समीक्षाधीन</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectShop) onSelectShop(shop);
                          if (onNavigateTab) onNavigateTab('dossier');
                        }}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-[#1B2A4A] hover:text-white rounded-lg text-[11px] font-bold text-stone-700 transition flex items-center gap-1 ml-auto cursor-pointer"
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
      </div>
    </div>
  );
}
export default AdminDashboardPage;
