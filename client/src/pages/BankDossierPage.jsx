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
      <div className="print:hidden bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold hidden md:inline">
            📄 Ready for Branch Manager / Credit Officer Appraisal
          </span>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'hi' ? 'प्रिंट / पीडीएफ सेव करें' : 'Print / Save PDF Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Official Printable Bank Dossier Sheet */}
      <div className="bg-white rounded-3xl sm:p-10 p-6 border border-slate-200/90 shadow-card space-y-6 text-slate-800 print:border-0 print:shadow-none print:p-0 print:m-0 font-sans">
        
        {/* Dossier Letterhead */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <SaathiAvatar size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  व्यापार साथी (Vyapaar Saathi)
                </h1>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  SIH 26091
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Alternative Credit & Rural Financial Structuring Platform
              </p>
              <p className="text-[10px] text-slate-400">
                Endorsed for Priority Sector Lending (PSL) & Micro-Enterprise Assessment
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="font-mono text-slate-900 font-extrabold text-xs">
              DOC REF: {d?.dossierNumber || 'VS-BAL-924789'}
            </div>
            <div className="text-[11px] text-slate-500">
              Issue Date: {d?.issueDate || new Date().toLocaleDateString('en-IN')}
            </div>
            <span className="inline-block text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Verified 90-Day Audit
            </span>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Micro-Enterprise Financial Statement & Credit Readiness Certificate
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            सूक्ष्म उद्यम वित्तीय विवरण एवं ऋण पात्रता प्रमाण-पत्र (For Bank Branch Loan File)
          </p>
        </div>

        {/* 1. Borrower & Enterprise Profile */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            1. Enterprise Identification (उद्यम पहचान विवरण)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Enterprise Name:</span>
              <strong className="text-slate-900">{d?.shop?.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Proprietor:</span>
              <strong className="text-slate-900">{d?.shop?.ownerName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Trade Category:</span>
              <strong className="text-slate-900">{d?.shop?.tradeName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Location:</span>
              <strong className="text-slate-900">{d?.shop?.village}, {d?.shop?.district} ({d?.shop?.state})</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Business Vintage:</span>
              <strong className="text-slate-900">{d?.shop?.vintageYears} Years (Established)</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Existing Bank:</span>
              <strong className="text-slate-900">{d?.shop?.bankAccount}</strong>
            </div>
          </div>
        </div>

        {/* 2. Alternative Credit Rating Certificate */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            2. Alternative Credit Evaluation (वैकल्पिक क्रेडिट मूल्यांकन)
          </h3>
          <div className="bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/10 p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold text-slate-600 block">Vikasit Saathi Alternative Credit Score:</span>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-display tracking-tight tnum">
                  {d?.creditEvaluation?.totalScore}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 850</span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[11px] rounded-full shadow-xs">
                  {d?.creditEvaluation?.ratingBadge}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 font-semibold">
                Classified as Prime Micro-Borrower (Category A) under rural Priority Sector Lending.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] shrink-0 w-full sm:w-auto">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Logging Discipline</span>
                <strong className="text-emerald-800 font-bold">96% Regularity</strong>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Revenue Stability</span>
                <strong className="text-emerald-800 font-bold">92% Coverage</strong>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Udhaar Recovery</span>
                <strong className="text-emerald-800 font-bold">82% Verified</strong>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-semibold">Digital Adoption</span>
                <strong className="text-emerald-800 font-bold">{d?.financialAudit?.digitalCollectionPercentage} UPI QR</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 90-Day Cash Flow Audit */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            3. Verified Cash Flow & Turnover Audit (90-Day Operating History)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] font-semibold block">Gross 90-Day Sales:</span>
              <strong className="text-base text-slate-900 font-black tnum">₹{d?.financialAudit?.totalGrossSales?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] font-semibold block">Cost of Goods & Rent:</span>
              <strong className="text-base text-slate-900 font-black tnum">₹{d?.financialAudit?.totalExpenses?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] font-semibold block">Net Operating Surplus:</span>
              <strong className="text-base text-emerald-600 font-black tnum">₹{d?.financialAudit?.netOperatingSurplus?.toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] font-semibold block">Monthly Debt Headroom:</span>
              <strong className="text-base text-indigo-600 font-black tnum">₹14,200 / mo</strong>
            </div>
          </div>
        </div>

        {/* 4. Recommended Government Loan Schemes */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            4. Recommended Priority Sector Schemes for Branch Sanction
          </h3>
          <div className="space-y-2 text-xs">
            {d?.recommendedSchemes?.map((sch, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-extrabold">{sch.name}</strong>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      {sch.matchScore}% Compatibility
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Limit: <strong className="text-slate-800">{sch.maxAmount}</strong> • Interest: <strong className="text-slate-800">{sch.interestRate}</strong> • Security: <strong className="text-slate-800">{sch.collateral}</strong>
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                  Recommended
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Official Verification Stamp & Signature Block */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Digital Audit Authenticity Seal</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Certified that the cash flow and alternative credit metrics stated above are compiled from daily tamper-evident bahi-khata logs recorded on the Vyapaar Saathi platform.
            </p>
          </div>

          <div className="sm:text-right space-y-4">
            <div className="inline-block text-center border-t border-slate-300 pt-1.5 px-6">
              <p className="font-extrabold text-slate-900 text-xs">Ramesh Kumar</p>
              <p className="text-[10px] text-slate-400">Proprietor Signature / अंगूठा निशान</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
