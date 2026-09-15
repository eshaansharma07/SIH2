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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
              {language === 'hi' ? 'सरकारी योजना मिलान' : 'Government Scheme Matcher'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              {matchedData?.eligibleCount || 3} Eligible
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'hi' ? 'बिना गारंटी 10 प्रामाणिक भारतीय सरकारी योजनाएं' : 'Real, verified Indian credit schemes matched to your audited turnover'}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('dossier')}
          className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition shrink-0 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>{language === 'hi' ? 'बैंक फाइल तैयार करें' : 'Generate Bank Dossier'}</span>
        </button>
      </div>

      {/* 2. Apple Segmented Pill Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('matched')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'matched' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎯 Your Matches ({matchedData?.eligibleCount || 0})
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'library' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📚 All Schemes ({allSchemes.length})
        </button>
      </div>

      {/* Tab 1: Your Ranked Matches */}
      {activeTab === 'matched' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                Ranked against your ₹2,25,857 verified turnover and 755 Alternative Credit Score.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
              Zero Collateral
            </span>
          </div>

          <div className="space-y-3.5">
            {matchedData?.schemes.map((scheme) => {
              const isExpanded = expandedSchemeId === scheme.id;
              return (
                <div 
                  key={scheme.id}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                    isExpanded 
                      ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-100' 
                      : 'border-slate-200/80 shadow-card hover:border-slate-300'
                  }`}
                >
                  
                  {/* Scheme Summary Header */}
                  <div 
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-slate-900 tracking-tight">
                          {scheme.name}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                          scheme.matchScore >= 95 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          scheme.matchScore >= 85 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {scheme.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                        {scheme.plainLanguageSummary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Maximum Facility
                        </span>
                        <span className="text-base font-black text-slate-900 tabular-nums">
                          {scheme.loanRangeText}
                        </span>
                      </div>
                      <span className="text-xs text-indigo-600 font-bold px-3 py-1.5 bg-indigo-50 rounded-xl">
                        {isExpanded ? 'Hide' : 'Details'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-fadeIn text-xs">
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-white rounded-2xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Interest Rate</span>
                          <strong className="text-slate-900 text-xs">{scheme.interestRate}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-2xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Govt Subsidy</span>
                          <strong className="text-emerald-600 text-xs">{scheme.subsidyText}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-2xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Collateral Required</span>
                          <strong className="text-slate-900 text-xs">{scheme.collateralText}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-2xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Target Nodal Bank</span>
                          <strong className="text-slate-900 text-xs">{scheme.nodalBankText}</strong>
                        </div>
                      </div>

                      {/* Required Documents Checklist */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                        <span className="font-extrabold text-slate-900 block">Required Documents (सरल दस्तावेज़ सूची):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                          {scheme.requiredDocuments.map((doc, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => onNavigateTab('dossier')}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                        >
                          <span>Include in Bank Loan Dossier</span>
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

      {/* Tab 2: Scheme Library */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredLibrary.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{s.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                    {s.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{s.plainLanguageSummary}</p>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-bold">
                  <span className="text-slate-400">Limit</span>
                  <span className="text-slate-900">{s.loanRangeText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
