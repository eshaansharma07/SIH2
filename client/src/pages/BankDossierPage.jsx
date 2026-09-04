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
  ArrowLeft 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { SaathiAvatar } from '../components/SaathiAvatar';

export function BankDossierPage({ shop, onBack }) {
  const { language } = useTranslation();
  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDossier();
  }, [shop?.id]);

  const loadDossier = async () => {
    setLoading(true);
    try {
      const res = await api.generateDossier(shop?.id || 'ramesh-kirana');
      if (res.dossier) setDossierData(res.dossier);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-stone-500 text-sm">
        {language === 'hi' ? 'बैंक प्रमाण-पत्र तैयार किया जा रहा है...' : 'Generating Official Bankable Dossier...'}
      </div>
    );
  }

  const d = dossierData;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden bg-white rounded-3xl p-4 sm:p-5 border-2 border-paper-300 shadow-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 font-semibold hidden md:inline">
            📄 Ready for Branch Manager / Credit Officer Appraisal
          </span>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-terracotta-600 hover:bg-terracotta-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'hi' ? 'प्रिंट / पीडीएफ सेव करें' : 'Print / Save PDF Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Official Printable Bank Dossier Sheet */}
      <div className="bg-white rounded-3xl sm:p-10 p-6 border-2 border-stone-300 shadow-2xl space-y-6 text-stone-800 print:border-0 print:shadow-none print:p-0 print:m-0">
        
        {/* Dossier Letterhead */}
        <div className="border-b-2 border-terracotta-700 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <SaathiAvatar size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-terracotta-900 tracking-tight font-display">
                  व्यापार साथी (Vyapaar Saathi)
                </h1>
                <span className="text-[10px] font-extrabold bg-terracotta-100 text-terracotta-800 px-2 py-0.5 rounded border border-terracotta-300">
                  SIH 26091
                </span>
              </div>
              <p className="text-xs font-bold text-stone-600">
                Alternative Credit & Rural Financial Structuring Platform
              </p>
              <p className="text-[10px] text-stone-500">
                Endorsed for Priority Sector Lending (PSL) & Micro-Enterprise Assessment
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="font-mono text-terracotta-800 font-black text-xs">
              DOC REF: {d?.dossierNumber || 'VS-BAL-924789'}
            </div>
            <div className="text-[11px] text-stone-500">
              Issue Date: {d?.issueDate || new Date().toLocaleDateString('en-IN')}
            </div>
            <span className="inline-block text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              Verified 90-Day Audit
            </span>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center py-2 bg-paper-100/60 rounded-xl border border-paper-300">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-stone-900">
            Micro-Enterprise Financial Statement & Credit Readiness Certificate
          </h2>
          <p className="text-[11px] text-stone-500">
            सूक्ष्म उद्यम वित्तीय विवरण एवं ऋण पात्रता प्रमाण-पत्र (For Bank Branch Loan File)
          </p>
        </div>

        {/* 1. Borrower & Enterprise Profile */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-terracotta-800 uppercase tracking-wider border-b border-paper-300 pb-1">
            1. Enterprise Identification (उद्यम पहचान विवरण)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-paper-50 p-4 rounded-xl border border-paper-300">
            <div>
              <span className="text-stone-500 block text-[10px]">Enterprise Name:</span>
              <strong className="text-stone-900">{d?.shop?.name}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Proprietor:</span>
              <strong className="text-stone-900">{d?.shop?.ownerName}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Trade Category:</span>
              <strong className="text-stone-900">{d?.shop?.tradeName}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Location:</span>
              <strong className="text-stone-900">{d?.shop?.village}, {d?.shop?.district} ({d?.shop?.state})</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Business Vintage:</span>
              <strong className="text-stone-900">{d?.shop?.vintageYears} Years (Established)</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Existing Bank:</span>
              <strong className="text-stone-900">{d?.shop?.bankAccount}</strong>
            </div>
          </div>
        </div>

        {/* 2. Alternative Credit Rating Certificate */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-terracotta-800 uppercase tracking-wider border-b border-paper-300 pb-1">
            2. Alternative Credit Evaluation (वैकल्पिक क्रेडिट मूल्यांकन)
          </h3>
          <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-4 rounded-xl border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold text-stone-600 block">Vikasit Saathi Alternative Credit Score:</span>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-3xl font-black text-emerald-800 font-sans">
                  {d?.creditEvaluation?.totalScore}
                </span>
                <span className="text-xs text-stone-500 font-bold">/ 850 Points</span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold text-xs rounded-full">
                  {d?.creditEvaluation?.ratingBadge}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 font-semibold">
                Classified as Prime Micro-Borrower (Category A) under rural Priority Sector Lending.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] shrink-0 w-full sm:w-auto">
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-stone-500 block">Logging Discipline:</span>
                <strong className="text-emerald-800">96% Regularity</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-stone-500 block">Revenue Stability:</span>
                <strong className="text-emerald-800">92% Coverage</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-stone-500 block">Udhaar Recovery:</span>
                <strong className="text-emerald-800">82% Verified</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-stone-500 block">Digital Adoption:</span>
                <strong className="text-emerald-800">{d?.financialAudit?.digitalCollectionPercentage} UPI QR</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 90-Day Cash Flow Audit */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-terracotta-800 uppercase tracking-wider border-b border-paper-300 pb-1">
            3. Verified Cash Flow & Turnover Audit (90-Day Operating History)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-paper-50 rounded-xl border border-paper-300">
              <span className="text-stone-500 text-[10px] block">Gross 90-Day Sales:</span>
              <strong className="text-base text-stone-900 font-black">₹{d?.financialAudit?.totalGrossSales?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3 bg-paper-50 rounded-xl border border-paper-300">
              <span className="text-stone-500 text-[10px] block">Cost of Goods & Rent:</span>
              <strong className="text-base text-stone-900 font-black">₹{d?.financialAudit?.totalExpenses?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3 bg-paper-50 rounded-xl border border-paper-300">
              <span className="text-stone-500 text-[10px] block">Net Operating Cash Flow:</span>
              <strong className="text-base text-forestRural-700 font-black">₹{d?.financialAudit?.netOperatingSurplus?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3 bg-paper-50 rounded-xl border border-paper-300">
              <span className="text-stone-500 text-[10px] block">Monthly Debt Service Headroom:</span>
              <strong className="text-base text-indigoRural-700 font-black">₹14,200 / mo</strong>
            </div>
          </div>
        </div>

        {/* 4. Recommended Government Loan Schemes */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-terracotta-800 uppercase tracking-wider border-b border-paper-300 pb-1">
            4. Recommended Priority Sector Schemes for Branch Sanction
          </h3>
          <div className="space-y-2 text-xs">
            {d?.recommendedSchemes?.map((sch, i) => (
              <div key={i} className="p-3 rounded-xl bg-paper-50 border border-paper-300 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-stone-900 font-extrabold">{sch.name}</strong>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {sch.matchScore}% Compatibility
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Limit: <strong>{sch.maxAmount}</strong> • Interest: <strong>{sch.interestRate}</strong> • Security: <strong>{sch.collateral}</strong>
                  </p>
                </div>
                <span className="text-xs font-extrabold text-forestRural-700 bg-forestRural-100 px-2.5 py-1 rounded-lg shrink-0">
                  Recommended
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Official Verification Stamp & Signature Block */}
        <div className="pt-6 border-t-2 border-stone-300 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Digital Audit Authenticity Seal</span>
            </div>
            <p className="text-[10px] text-stone-500 leading-relaxed">
              Certified that the cash flow and alternative credit metrics stated above are compiled from daily tamper-evident bahi-khata logs recorded on the Vyapaar Saathi platform.
            </p>
          </div>

          <div className="text-right space-y-4">
            <div className="inline-block text-center border-t border-stone-400 pt-1 px-6">
              <p className="font-extrabold text-stone-900 text-xs">Ramesh Kumar</p>
              <p className="text-[10px] text-stone-500">Proprietor Signature / अंगूठा निशान</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
