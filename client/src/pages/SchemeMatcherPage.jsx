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
  Filter,
  BookOpen 
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from '../i18n/LanguageContext';
import { WarliBorder } from '../components/WarliMotif';
import { Card, Badge, SectionHeader, Button } from '../components/ui';

export function SchemeMatcherPage({ shop, creditData, onNavigateTab }) {
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
      if (shop?.id) {
        const [matchRes, libRes] = await Promise.all([
          api.getMatchedSchemes(shop.id),
          api.getAllSchemes()
        ]);

        if (matchRes.schemes) {
          setMatchedData(matchRes);
          if (matchRes.schemes.length > 0) {
            setExpandedSchemeId(matchRes.schemes[0].id);
          }
        }
        if (libRes.schemes) setAllSchemes(libRes.schemes);
      } else {
        const libRes = await api.getAllSchemes();
        if (libRes.schemes) setAllSchemes(libRes.schemes);
        setMatchedData({ schemes: [], eligibleCount: 0 });
      }
    } catch (e) {
      console.error('Scheme loader error:', e);
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

  const eligibleCount = matchedData?.eligibleCount ?? (loading ? '—' : 0);
  const scoreText = creditData?.totalScore ? `${creditData.totalScore} Alternative Score` : 'Alternative Credit Score';
  const turnoverText = shop?.monthly_revenue ? `₹${Number(shop.monthly_revenue * 12).toLocaleString('en-IN')}` : 'audited';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner with Warli Border */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-indigoRural-900 font-display">
                {language === 'hi' ? 'सरकारी योजना मिलान' : 'Government Scheme Matcher'}
              </h1>
              <Badge variant="positive" size="sm" dot>
                {eligibleCount} Eligible Schemes
              </Badge>
            </div>
            <p className="text-xs text-indigoRural-500 mt-1">
              {language === 'hi' ? 'बिना गारंटी 10 प्रामाणिक भारतीय सरकारी योजनाएं' : 'Real, verified Indian credit schemes matched to your audited turnover'}
            </p>
          </div>

          <Button
            onClick={() => onNavigateTab('dossier')}
            variant="dark"
            size="lg"
            icon={FileText}
            className="self-start sm:self-auto"
          >
            <span>{language === 'hi' ? 'बैंक फाइल तैयार करें' : 'Generate Bank Dossier'}</span>
          </Button>
        </div>

        <WarliBorder className="w-full h-6 text-terracotta-400 opacity-60" />
      </div>

      {/* 2. Segmented Pill Tabs */}
      <div className="flex gap-1 p-1 bg-paper-200/80 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('matched')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'matched' 
              ? 'bg-white text-indigoRural-900 shadow-2xs' 
              : 'text-indigoRural-600 hover:text-indigoRural-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Your Matches ({eligibleCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'library' 
              ? 'bg-white text-indigoRural-900 shadow-2xs' 
              : 'text-indigoRural-600 hover:text-indigoRural-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>All Schemes ({allSchemes.length})</span>
        </button>
      </div>

      {/* Tab 1: Your Ranked Matches */}
      {activeTab === 'matched' && (
        <div className="space-y-4">
          <div className="p-4 bg-forestRural-50 border border-forestRural-200 rounded-xl text-xs text-forestRural-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forestRural-700 shrink-0" />
              <span className="font-semibold">
                Ranked against your {turnoverText} turnover and {scoreText}.
              </span>
            </div>
            <Badge variant="positive" size="sm">
              Zero Collateral
            </Badge>
          </div>

          <div className="space-y-3.5">
            {matchedData?.schemes?.map((scheme) => {
              const isExpanded = expandedSchemeId === scheme.id;
              const isHighMatch = scheme.matchScore >= 90;

              return (
                <Card 
                  key={scheme.id}
                  padding="none"
                  className={`overflow-hidden transition-all ${
                    isExpanded ? 'ring-2 ring-terracotta-400 border-terracotta-300' : ''
                  }`}
                >
                  {/* Scheme Summary Header */}
                  <div 
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none hover:bg-paper-50/60 transition"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-indigoRural-900 tracking-tight font-display">
                          {scheme.name}
                        </span>
                        <Badge 
                          variant={isHighMatch ? 'positive' : 'attention'} 
                          size="sm"
                        >
                          {scheme.matchScore}% Match
                        </Badge>
                      </div>
                      <p className="text-xs text-indigoRural-500 line-clamp-1 font-medium">
                        {scheme.plainLanguageSummary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-indigoRural-400 font-bold block uppercase tracking-wider">
                          Maximum Facility
                        </span>
                        <span className="text-base font-black text-indigoRural-900 tabular-nums">
                          {scheme.loanRangeText}
                        </span>
                      </div>
                      <span className="text-xs text-terracotta-700 font-bold px-3 py-1.5 bg-terracotta-50 rounded-lg border border-terracotta-200">
                        {isExpanded ? 'Hide' : 'Details'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-paper-200 bg-paper-50/50 space-y-4 animate-fadeIn text-xs">
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-white rounded-xl border border-paper-200">
                          <span className="text-indigoRural-400 text-[10px] block uppercase font-bold">Interest Rate</span>
                          <strong className="text-indigoRural-900 text-xs">{scheme.interestRate}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-paper-200">
                          <span className="text-indigoRural-400 text-[10px] block uppercase font-bold">Govt Subsidy</span>
                          <strong className="text-forestRural-700 text-xs">{scheme.subsidyText}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-paper-200">
                          <span className="text-indigoRural-400 text-[10px] block uppercase font-bold">Collateral Required</span>
                          <strong className="text-indigoRural-900 text-xs">{scheme.collateralText}</strong>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-paper-200">
                          <span className="text-indigoRural-400 text-[10px] block uppercase font-bold">Target Nodal Bank</span>
                          <strong className="text-indigoRural-900 text-xs">{scheme.nodalBankText}</strong>
                        </div>
                      </div>

                      {/* Required Documents Checklist */}
                      <div className="p-4 bg-white rounded-xl border border-paper-200 space-y-2">
                        <span className="font-extrabold text-indigoRural-900 block">Required Documents (सरल दस्तावेज़ सूची):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-indigoRural-700">
                          {scheme.requiredDocuments.map((doc, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-forestRural-600 shrink-0" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={() => onNavigateTab('dossier')}
                          variant="dark"
                          size="md"
                          icon={ArrowRight}
                          iconPosition="right"
                        >
                          <span>Include in Bank Loan Dossier</span>
                        </Button>
                      </div>

                    </div>
                  )}

                </Card>
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
              <Card key={s.id} padding="md" className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-indigoRural-900">{s.name}</span>
                  <Badge variant="neutral" size="sm">
                    {s.category}
                  </Badge>
                </div>
                <p className="text-xs text-indigoRural-500 line-clamp-2">{s.plainLanguageSummary}</p>
                <div className="flex justify-between items-center pt-2 border-t border-paper-200 text-xs font-bold">
                  <span className="text-indigoRural-400">Limit</span>
                  <span className="text-indigoRural-900">{s.loanRangeText}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
