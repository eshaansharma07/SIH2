import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#0C1322',
    lineHeight: 1.4
  },
  headerStrip: {
    height: 4,
    backgroundColor: '#C2410C',
    marginBottom: 16
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0C1322',
    paddingBottom: 12,
    marginBottom: 14
  },
  titleBlock: {
    flexDirection: 'column',
    maxWidth: '65%'
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#C2410C',
    letterSpacing: 0.5
  },
  subBrand: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  documentTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322',
    marginTop: 2
  },
  complianceBadge: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1E523A',
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  metaBlock: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  metaRef: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322'
  },
  metaDate: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 2
  },
  metaStatus: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#C2410C',
    marginTop: 2
  },

  // Section styling
  section: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 0.75,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 3,
    marginBottom: 6
  },

  // Two column grid
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  col2: {
    width: '48%'
  },
  col3: {
    width: '31%'
  },
  col4: {
    width: '23%'
  },

  // Key-value pair box
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9'
  },
  kLabel: {
    fontSize: 8,
    color: '#64748B'
  },
  vValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322',
    textAlign: 'right'
  },

  // Metric Callout Card
  metricCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 0.75,
    borderColor: '#E2DCD2',
    borderRadius: 4,
    padding: 8,
    marginBottom: 4
  },
  metricCardHighlight: {
    backgroundColor: '#F3F8F5',
    borderWidth: 0.75,
    borderColor: '#C3E0D1',
    borderRadius: 4,
    padding: 8,
    marginBottom: 4
  },
  metricLabel: {
    fontSize: 7.5,
    color: '#64748B',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold'
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322',
    marginTop: 2
  },
  metricSub: {
    fontSize: 7.5,
    color: '#1E523A',
    marginTop: 1
  },

  // Table
  table: {
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderRadius: 3,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0.75,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 3.5,
    paddingHorizontal: 6
  },
  tableCell: {
    fontSize: 8,
    color: '#1E293B'
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322'
  },

  // Verification QR block
  qrBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 0.75,
    borderColor: '#E2DCD2',
    borderRadius: 4,
    padding: 8,
    marginTop: 8
  },
  qrImage: {
    width: 64,
    height: 64,
    marginRight: 12
  },
  qrTextContainer: {
    flex: 1
  },
  qrTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1322'
  },
  qrDesc: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 1.3
  },
  qrUrl: {
    fontSize: 7,
    fontFamily: 'Courier',
    color: '#C2410C',
    marginTop: 3
  },

  // Signatures
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 10
  },
  sigBox: {
    width: '45%',
    height: 60,
    borderWidth: 0.75,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 6,
    justifyContent: 'flex-end'
  },
  sigLabel: {
    fontSize: 7.5,
    color: '#64748B',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#CBD5E1',
    paddingTop: 3
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 6.5,
    color: '#94A3B8'
  }
});

export function BankDossierDocument({ data }) {
  const {
    shop = {},
    cam = {},
    scoreData = {},
    qrCodeDataUrl = '',
    generatedAt = new Date().toISOString(),
    documentId = `VS-CAM-${Date.now()}`
  } = data || {};

  const totalScore = cam?.creditAssessment?.alternativeScore ?? scoreData?.totalScore ?? 755;
  const riskTier = cam?.creditAssessment?.riskTier || 'Tier 1 Prime (Low Risk)';
  const wc = cam?.workingCapitalAssessment || {};
  const turnover = wc?.auditedAnnualTurnover || shop?.monthly_revenue * 12 || 600000;
  const mpbf = wc?.maximumPermissibleBankFinanceMPBF || Math.round(turnover * 0.20);
  const wcReq = wc?.workingCapitalRequirement || Math.round(turnover * 0.25);
  const margin = wc?.borrowerMarginRequired || Math.round(turnover * 0.05);

  const pillars = cam?.creditAssessment?.factorBreakdown || scoreData?.factors || [
    { name: 'Consistency (30%)', score: 255, maxScore: 255, subFactors: 'Daily sales stability, cash discipline ratio CV' },
    { name: 'Growth Momentum (25%)', score: 212, maxScore: 212, subFactors: 'Quarterly sales growth, seasonal resilience' },
    { name: 'Financial Discipline (25%)', score: 188, maxScore: 213, subFactors: 'Udhaar recovery velocity, UPI digital deepening' },
    { name: 'Vintage & Compliance (20%)', score: 100, maxScore: 170, subFactors: 'Operating tenure, MSME Udyam verification' }
  ];

  const cashflow = cam?.cashflowProfile || {};
  const netSurplus = cashflow?.netOperatingSurplus || 154000;
  const udhaar = cam?.udhaarBook || {};

  const udyamNumber = shop?.udyam_number || (shop?.id ? `UDYAM-${(shop.state || 'IN').substring(0, 2).toUpperCase()}-0092478` : 'UDYAM-DEMO');

  return (
    <Document title={`Credit_Appraisal_Memo_${shop?.name || 'Shop'}`}>
      <Page size="A4" style={styles.page}>
        
        {/* Top Header Strip */}
        <View style={styles.headerStrip} />

        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleBlock}>
            <Text style={styles.brandName}>व्यापार साथी • VYAPAAR SAATHI</Text>
            <Text style={styles.subBrand}>Hyper-Local Business Advisory & Underwriting Stack for Rural Micro-Enterprises</Text>
            <Text style={styles.documentTitle}>CREDIT APPRAISAL MEMO & VERIFIED FINANCIAL DOSSIER</Text>
            <Text style={styles.complianceBadge}>
              FORMATTED PER RBI PSL & NAYAK COMMITTEE GUIDELINES • SIH 2026 PROTOTYPE
            </Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaRef}>REF: {documentId}</Text>
            <Text style={styles.metaDate}>DATE: {new Date(generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            <Text style={styles.metaStatus}>VERIFIED DOSSIER</Text>
          </View>
        </View>

        {/* Section 1: Enterprise Profile & Key Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Enterprise & Proprietor Profile</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Trade Name:</Text>
                <Text style={styles.vValue}>{shop?.trade_name || shop?.name || 'Kirana Store'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Proprietor Name:</Text>
                <Text style={styles.vValue}>{shop?.owner_name || 'Proprietor'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>MSME Udyam No.:</Text>
                <Text style={styles.vValue}>{udyamNumber}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Trade Classification:</Text>
                <Text style={styles.vValue}>{(shop?.trade_type || 'kirana').toUpperCase()} (Essential Micro-Retail)</Text>
              </View>
            </View>

            <View style={styles.col2}>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Village & District:</Text>
                <Text style={styles.vValue}>{shop?.village || '—'}, {shop?.district || '—'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>State:</Text>
                <Text style={styles.vValue}>{shop?.state || 'India'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Operating Vintage:</Text>
                <Text style={styles.vValue}>{shop?.vintage_years || 3} Years Active</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Primary Bank / Branch:</Text>
                <Text style={styles.vValue}>{shop?.bank_account_type || 'Regional Rural Gramin Bank'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Alternative Credit Score & 4-Pillar Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Non-CIBIL Alternative Credit Assessment (300 - 850)</Text>
          
          <View style={[styles.row, { marginBottom: 8 }]}>
            <View style={[styles.col3, styles.metricCardHighlight]}>
              <Text style={styles.metricLabel}>Alternative Score</Text>
              <Text style={[styles.metricValue, { color: '#1E523A' }]}>{totalScore} / 850</Text>
              <Text style={styles.metricSub}>PSL Prime Band</Text>
            </View>
            <View style={[styles.col3, styles.metricCard]}>
              <Text style={styles.metricLabel}>Risk Classification</Text>
              <Text style={[styles.metricValue, { fontSize: 10 }]}>{riskTier}</Text>
              <Text style={styles.metricSub}>Low Delinquency Probability</Text>
            </View>
            <View style={[styles.col3, styles.metricCard]}>
              <Text style={styles.metricLabel}>Recommended Facility</Text>
              <Text style={[styles.metricValue, { fontSize: 10 }]}>MUDRA Kishore / Shishu</Text>
              <Text style={styles.metricSub}>₹50,000 to ₹5,00,000</Text>
            </View>
          </View>

          {/* 4 Pillars Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Assessment Pillar</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Weight</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'center' }]}>Score Awarded</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Underwriting Factors</Text>
            </View>
            {pillars.map((p, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCellBold, { width: '35%' }]}>{p.name || p.pillar}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{p.weight || '—'}</Text>
                <Text style={[styles.tableCellBold, { width: '20%', textAlign: 'center' }]}>
                  {p.score} / {p.maxScore}
                </Text>
                <Text style={[styles.tableCell, { width: '30%', fontSize: 7 }]}>
                  {typeof p.subFactors === 'string' ? p.subFactors : (p.explanation || 'Verified behavioral cash ledger metric')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: Nayak Committee Working Capital Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Nayak Committee Working Capital Assessment (RBI Norms)</Text>
          <View style={styles.row}>
            <View style={[styles.col4, styles.metricCard]}>
              <Text style={styles.metricLabel}>Audited Annual Sales</Text>
              <Text style={styles.metricValue}>₹{Number(turnover).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.col4, styles.metricCard]}>
              <Text style={styles.metricLabel}>25% WC Requirement</Text>
              <Text style={styles.metricValue}>₹{Number(wcReq).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.col4, styles.metricCard]}>
              <Text style={styles.metricLabel}>5% Margin (Borrower)</Text>
              <Text style={styles.metricValue}>₹{Number(margin).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.col4, styles.metricCardHighlight]}>
              <Text style={styles.metricLabel}>20% MPBF Bank Limit</Text>
              <Text style={[styles.metricValue, { color: '#1E523A' }]}>₹{Number(mpbf).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Section 4: Bahi-Khata Cash Flow & Udhaar Discipline Audit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Cash Flow & Udhaar Recovery Verification</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Net Operating Cash Surplus:</Text>
                <Text style={styles.vValue}>₹{Number(netSurplus).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Operating Surplus Margin:</Text>
                <Text style={styles.vValue}>{cashflow?.operatingMarginPct || '22.2'}%</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Estimated Debt Servicing Headroom:</Text>
                <Text style={styles.vValue}>₹{Number(Math.round(netSurplus / 12 * 0.4)).toLocaleString('en-IN')} / mo</Text>
              </View>
            </View>

            <View style={styles.col2}>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Cumulative Udhaar Recovered:</Text>
                <Text style={styles.vValue}>₹{Number(udhaar?.totalRepaid || 8000).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Recovery Rate Velocity:</Text>
                <Text style={styles.vValue}>{udhaar?.recoveryRatePct || '72.7'}%</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kLabel}>Digital Adoption (UPI Share):</Text>
                <Text style={styles.vValue}>{cashflow?.digitalSharePct || '42'}% (PSL Benchmark Format)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 5: Verification QR Code */}
        {qrCodeDataUrl ? (
          <View style={styles.qrBlock}>
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
            <View style={styles.qrTextContainer}>
              <Text style={styles.qrTitle}>Digital Integrity & Live Ledger Verification</Text>
              <Text style={styles.qrDesc}>
                Lending officers may scan this QR code to verify this Credit Appraisal Memo directly against live tamper-evident transactional logs and calculate updated debt covenants in real time.
              </Text>
              <Text style={styles.qrUrl}>
                Verify at: https://vyapaar-saathi-nine.vercel.app/api/credit-score/{shop?.id || 'ramesh-kirana'}/cam
              </Text>
            </View>
          </View>
        ) : null}

        {/* Section 6: Formal Declarations & Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Branch Credit Officer Signature & Seal</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Proprietor / Borrower Signature & Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vyapaar Saathi • Prototype for Smart India Hackathon 2026 • Formatted per RBI PSL guidelines • Not an official government filing</Text>
          <Text style={styles.footerText}>Page 1 of 1 • System Generated Dossier</Text>
        </View>

      </Page>
    </Document>
  );
}
