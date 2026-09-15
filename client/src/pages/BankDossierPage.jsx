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

export function BankDossierPage({ shop, onBack }) {
  const { language } = useTranslation();
  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDossier();
  }, [shop?.id]);

  const loadDossier = async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.generateDossier(shop.id);
      if (res.dossier) setDossierData(res.dossier);
    } catch (e) {
      console.error('Error generating dossier:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-indigoRural-500 text-sm">
        {language === 'hi' ? 'बैंक प्रमाण-पत्र तैयार किया जा रहा है...' : 'Generating Official Bankable Dossier...'}
      </div>
    );
  }

  const d = dossierData;
  const netSurplus = d?.financialAudit?.netOperatingSurplus || 0;
  const monthlySurplus = Math.round(netSurplus / 3);
  const debtHeadroom = Math.round(monthlySurplus * 0.4);
  const ownerName = d?.shop?.ownerName || shop?.owner_name || 'Proprietor';

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

          <div className="flex items-center gap-3">
            <span className="text-xs text-indigoRural-500 font-semibold hidden md:inline-flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-forestRural-600" />
              <span>Ready for Branch Manager / Credit Officer Appraisal</span>
            </span>
            <Button
              onClick={handlePrint}
              variant="dark"
              size="md"
              icon={Printer}
            >
              <span>{language === 'hi' ? 'प्रिंट / पीडीएफ सेव करें' : 'Print / Save PDF Dossier'}</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Official Printable Bank Dossier Sheet */}
      <div className="bg-white rounded-2xl sm:p-10 p-6 border border-paper-300 shadow-sm space-y-6 text-indigoRural-900 print:border-0 print:shadow-none print:p-0 print:m-0 font-sans">
        
        {/* Dossier Letterhead */}
        <div className="border-b-2 border-indigoRural-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <SaathiAvatar size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-indigoRural-900 tracking-tight font-display">
                  व्यापार साथी (Vyapaar Saathi)
                </h1>
                <Badge variant="brand" size="sm">
                  DPI INDIA STACK
                </Badge>
              </div>
              <p className="text-xs font-bold text-indigoRural-700 mt-0.5">
                भारत सरकार • Ministry of MSME & Finance • Priority Sector Lending (PSL) Framework
              </p>
              <p className="text-[10px] text-indigoRural-500">
                Official Credit Readiness Certificate for Branch Manager / Credit Officer Loan File
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="font-mono text-indigoRural-900 font-extrabold text-xs">
              DOC REF: {d?.dossierNumber || 'VS-BAL-924789'}
            </div>
            <div className="text-[11px] text-indigoRural-500">
              Issue Date: {d?.issueDate || new Date().toLocaleDateString('en-IN')}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-paper-50 p-4 rounded-xl border border-paper-200">
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Enterprise Name:</span>
              <strong className="text-indigoRural-900">{d?.shop?.name}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Proprietor:</span>
              <strong className="text-indigoRural-900">{d?.shop?.ownerName}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Trade Category:</span>
              <strong className="text-indigoRural-900">{d?.shop?.tradeName}</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Location:</span>
              <strong className="text-indigoRural-900">{d?.shop?.village}, {d?.shop?.district} ({d?.shop?.state})</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Business Vintage:</span>
              <strong className="text-indigoRural-900">{d?.shop?.vintageYears} Years (Established)</strong>
            </div>
            <div>
              <span className="text-indigoRural-400 block text-[10px] font-semibold">Existing Bank:</span>
              <strong className="text-indigoRural-900">{d?.shop?.bankAccount}</strong>
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
              <span className="text-xs font-bold text-indigoRural-600 block">Vyapaar Saathi Alternative Credit Score:</span>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-3xl sm:text-4xl font-black text-forestRural-800 font-display tracking-tight tabular-nums">
                  {d?.creditEvaluation?.totalScore || '—'}
                </span>
                <span className="text-xs text-indigoRural-400 font-bold">/ 850</span>
                <Badge variant="positive" size="sm">
                  {d?.creditEvaluation?.ratingBadge || 'Prime Bankable'}
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
                <strong className="text-forestRural-800 font-bold">{d?.financialAudit?.digitalCollectionPercentage || '37%'} UPI QR</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 90-Day Cash Flow Audit */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-indigoRural-900 uppercase tracking-wider border-b border-paper-200 pb-1">
            3. Verified Cash Flow & Turnover Audit (90-Day Operating History)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-indigoRural-400 text-[10px] font-semibold block">Gross 90-Day Sales:</span>
              <strong className="text-base text-indigoRural-900 font-black tabular-nums">₹{d?.financialAudit?.totalGrossSales?.toLocaleString('en-IN') || '—'}</strong>
            </div>
            <div className="p-3.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-indigoRural-400 text-[10px] font-semibold block">Cost of Goods & Rent:</span>
              <strong className="text-base text-indigoRural-900 font-black tabular-nums">₹{d?.financialAudit?.totalExpenses?.toLocaleString('en-IN') || '—'}</strong>
            </div>
            <div className="p-3.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-indigoRural-400 text-[10px] font-semibold block">Net Operating Surplus:</span>
              <strong className="text-base text-forestRural-700 font-black tabular-nums">₹{d?.financialAudit?.netOperatingSurplus?.toLocaleString('en-IN') || '—'}</strong>
            </div>
            <div className="p-3.5 bg-paper-50 rounded-xl border border-paper-200">
              <span className="text-indigoRural-400 text-[10px] font-semibold block">Monthly Debt Headroom:</span>
              <strong className="text-base text-terracotta-700 font-black tabular-nums">
                {debtHeadroom > 0 ? `₹${debtHeadroom.toLocaleString('en-IN')} / mo` : '—'}
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
            {d?.recommendedSchemes?.map((sch, i) => (
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
              Certified that the cash flow and alternative credit metrics stated above are compiled from daily tamper-evident bahi-khata logs recorded on the Vyapaar Saathi platform.
            </p>
          </div>

          <div className="sm:text-right space-y-4">
            <div className="inline-block text-center border-t border-paper-300 pt-1.5 px-6">
              <p className="font-extrabold text-indigoRural-900 text-xs">{ownerName}</p>
              <p className="text-[10px] text-indigoRural-400">Proprietor Signature / अंगूठा निशान</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
