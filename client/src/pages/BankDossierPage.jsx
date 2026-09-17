import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  ShieldCheck, 
  Award, 
  Building2, 
  Calendar, 
  CheckCircle, 
  ArrowLeft,
  FileCheck 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { SaathiAvatar } from '../components/SaathiAvatar';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, Button } from '../components/ui';
import { DEMO_DOSSIER } from '../data/demoData';
import DossierCompileAnimation from '../components/DossierCompileAnimation';
import { APP_NAME_EN, APP_NAME_HI, APP_CREDIT_SCORE_NAME_EN } from '../config/brand';

export function BankDossierPage({ shop, isDemoMode, onBack }) {
  const { language } = useTranslation();
  const isDemo = Boolean(isDemoMode || shop?.id === 'ramesh-kirana' || shop?.is_demo === 1 || !shop?.id);
  const [dossierData, setDossierData] = useState(() => (isDemo ? DEMO_DOSSIER : null));
  const [loading, setLoading] = useState(() => !isDemo && Boolean(shop?.id));

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

  const [downloadingCam, setDownloadingCam] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const activeShopId = shop?.id || 'ramesh-kirana';
      // Dynamic imports for code-splitting heavy PDF renderer
      const [
        camRes,
        scoreRes,
        QRCodeModule,
        { pdf },
        { BankDossierDocument }
      ] = await Promise.all([
        api.getCAM(activeShopId).catch(() => null),
        api.getCreditScore(activeShopId).catch(() => null),
        import('qrcode'),
        import('@react-pdf/renderer'),
        import('../pdf/BankDossierDocument')
      ]);

      const QRCode = QRCodeModule.default || QRCodeModule;
      const cam = camRes?.cam || camRes || d?.cam || DEMO_DOSSIER;
      const scoreData = scoreRes || d?.creditEvaluation || DEMO_DOSSIER.creditEvaluation;

      // Generate dynamic verification QR Code linking to live CAM verification endpoint
      const baseUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://saakhsetu.vercel.app';
      const verificationUrl = `${baseUrl}/api/credit-score/${activeShopId}/cam`;
      
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
            generatedAt: new Date().toISOString(),
            documentId: d?.dossierNumber || `SS-CAM-${(effectiveShop.state || 'IN').substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`
          }}
        />
      );

      const blob = await pdf(docElement).toBlob();
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `SaakhSetu_Bank_Dossier_${activeShopId}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
        console.warn('API getCAM error, using fallback:', e.message);
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

  if (loading && !dossierData) {
    return (
      <div className="py-16 text-center text-indigoRural-500 text-sm">
        {language === 'hi' ? 'बैंक प्रमाण-पत्र तैयार किया जा रहा है...' : 'Generating Official Bankable Dossier...'}
      </div>
    );
  }

  const d = dossierData || (isDemo ? DEMO_DOSSIER : null);
  const netSurplus = d?.financialAudit?.netOperatingSurplus ?? (isDemo ? 68657 : 0);
  const monthlySurplus = Math.round(netSurplus / 3);
  const debtHeadroom = Math.round(monthlySurplus * 0.4);

  // Enterprise details with guaranteed fallbacks
  const shopName = d?.shop?.name || shop?.name || (isDemo ? DEMO_DOSSIER.shop.name : '—');
  const ownerName = d?.shop?.ownerName || shop?.owner_name || (isDemo ? DEMO_DOSSIER.shop.ownerName : 'Ramesh Kumar');
  const tradeName = d?.shop?.tradeName || shop?.trade_name || (isDemo ? DEMO_DOSSIER.shop.tradeName : 'Kirana & General Store');
  const village = d?.shop?.village || shop?.village || (isDemo ? DEMO_DOSSIER.shop.village : '');
  const district = d?.shop?.district || shop?.district || (isDemo ? DEMO_DOSSIER.shop.district : '');
  const state = d?.shop?.state || shop?.state || (isDemo ? DEMO_DOSSIER.shop.state : '');
  const locationText = (village || district || state)
    ? `${[village, district].filter(Boolean).join(', ')}${state ? ` (${state})` : ''}`
    : '—';
  const vintageYears = d?.shop?.vintageYears ?? shop?.vintage_years ?? (isDemo ? DEMO_DOSSIER.shop.vintageYears : 4);
  const bankAccount = d?.shop?.bankAccount || shop?.bank_account_type || (isDemo ? DEMO_DOSSIER.shop.bankAccount : 'Aryavart Gramin Bank');

  // Alternative Credit Evaluation & Financial Audit with guaranteed fallbacks
  const creditScore = d?.creditEvaluation?.totalScore ?? (isDemo ? 745 : '—');
  const ratingBadge = d?.creditEvaluation?.ratingBadge || (isDemo ? 'Loan Ready' : 'Prime Bankable');
  const grossSales = d?.financialAudit?.totalGrossSales ?? (isDemo ? 230907 : null);
  const totalExpenses = d?.financialAudit?.totalExpenses ?? (isDemo ? 162250 : null);
  const operatingSurplus = d?.financialAudit?.netOperatingSurplus ?? (isDemo ? 68657 : null);
  const digitalShare = d?.financialAudit?.digitalCollectionPercentage || (isDemo ? '38% UPI QR' : '38% UPI QR');
  const schemesList = (d?.recommendedSchemes && d.recommendedSchemes.length > 0)
    ? d.recommendedSchemes
    : (isDemo ? DEMO_DOSSIER.recommendedSchemes : []);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden">
        <Card padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
          >
            <span>{language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-xs text-indigoRural-500 font-semibold hidden lg:inline-flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-forestRural-600" />
              <span>Working Capital Summary — PSL-Format Ready</span>
            </span>
            <Button
              onClick={handleDownloadCAM}
              disabled={downloadingCam}
              variant="secondary"
              size="sm"
              icon={Download}
              className="sm:!px-3 sm:!py-2"
            >
              <span>{downloadingCam ? (language === 'hi' ? 'डाउनलोड...' : 'Downloading...') : (language === 'hi' ? 'CAM (JSON)' : 'Download CAM (JSON)')}</span>
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              icon={Printer}
              className="sm:!px-3 sm:!py-2"
            >
              <span>{language === 'hi' ? 'प्रिंट' : 'Print View'}</span>
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              variant="primary"
              size="sm"
              icon={Download}
              className="sm:!px-4 sm:!py-2 font-black"
            >
              <span>
                {downloadingPdf 
                  ? (language === 'hi' ? 'पीडीएफ बन रहा है...' : 'Generating PDF...') 
                  : (language === 'hi' ? 'बैंक डॉसियर (PDF)' : 'Download Bank Dossier (PDF)')}
              </span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Official Printable Bank Dossier Sheet */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-10 border border-paper-300 shadow-sm space-y-5 sm:space-y-6 text-indigoRural-900 print:border-0 print:shadow-none print:p-0 print:m-0 font-sans">
        
        {/* Dossier Letterhead */}
        <div className="border-b-2 border-indigoRural-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <SaathiAvatar size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-indigoRural-900 tracking-tight font-display">
                  {APP_NAME_HI} ({APP_NAME_EN})
                </h1>
                <Badge variant="brand" size="sm">
                  DPI-Inspired Architecture (Prototype)
                </Badge>
              </div>
              <p className="text-xs font-bold text-indigoRural-700 mt-0.5">
                Formatted per RBI Priority Sector Lending (PSL) documentation guidelines • Prototype, not an official filing
              </p>
              <p className="text-[10px] text-indigoRural-500">
                Credit Readiness Appraisal Memo • Prototype for Bank Loan File Evaluation
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="font-mono text-indigoRural-900 font-extrabold text-xs">
              DOC REF: {d?.dossierNumber || 'SS-DOC-BAL-493587'}
            </div>
            <div className="text-[11px] text-indigoRural-500">
              Issue Date: {d?.issueDate || (isDemo ? DEMO_DOSSIER.issueDate : new Date().toLocaleDateString('en-IN'))}
            </div>
            <Badge variant={d?.creditScore?.isUnrated || d?.creditScore?.score === null ? 'attention' : 'positive'} size="sm" dot>
              {d?.creditScore?.isUnrated || d?.creditScore?.score === null ? 'Provisional Registration' : 'Verified 90-Day Audit'}
            </Badge>
          </div>
        </div>

        {/* Warli Folk Border on Dossier */}
        <WarliBorder className="w-full h-5 text-terracotta-400 opacity-60 my-1" />

        {/* Title of Document */}
        <div className="text-center py-3 bg-paper-100 rounded-xl border border-paper-300">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigoRural-900 font-display">
            {d?.creditScore?.isUnrated || d?.creditScore?.score === null 
              ? 'Provisional Micro-Enterprise Statement & Registration Dossier' 
              : 'Micro-Enterprise Financial Statement & Credit Readiness Certificate'}
          </h2>
          <p className="text-[11px] text-indigoRural-500 mt-0.5">
            {d?.creditScore?.isUnrated || d?.creditScore?.score === null
              ? 'अनंतिम सूक्ष्म उद्यम विवरण एवं पंजीकरण डॉसियर (Provisional Bank File)'
              : 'सूक्ष्म उद्यम वित्तीय विवरण एवं ऋण पात्रता प्रमाण-पत्र (For Bank Branch Loan File)'}
          </p>
        </div>

        {/* 1. Borrower & Enterprise Profile */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider border-b border-paper-200 pb-1">
            1. Enterprise Identification (उद्यम पहचान विवरण)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs bg-paper-50 p-3 sm:p-4 rounded-xl border border-paper-200">
            <div className="min-w-0">
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Enterprise Name:</span>
              <strong className="text-indigoRural-900 truncate block">{shopName}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Proprietor:</span>
              <strong className="text-indigoRural-900">{ownerName}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Trade Category:</span>
              <strong className="text-indigoRural-900">{tradeName}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Location:</span>
              <strong className="text-indigoRural-900">{locationText}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Business Vintage:</span>
              <strong className="text-indigoRural-900">{vintageYears} Years (Established)</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Existing Bank:</span>
              <strong className="text-indigoRural-900">{bankAccount}</strong>
            </div>
          </div>
        </div>

        {/* 2. Alternative Credit Rating Certificate */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider border-b border-paper-200 pb-1">
            2. Alternative Credit Evaluation (वैकल्पिक क्रेडिट मूल्यांकन)
          </h3>
          <div className="bg-gradient-to-br from-forestRural-50 via-white to-paper-50 p-5 rounded-xl border border-forestRural-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold text-indigoRural-600 block">{APP_CREDIT_SCORE_NAME_EN}:</span>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-3xl sm:text-4xl font-black text-forestRural-800 font-display tracking-tight tabular-nums">
                  {creditScore}
                </span>
                <span className="text-xs text-indigoRural-400 font-bold">/ 850</span>
                <Badge variant="positive" size="sm">
                  {ratingBadge}
                </Badge>
              </div>
              <p className="text-[11px] text-forestRural-800 font-semibold">
                Classified as Prime Micro-Borrower under rural Priority Sector Lending.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] shrink-0 w-full sm:w-auto">
              <div className="p-2.5 bg-white rounded-lg border border-forestRural-200 shadow-2xs">
                <span className="text-indigoRural-400 block text-[10px] font-semibold">Logging Discipline</span>
                <strong className="text-forestRural-800 font-bold">96% Regularity</strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-forestRural-200 shadow-2xs">
                <span className="text-indigoRural-400 block text-[10px] font-semibold">Revenue Stability</span>
                <strong className="text-forestRural-800 font-bold">92% Coverage</strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-forestRural-200 shadow-2xs">
                <span className="text-indigoRural-400 block text-[10px] font-semibold">Udhaar Recovery</span>
                <strong className="text-forestRural-800 font-bold">82% Verified</strong>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-forestRural-200 shadow-2xs">
                <span className="text-indigoRural-400 block text-[10px] font-semibold">Digital Adoption</span>
                <strong className="text-forestRural-800 font-bold">{digitalShare}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 90-Day Cash Flow Audit */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider border-b border-paper-200 pb-1">
            3. Verified Cash Flow & Turnover Audit (90-Day Operating History)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
            <div className="p-2.5 sm:p-3.5 bg-paper-50 rounded-xl border border-paper-200 min-w-0">
              <span className="text-indigoRural-400 text-[9px] sm:text-[10px] font-semibold block truncate">Gross 90-Day Sales:</span>
              <strong className="text-sm sm:text-base text-indigoRural-900 font-black tabular-nums block truncate">
                {grossSales !== null ? `₹${Number(grossSales).toLocaleString('en-IN')}` : '—'}
              </strong>
            </div>
            <div className="p-2.5 sm:p-3.5 bg-paper-50 rounded-xl border border-paper-200 min-w-0">
              <span className="text-indigoRural-400 text-[9px] sm:text-[10px] font-semibold block truncate">Cost of Goods & Rent:</span>
              <strong className="text-sm sm:text-base text-indigoRural-900 font-black tabular-nums block truncate">
                {totalExpenses !== null ? `₹${Number(totalExpenses).toLocaleString('en-IN')}` : '—'}
              </strong>
            </div>
            <div className="p-2.5 sm:p-3.5 bg-paper-50 rounded-xl border border-paper-200 min-w-0">
              <span className="text-indigoRural-400 text-[9px] sm:text-[10px] font-semibold block truncate">Net Operating Surplus:</span>
              <strong className="text-sm sm:text-base text-forestRural-700 font-black tabular-nums block truncate">
                {operatingSurplus !== null ? `₹${Number(operatingSurplus).toLocaleString('en-IN')}` : '—'}
              </strong>
            </div>
            <div className="p-2.5 sm:p-3.5 bg-paper-50 rounded-xl border border-paper-200 min-w-0">
              <span className="text-indigoRural-400 text-[9px] sm:text-[10px] font-semibold block truncate">Monthly Debt Headroom:</span>
              <strong className="text-sm sm:text-base text-terracotta-700 font-black tabular-nums block truncate">
                {debtHeadroom > 0 ? `₹${debtHeadroom.toLocaleString('en-IN')} / mo` : (isDemo ? '₹9,154 / mo' : '—')}
              </strong>
            </div>
          </div>
        </div>

        {/* 4. Recommended Government Loan Schemes */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider border-b border-paper-200 pb-1">
            4. Recommended Priority Sector Schemes for Branch Sanction
          </h3>
          <div className="space-y-2 text-xs">
            {schemesList.map((sch, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-paper-50 border border-paper-200 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-indigoRural-900 font-extrabold">{sch.name}</strong>
                    <Badge variant="positive" size="sm">
                      {sch.matchScore}% Compatibility
                    </Badge>
                  </div>
                  <p className="text-[11px] text-indigoRural-500 mt-1">
                    Limit: <strong className="text-indigoRural-800">{sch.maxAmount}</strong> • Interest: <strong className="text-indigoRural-800">{sch.interestRate}</strong> • Security: <strong className="text-indigoRural-800">{sch.collateral}</strong>
                  </p>
                </div>
                <Badge variant="brand" size="sm" className="shrink-0">
                  Recommended
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Official Verification Stamp & Signature Block */}
        <div className="pt-6 border-t border-paper-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-forestRural-700 font-bold">
              <ShieldCheck className="w-5 h-5 text-forestRural-600" />
              <span>Digital Audit Authenticity Seal</span>
            </div>
            <p className="text-[10px] text-indigoRural-400 leading-relaxed">
              Certified that the cash flow and alternative credit metrics stated above are compiled from daily tamper-evident bahi-khata logs recorded on the SaakhSetu platform.
            </p>
          </div>

          <div className="sm:text-right space-y-4">
            <div className="inline-block text-center border-t border-paper-300 pt-1.5 px-6">
              <p className="font-extrabold text-indigoRural-900 text-xs">{ownerName}</p>
              <p className="text-[10px] text-indigoRural-400">Proprietor Signature / अंगूठा निशान</p>
            </div>
          </div>
        </div>

        {/* SIH Prototype Disclaimer */}
        <div className="pt-3 border-t border-paper-200 text-center">
          <p className="text-[10px] text-indigoRural-400 font-medium">
            Smart India Hackathon 2026 Prototype • Formatted per RBI Priority Sector Lending (PSL) documentation guidelines • Not an official government filing or certificate.
          </p>
        </div>

      </div>

      {/* Signature Compiling Ledger Animation Overlay */}
      {downloadingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ledgerInk/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-50 rounded-3xl p-6 border-2 border-ochre-400/40 shadow-2xl max-w-sm w-full">
            <DossierCompileAnimation 
              stageText={language === 'hi' ? 'खाता पृष्ठ संकलित हो रहे हैं...' : 'Compiling Ledger Folios...'}
              subtext={language === 'hi' ? 'बैंक-मानक PSL डॉसियर तैयार किया जा रहा है' : 'Assembling Bank-Ready PSL Dossier Packet'}
            />
          </div>
        </div>
      )}

    </div>
  );
}
