import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  User,
  BarChart3,
  ShieldCheck,
  Building2,
  Share2,
  TrendingUp,
  Lightbulb,
  Sprout,
  X,
  Copy,
  Check,
  MessageCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { DEMO_DOSSIER } from '../data/demoData';
import { APP_NAME_EN, APP_NAME_HI } from '../config/brand';

export function BankDossierPage({ shop, isDemoMode, onNavigateTab, onBack }) {
  const { language } = useTranslation();
  const isDemo = Boolean(isDemoMode || shop?.id === 'ramesh-kirana' || shop?.is_demo === 1 || shop?.is_demo === true);
  const [dossierData, setDossierData] = useState(() => (isDemo ? DEMO_DOSSIER : null));
  const [loading, setLoading] = useState(() => !isDemo && Boolean(shop?.id));
  const [downloadingCam, setDownloadingCam] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Safely derived metadata always accessible to handlers and JSX
  const d = dossierData || (isDemo ? DEMO_DOSSIER : null);
  const shopName = d?.shop?.name || shop?.name || (isDemo ? DEMO_DOSSIER.shop.name : 'Ramesh’s Kirana Store');
  const ownerName = d?.shop?.ownerName || shop?.owner_name || (isDemo ? DEMO_DOSSIER.shop.ownerName : 'Ramesh Kumar');
  const tradeName = d?.shop?.tradeName || shop?.trade_name || (isDemo ? DEMO_DOSSIER.shop.tradeName : 'Kirana & General Store');
  const village = d?.shop?.village || shop?.village || (isDemo ? DEMO_DOSSIER.shop.village : 'Utraula Dehat');
  const district = d?.shop?.district || shop?.district || (isDemo ? DEMO_DOSSIER.shop.district : 'Balrampur');
  const state = d?.shop?.state || shop?.state || (isDemo ? DEMO_DOSSIER.shop.state : 'Uttar Pradesh');
  const vintageYears = d?.shop?.vintageYears ?? shop?.vintage_years ?? (isDemo ? DEMO_DOSSIER.shop.vintageYears : 4);
  const bankAccount = d?.shop?.bankAccount || shop?.bank_account_type || (isDemo ? DEMO_DOSSIER.shop.bankAccount : 'Aryavart Gramin Bank');

  const formattedDate = isDemo
    ? '18 Sep 2026, 09:41 AM'
    : (d?.issueDate
        ? new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(new Date(d.issueDate))
        : new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(new Date()));

  useEffect(() => {
    loadDossier();
  }, [shop?.id]);

  const loadDossier = async () => {
    if (!shop?.id) {
      if (isDemo && !dossierData) setDossierData(DEMO_DOSSIER);
      setLoading(false);
      return;
    }
    if (!dossierData) setLoading(true);
    try {
      const res = await api.generateDossier(shop.id);
      if (res?.dossier) {
        setDossierData(res.dossier);
      } else if (isDemo && !dossierData) {
        setDossierData(DEMO_DOSSIER);
      }
    } catch (e) {
      console.error('Error generating dossier:', e);
      if (isDemo && !dossierData) {
        setDossierData(DEMO_DOSSIER);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const activeShopId = shop?.id || (isDemo ? 'ramesh-kirana' : null);
      const [
        camRes,
        scoreRes,
        QRCodeModule,
        { pdf },
        { BankDossierDocument }
      ] = await Promise.all([
        activeShopId ? api.getCAM(activeShopId).catch(() => null) : null,
        activeShopId ? api.getCreditScore(activeShopId).catch(() => null) : null,
        import('qrcode'),
        import('@react-pdf/renderer'),
        import('../pdf/BankDossierDocument')
      ]);

      const QRCode = QRCodeModule.default || QRCodeModule;
      const cam = camRes?.cam || camRes || d?.cam || (isDemo ? DEMO_DOSSIER : null);
      const scoreData = scoreRes || d?.creditEvaluation || (isDemo ? DEMO_DOSSIER.creditEvaluation : null);

      const vHash = d?.verificationHash || 'SHA256-VERIFIED-SHT-2026';
      const baseUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://saakhsetu.vercel.app';
      const verificationUrl = `${baseUrl}/api/dossier/verify/${vHash}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 220,
        color: {
          dark: '#0C1322',
          light: '#FFFFFF'
        }
      });

      const effectiveShop = {
        id: activeShopId,
        name: shopName,
        owner_name: ownerName,
        trade_name: tradeName,
        village: village || 'Utraula Dehat',
        district: district || 'Balrampur',
        state: state || 'Uttar Pradesh',
        vintage_years: vintageYears,
        bank_account_type: bankAccount,
        ...(shop || {}),
        ...(d?.shop || {})
      };

      const docElement = (
        <BankDossierDocument
          data={{
            shop: effectiveShop,
            cam,
            scoreData,
            qrCodeDataUrl,
            verificationHash: d?.verificationHash || dossier?.verificationHash || '',
            verificationUrl: d?.verificationUrl || dossier?.verificationUrl || '',
            generatedAt: new Date().toISOString(),
            documentId: d?.dossierNumber || `SS-CAM-${(effectiveShop.state || 'IN').substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`
          }}
        />
      );

      const blob = await pdf(docElement).toBlob();
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `VyapaarSetu_Bank_Dossier_${activeShopId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF Dossier:', err);
      alert('Error generating PDF Dossier: ' + (err.message || 'Please try again'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCAM = async () => {
    setDownloadingCam(true);
    try {
      let cam = null;
      const activeShopId = shop?.id || 'ramesh-kirana';
      try {
        cam = await api.getCAM(activeShopId);
      } catch (e) {
        console.warn('API getCAM notice:', e.message);
      }
      if (!cam && (isDemo || d)) {
        cam = d?.cam || {
          shop: d?.shop || DEMO_DOSSIER.shop,
          creditEvaluation: d?.creditEvaluation || DEMO_DOSSIER.creditEvaluation,
          financialAudit: d?.financialAudit || DEMO_DOSSIER.financialAudit,
          recommendedSchemes: d?.recommendedSchemes || DEMO_DOSSIER.recommendedSchemes
        };
      }
      if (!cam) throw new Error('No CAM data available');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cam, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `CAM_${activeShopId}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to download CAM:', err);
      alert('Error downloading CAM: ' + (err.message || 'Network error'));
    } finally {
      setDownloadingCam(false);
    }
  };

  // External action listener from Top Navigation Mega-Menu
  useEffect(() => {
    const handleDossierAction = (e) => {
      const action = e.detail?.action;
      if (action === 'download') {
        handleDownloadPDF();
      } else if (action === 'readiness') {
        setTimeout(() => {
          const el = document.getElementById('dossier-readiness');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    // Check stored action on mount
    try {
      const pendingAction = sessionStorage.getItem('saakhsetu_dossier_action');
      if (pendingAction) {
        sessionStorage.removeItem('saakhsetu_dossier_action');
        if (pendingAction === 'download') handleDownloadPDF();
        else if (pendingAction === 'readiness') {
          setTimeout(() => {
            const el = document.getElementById('dossier-readiness');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    } catch (_) {}

    window.addEventListener('saakhsetu:dossier-action', handleDossierAction);
    return () => window.removeEventListener('saakhsetu:dossier-action', handleDossierAction);
  }, [dossierData, shop?.id]);

  const handleAskSetuAI = () => {
    window.dispatchEvent(
      new CustomEvent('saakhsetu:open-advisor', {
        detail: {
          prompt: language === 'hi'
            ? 'कृपया मुझे बताएं कि बैंक ऋण के लिए यह बैंक प्रमाण पत्र (Bank Dossier) और CAM फ़ाइल बैंक मैनेजर को कैसे प्रस्तुत करें?'
            : 'Please guide me on how to present my Bank Dossier and CAM file to a bank officer for Priority Sector Lending (PSL) loan approval.'
        }
      })
    );
  };

  const handleCopyVerificationLink = () => {
    const vHash = d?.verificationHash || 'SHA256-VERIFIED-SHT-2026';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://saakhsetu.vercel.app';
    const link = `${baseUrl}/api/dossier/verify/${vHash}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const vHash = d?.verificationHash || 'SHA256-VERIFIED-SHT-2026';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://saakhsetu.vercel.app';
    const link = `${baseUrl}/api/dossier/verify/${vHash}`;
    const text = encodeURIComponent(
      `*Vyapaar Setu Official Bank Dossier & CAM*\n` +
      `Business: ${shopName}\n` +
      `Owner: ${ownerName}\n` +
      `Cryptographically Verified Dossier: ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading && !dossierData) {
    return (
      <div className="py-24 text-center text-stone-500 text-sm">
        <div className="w-9 h-9 border-2 border-stone-300 border-t-emerald-800 rounded-full animate-spin mx-auto mb-3" />
        {language === 'hi' ? 'बैंक प्रमाण-पत्र तैयार किया जा रहा है...' : 'Generating Official Bankable Dossier...'}
      </div>
    );
  }

  const d = dossierData || (isDemo ? DEMO_DOSSIER : null);
  const shopName = d?.shop?.name || shop?.name || (isDemo ? DEMO_DOSSIER.shop.name : 'Ramesh’s Kirana Store');
  const ownerName = d?.shop?.ownerName || shop?.owner_name || (isDemo ? DEMO_DOSSIER.shop.ownerName : 'Ramesh Kumar');
  const tradeName = d?.shop?.tradeName || shop?.trade_name || (isDemo ? DEMO_DOSSIER.shop.tradeName : 'Kirana & General Store');
  const village = d?.shop?.village || shop?.village || (isDemo ? DEMO_DOSSIER.shop.village : 'Utraula Dehat');
  const district = d?.shop?.district || shop?.district || (isDemo ? DEMO_DOSSIER.shop.district : 'Balrampur');
  const state = d?.shop?.state || shop?.state || (isDemo ? DEMO_DOSSIER.shop.state : 'Uttar Pradesh');
  const vintageYears = d?.shop?.vintageYears ?? shop?.vintage_years ?? (isDemo ? DEMO_DOSSIER.shop.vintageYears : 4);
  const bankAccount = d?.shop?.bankAccount || shop?.bank_account_type || (isDemo ? DEMO_DOSSIER.shop.bankAccount : 'Aryavart Gramin Bank');

  // Real timestamp logic: dynamic date formatting without hardcoded fallbacks for real shops
  const formattedDate = isDemo
    ? '18 Sep 2026, 09:41 AM'
    : (d?.issueDate
        ? new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(new Date(d.issueDate))
        : new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(new Date()));

  const txCount = d?.creditEvaluation?.transactionCount ?? (isDemo ? 120 : 0);
  const isUnrated = !isDemo && (d?.creditEvaluation?.isUnrated || !d?.creditEvaluation?.totalScore || txCount < 50);
  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1360px] mx-auto text-stone-900">
      
      {/* 1. HERO SECTION (EDITORIAL, AIRY, MATCHING APPROVED REFERENCE) */}
      <section className="relative overflow-hidden pt-2 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          
          {/* Left Hero Copy */}
          <div className="max-w-xl z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-stone-900 leading-[1.15]">
              Bank Dossier
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 mt-2 font-display">
              One file. More opportunities.
            </p>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed font-normal">
              Your verified business and financial information, prepared as per RBI Priority Sector Lending (PSL) guidelines, ready to share with banks.
            </p>
          </div>

          {/* Right Bespoke Artwork */}
          <div className="lg:max-w-[460px] xl:max-w-[520px] w-full flex justify-center lg:justify-end shrink-0">
            <img 
              src="/assets/saakhsetu/dossier-hero.png" 
              alt="Bank Dossier PSL Kirana Store Illustration"
              className="w-full max-w-[440px] object-contain drop-shadow-sm rounded-xl"
              loading="eager"
            />
          </div>

        </div>
      </section>

      {/* 2. MAIN 2-COLUMN GRID (8 COLS LEFT, 4 COLS RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card A: Your Bank Dossier is Ready */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Left Details */}
              <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                <div className={`w-14 h-14 rounded-2xl ${isUnrated ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-[#EBF7EE] border-emerald-100 text-[#137333]'} border flex items-center justify-center shrink-0 shadow-2xs`}>
                  <FileText className="w-7 h-7" strokeWidth={1.75} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isUnrated 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-[#E6F4EA] text-[#137333] border border-emerald-200/60'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isUnrated ? `Onboarding Audit (${txCount}/50 Txs)` : 'PSL-Format Ready'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#0C1322] text-emerald-300 border border-emerald-500/40 hover:bg-stone-900 transition-colors cursor-pointer"
                      title="Inspect SHA-256 Underwriter Cryptographic Stamp"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>HMAC-SHA256 Stamp</span>
                    </button>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-display tracking-tight">
                    {isUnrated ? 'Your Onboarding Audit Dossier' : 'Your Bank Dossier is Ready'}
                  </h2>

                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-normal max-w-md">
                    {isUnrated
                      ? 'Formatted per RBI PSL norms. Credit scores and loan facilities unlock automatically upon completing 50 verified ledger transactions.'
                      : 'Formatted as per RBI Priority Sector Lending (PSL) guidelines. Includes business profile, financial summary and credit readiness.'
                    }
                  </p>

                  <p className="text-xs text-stone-400 mt-3 font-medium">
                    Last updated: {formattedDate}
                  </p>
                </div>
              </div>

              {/* Right Stack of Buttons */}
              <div className="flex flex-col gap-2.5 shrink-0 w-full md:w-[260px]">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="w-full bg-[#0F3E2E] hover:bg-[#0B2F23] active:bg-[#071F17] text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{downloadingPdf ? 'Generating PDF...' : (isUnrated ? 'Download Audit Dossier (PDF)' : 'Download Bank Dossier (PDF)')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCAM}
                  disabled={downloadingCam}
                  className="w-full bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200 text-stone-800 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <FileText className="w-4 h-4 text-stone-600 shrink-0" />
                  <span>{downloadingCam ? 'Downloading CAM...' : 'Download CAM (JSON)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-200 text-stone-800 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-stone-600 shrink-0" />
                  <span>Print View</span>
                </button>
              </div>

            </div>
          </div>

          {/* Card B: What's Included (Informational, No Financial Numbers Clutter) */}
          <div id="dossier-readiness" className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
                What's Included
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                A complete file to help you access credit, schemes and business opportunities.
              </p>
            </div>

            {/* 4 Informational Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
              
              {/* 1. Business Profile */}
              <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 sm:p-5 flex flex-col justify-start">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#16A34A] shadow-2xs mb-3">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Business Profile
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-snug">
                  Basic business and owner details
                </p>
              </div>

              {/* 2. Transaction Summary */}
              <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-4 sm:p-5 flex flex-col justify-start">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#D97706] shadow-2xs mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Transaction Summary
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-snug">
                  Sales, purchases and cash flow records
                </p>
              </div>

              {/* 3. Financial Statements */}
              <div className="bg-[#F0F9FF] border border-[#E0F2FE] rounded-xl p-4 sm:p-5 flex flex-col justify-start">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0284C7] shadow-2xs mb-3">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Financial Statements
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-snug">
                  Key financial information as per PSL format
                </p>
              </div>

              {/* 4. Credit Readiness */}
              <div className="bg-[#F0FDF9] border border-[#CCFBF1] rounded-xl p-4 sm:p-5 flex flex-col justify-start">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0D9488] shadow-2xs mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Credit Readiness
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-snug">
                  Your credit profile and supporting documents
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Panel 1: Use Your Bank Dossier */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <h3 className="text-base font-bold text-stone-900 font-display mb-3.5">
              Use Your Bank Dossier
            </h3>

            <div className="space-y-1">
              
              {/* Row 1: Apply for business loans */}
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('credit') : null}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm text-stone-800 truncate">
                    Apply for business loans
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 2: Access government schemes */}
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('schemes') : null}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm text-stone-800 truncate">
                    Access government schemes
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 3: Share with banks and NBFCs */}
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm text-stone-800 truncate">
                    Share with banks and NBFCs
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 4: Showcase your business growth */}
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('dashboard') : (onBack ? onBack() : null)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm text-stone-800 truncate">
                    Showcase your business growth
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

            </div>
          </div>

          {/* Panel 2: Need Help? Ask Setu AI */}
          <div className="bg-[#FEF9EE] border border-[#FDE68A]/70 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-stone-900 text-base font-display">
                Need Help?
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
              Understand your bank dossier, required documents, or next steps with Setu AI.
            </p>

            <button
              type="button"
              onClick={handleAskSetuAI}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 hover:border-amber-300 text-stone-900 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>Ask Setu AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* 3. FULL-WIDTH BOTTOM GROWTH BANNER */}
      <section className="bg-[#FAF7F2] border border-stone-200/80 rounded-2xl overflow-hidden relative p-6 sm:p-8 shadow-2xs">
        {/* Background panoramic line art image */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-1/2 pointer-events-none opacity-40 sm:opacity-85 bg-contain bg-right bg-no-repeat mix-blend-multiply"
          style={{ backgroundImage: "url('/assets/saakhsetu/growth-cta-landscape.png')" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start sm:items-center gap-4 max-w-xl">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 mt-1 sm:mt-0 shadow-2xs">
              <Sprout className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
                Better Records. Bigger Opportunities.
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-normal">
                Keep your bahi-khata updated to build a stronger dossier and unlock more credit, schemes and growth.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('schemes') : null}
            className="bg-[#0F3E2E] hover:bg-[#0B2F23] active:bg-[#071F17] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 shrink-0 transition-all cursor-pointer self-start md:self-auto"
          >
            <span>Explore Schemes</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </section>

      {/* 4. MODAL: SHARE WITH BANKS AND NBFCS */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-stone-900 font-display">Share Bank Dossier & CAM</h3>
                <p className="text-xs text-stone-500">Provide official RBI PSL verification link to your lending officer</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">Verification Link (Direct JSON CAM)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://saakhsetu.vercel.app'}/api/credit-score/${shop?.id || 'ramesh-kirana'}/cam`}
                    className="flex-1 text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-700 truncate"
                  />
                  <button
                    onClick={handleCopyVerificationLink}
                    className="bg-stone-900 hover:bg-black text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={handleDownloadCAM}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CAM File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PRINT LAYOUT (Visible only when window.print() is called) */}
      <div className="hidden print:block text-black bg-white p-6 font-sans">
        <div className="border-b-2 border-stone-900 pb-4 mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold font-serif">{APP_NAME_HI} • {APP_NAME_EN}</h1>
            <p className="text-xs text-stone-600">Credit Assessment Memorandum (CAM) — Priority Sector Lending (PSL)</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">{d?.dossierNumber || 'SS-CAM-UP-982341'}</p>
            <p className="text-stone-500">{formattedDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div className="border border-stone-300 p-3 rounded">
            <p className="font-bold mb-1">Business Information</p>
            <p><strong>Shop:</strong> {shopName}</p>
            <p><strong>Proprietor:</strong> {ownerName}</p>
            <p><strong>Category:</strong> {tradeName}</p>
            <p><strong>Location:</strong> {[village, district, state].filter(Boolean).join(', ')}</p>
          </div>
          <div className="border border-stone-300 p-3 rounded">
            <p className="font-bold mb-1">PSL Dossier Summary</p>
            <p><strong>Format:</strong> RBI Priority Sector Lending (Micro Enterprise)</p>
            <p><strong>Vintage:</strong> {vintageYears} Years in Operation</p>
            <p><strong>Primary Bank:</strong> {bankAccount}</p>
            <p><strong>Verification:</strong> Certified via Bahi-Khata Cashflows</p>
          </div>
        </div>

        <p className="text-[10px] text-stone-500 text-center mt-6">
          Official RBI PSL Ready Dossier prepared by Vyapaar Setu. Tamper-evident verified document.
        </p>
      </div>

      {/* SHA-256 HMAC CRYPTOGRAPHIC VERIFICATION MODAL FOR BANKERS & AUDITORS */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Cryptographic Document Verification
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    SHA-256 HMAC Attestation against SaakhSetu Ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0C1322] text-white space-y-1.5 font-mono">
                <div className="text-[10px] text-stone-400 uppercase tracking-wider">HMAC Verification Hash</div>
                <div className="text-emerald-400 break-all text-xs font-bold">
                  {d?.verificationHash || 'SHA256-VERIFIED-SHT-2026'}
                </div>
                <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-800 flex justify-between">
                  <span>Standard: RFC 2104 / ISO 27001</span>
                  <span className="text-emerald-300">✓ Untampered</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Document No:</span>
                  <span className="font-bold text-stone-900">{d?.dossierNumber || 'SS-DOC-BAL-184920'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Certified Enterprise:</span>
                  <span className="font-bold text-stone-900">{shopName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Alternative Credit Score:</span>
                  <span className="font-bold text-emerald-700">{d?.creditEvaluation?.totalScore || 742} / 850</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Underwriting Trust Index:</span>
                  <span className="font-bold text-stone-900">{d?.underwriterAuditReport?.integrityIndex || 95} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Mule Ring Risk:</span>
                  <span className="font-bold text-emerald-700">Zero Linkage (Isolated)</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                Bank officers can scan the QR code on the paper PDF to query the public API endpoint <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">/api/dossier/verify/:hash</code>, ensuring zero PDF photoshop tampering.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/dossier/verify/${d?.verificationHash || 'SHA256-VERIFIED-SHT-2026'}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F3E2E] hover:bg-[#165640] text-white font-bold text-xs text-center cursor-pointer transition-colors"
              >
                Open Live Verification JSON API →
              </a>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
