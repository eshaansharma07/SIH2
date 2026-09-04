import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  Search, 
  ExternalLink, 
  Award, 
  FileCheck, 
  Sparkles, 
  Filter 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';

export function SchemeMatcherPage({ shop, onNavigateTab }) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('matched'); // 'matched' or 'library'
  const [matchedData, setMatchedData] = useState(null);
  const [allSchemes, setAllSchemes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSchemeId, setExpandedSchemeId] = useState('mudra-kishor');

  useEffect(() => {
    loadSchemes();
  }, [shop?.id]);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const [matchRes, libRes] = await Promise.all([
        api.getMatchedSchemes(shop?.id || 'ramesh-kirana'),
        api.getAllSchemes()
      ]);

      if (matchRes.schemes) {
        setMatchedData(matchRes);
        if (matchRes.schemes.length > 0) {
          setExpandedSchemeId(matchRes.schemes[0].id);
        }
      }
      if (libRes.schemes) setAllSchemes(libRes.schemes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLibrary = allSchemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.plainLanguageSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || s.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-paper-300 shadow-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-ochre-100 text-ochre-800 rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-stone-900">
              {t('schemes.title')}
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t('schemes.subtitle')}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('dossier')}
          className="px-5 py-3.5 bg-terracotta-600 hover:bg-terracotta-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>{t('schemes.dossierBtn')}</span>
        </button>
      </div>

      {/* 2. Top Tabs (Your Ranked Matches vs Scheme Library) */}
      <div className="flex border-b border-paper-300 gap-2">
        <button
          onClick={() => setActiveTab('matched')}
          className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition ${
            activeTab === 'matched'
              ? 'border-terracotta-600 text-terracotta-700'
              : 'border-transparent text-stone-600 hover:text-stone-800'
          }`}
        >
          🎯 {t('schemes.tabMatched')} ({matchedData?.eligibleCount || 0} Eligible)
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition ${
            activeTab === 'library'
              ? 'border-terracotta-600 text-terracotta-700'
              : 'border-transparent text-stone-600 hover:text-stone-800'
          }`}
        >
          📚 {t('schemes.tabLibrary')} ({allSchemes.length} Schemes)
        </button>
      </div>

      {/* Tab 1: Your Ranked Matches */}
      {activeTab === 'matched' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-forestRural-50 border border-forestRural-200 rounded-2xl text-xs text-forestRural-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forestRural-700 shrink-0" />
              <span>
                {language === 'hi'
                  ? `आपकी दुकान के बही-खाते और 750 क्रेडिट स्कोर के आधार पर ${matchedData?.eligibleCount} सरकारी योजनाएं शॉर्टलिस्ट की गई हैं।`
                  : `Ranked against your verified turnover and alternative credit score (750 / 850).`}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white px-2.5 py-1 rounded-lg border border-forestRural-300 shrink-0">
              Zero Collateral Priority
            </span>
          </div>

          <div className="space-y-4">
            {matchedData?.schemes.map((scheme, index) => {
              const isExpanded = expandedSchemeId === scheme.id;
              return (
                <div 
                  key={scheme.id}
                  className={`bg-white rounded-3xl border-2 transition-all overflow-hidden ${
                    isExpanded 
                      ? 'border-terracotta-500 shadow-paper-lg ring-1 ring-terracotta-300' 
                      : 'border-paper-300 hover:border-paper-400 shadow-sm'
                  }`}
                >
                  
                  {/* Scheme Summary Header */}
                  <div 
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-stone-900">
                          {scheme.name}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                          scheme.matchScore >= 95 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          scheme.matchScore >= 85 ? 'bg-forestRural-100 text-forestRural-800 border-forestRural-300' :
                          'bg-ochre-100 text-ochre-800 border-ochre-300'
                        }`}>
                          {scheme.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">
                        {scheme.plainLanguageSummary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-stone-500 font-semibold block uppercase">
                          {t('schemes.maxLoan')}
                        </span>
                        <span className="text-base font-black text-terracotta-700">
                          {scheme.loanRangeText}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 font-bold px-2 py-1 bg-paper-100 rounded-lg">
                        {isExpanded ? 'Hide ▲' : 'Details ▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Full Plain-Language Breakdown */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-paper-200 bg-paper-50/50 space-y-5 animate-fadeIn text-xs">
                      
                      {/* 4 Financial Key Terms */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-white rounded-xl border border-paper-300">
                          <span className="text-stone-500 text-[10px] block">{t('schemes.interestRate')}</span>
                          <strong className="text-stone-900 text-xs">{scheme.interestRate}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-paper-300">
                          <span className="text-stone-500 text-[10px] block">{t('schemes.subsidy')}</span>
                          <strong className="text-forestRural-700 text-xs">{scheme.subsidyText}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-paper-300">
                          <span className="text-stone-500 text-[10px] block">{t('schemes.collateral')}</span>
                          <strong className="text-emerald-700 text-xs">{scheme.collateralText}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-paper-300">
                          <span className="text-stone-500 text-[10px] block">Repayment Tenure</span>
                          <strong className="text-stone-900 text-xs">{scheme.tenure}</strong>
                        </div>
                      </div>

                      {/* Why You Qualify */}
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                        <span className="font-extrabold text-emerald-900 text-xs block">
                          🎯 {t('schemes.whyQualify')}:
                        </span>
                        <ul className="space-y-1 text-stone-700 list-disc list-inside">
                          {scheme.whyYouQualify.map((reason, rIdx) => (
                            <li key={rIdx} className="leading-relaxed">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Required Documents & Next Steps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div className="p-4 bg-white rounded-2xl border border-paper-300 space-y-2">
                          <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-terracotta-600" />
                            <span>{t('schemes.requiredDocs')}:</span>
                          </span>
                          <ul className="space-y-1 text-stone-600">
                            {scheme.requiredDocuments.map((doc, dIdx) => (
                              <li key={dIdx} className="flex items-start gap-1.5">
                                <span className="text-terracotta-600 font-bold shrink-0">✓</span>
                                <span>{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-paper-300 space-y-2">
                          <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-ochre-600" />
                            <span>{t('schemes.howToApply')}:</span>
                          </span>
                          <ol className="space-y-1.5 text-stone-600 list-decimal list-inside">
                            {scheme.applicationSteps.map((step, sIdx) => (
                              <li key={sIdx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>

                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <a
                          href={scheme.officialPortal}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-600 hover:text-stone-900 font-bold text-xs flex items-center gap-1"
                        >
                          <span>Official Portal ({scheme.ministry})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => onNavigateTab('dossier')}
                          className="w-full sm:w-auto px-5 py-2.5 bg-terracotta-600 hover:bg-terracotta-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
                        >
                          <span>{language === 'hi' ? 'इस योजना हेतु बैंक डॉसियर प्रिंट करें' : 'Print Bank Dossier for this Scheme'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: All Schemes Directory */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          
          {/* Search & Filter Controls */}
          <div className="p-4 bg-white rounded-3xl border border-paper-300 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'योजना खोजें (जैसे: मुद्रा, विश्वकर्मा, सब्सिडी)...' : 'Search schemes (MUDRA, Vishwakarma, PMEGP)...'}
                className="w-full pl-9 pr-4 py-2 bg-paper-50 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-terracotta-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-paper-50 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 focus:outline-none"
            >
              <option value="">All Trade Categories</option>
              <option value="retail">Retail & General</option>
              <option value="artisan">Artisans & Tailors</option>
              <option value="vendor">Vendors & Hawkers</option>
              <option value="women">Women Entrepreneurs</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLibrary.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-3xl border border-paper-300 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-stone-900 text-sm">{s.name}</h3>
                    <span className="text-[10px] bg-paper-200 text-stone-700 px-2 py-0.5 rounded font-bold shrink-0 ml-2">
                      {s.loanRangeText}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {s.plainLanguageSummary}
                  </p>
                </div>

                <div className="pt-3 border-t border-paper-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-forestRural-700">
                    {s.collateralText}
                  </span>
                  <a
                    href={s.officialPortal}
                    target="_blank"
                    rel="noreferrer"
                    className="text-terracotta-700 hover:text-terracotta-800 font-bold flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      <WarliBorder className="my-3 opacity-60" />

    </div>
  );
}
