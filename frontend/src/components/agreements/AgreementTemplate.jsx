/**
 * AgreementTemplate.jsx
 * Renders the exact Naseeb Autos agreement in HTML.
 * Used both for preview and as the html2canvas capture target.
 */
import { forwardRef } from 'react'

// ── Helpers ───────────────────────────────────────────────────
const today = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const formatPKR = (n) =>
  `Rs. ${Math.round(Number(n || 0)).toLocaleString('en-PK')}`

const acct = (id) => id ? String(id).slice(-6).toUpperCase() : '——'

// ── Shared style tokens ───────────────────────────────────────
const C   = '#1a1a6e'
const FNS = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif"

// ── The component (forwardRef so parent can capture with html2canvas) ──
const AgreementTemplate = forwardRef(function AgreementTemplate({ data }, ref) {
  const { installment, customer, guarantors } = data || {}
  const g1 = guarantors?.[0] || {}
  const g2 = guarantors?.[1] || {}

  const st = {
    page: {
      width: '210mm',
      minHeight: '297mm',
      padding: '10mm 12mm',
      margin: '0 auto',
      color: C,
      fontFamily: FNS,
      background: '#fff',
      direction: 'rtl',
      boxSizing: 'border-box',
      fontSize: '13px',
      lineHeight: '2',
    },
    border: { border: `1.5px solid ${C}`, borderRadius: '2px' },
    cell: { border: `1px solid ${C}`, padding: '4px 10px', textAlign: 'center' },
    row: { display: 'flex', width: '100%', gap: 0 },
    sigBox: {
      border: `1.5px solid ${C}`,
      flex: 1,
      minHeight: '70px',
      padding: '6px 10px',
      textAlign: 'center',
      fontSize: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
  }

  return (
    <div ref={ref} id="agreement-print-root" style={st.page}>

      {/* ── Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
        @media print {
          body > * { display: none !important; }
          #agreement-print-root { display: block !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', direction: 'ltr' }}>
        {/* Left — English */}
        <div style={{ fontFamily: 'Arial, sans-serif', direction: 'ltr', maxWidth: '45%' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: C }}>NASEEB AUTOS &amp; SHOWROOM</div>
          <div style={{ fontSize: '11px', color: C, marginTop: '2px' }}>
            Ph: 0333-7971303 / 0333-7973444
          </div>
        </div>
        {/* Right — Urdu */}
        <div style={{ textAlign: 'right', direction: 'rtl', maxWidth: '55%' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>نصیب آٹوز اینڈ شوروم</div>
          <div style={{ fontSize: '12px' }}>آغا عباس مارکیٹ خضدار</div>
          <div style={{ fontSize: '12px' }}>نصیب A کمپنی</div>
        </div>
      </div>

      <hr style={{ border: `1.5px solid ${C}`, margin: '4px 0 8px' }} />

      {/* ══ TITLE ══ */}
      <div style={{ ...st.border, textAlign: 'center', padding: '4px', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '2px' }}>
        ایگریمنٹ
      </div>

      {/* ══ 3-CELL INFO ROW ══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', direction: 'rtl' }}>
        <tbody>
          <tr>
            <td style={{ ...st.cell, width: '33%' }}>
              <span style={{ fontSize: '11px', display: 'block', opacity: 0.7 }}>اکاؤنٹ نمبر</span>
              <strong>{acct(installment?._id)}</strong>
            </td>
            <td style={{ ...st.cell, width: '34%' }}>
              <span style={{ fontSize: '11px', display: 'block', opacity: 0.7 }}>منجانب خریدار</span>
              <strong>{customer?.fullName || '________________________'}</strong>
            </td>
            <td style={{ ...st.cell, width: '33%' }}>
              <span style={{ fontSize: '11px', display: 'block', opacity: 0.7 }}>تاریخ</span>
              <strong>{today()}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ CLAUSES ══ */}
      <div style={{ marginBottom: '10px' }}>
        {/* 1 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۱۔</strong> میں{' '}
          <u style={{ minWidth: '120px', display: 'inline-block' }}>{customer?.fullName || ''}</u>{' '}
          ولد{' '}
          <u style={{ minWidth: '120px', display: 'inline-block' }}>{customer?.fatherName || ''}</u>{' '}
          اقرار کرتا ہوں کہ میں موٹر سائیکل چیک اور درست حالت میں وصول کیا ہے۔
        </p>

        {/* 2 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۲۔</strong> گم ہونے یا خراب ہونے کی صورت میں ماہانہ قسط ہر گز نہیں روکوں گا بلکہ بروقت ماہانہ قسط ادا کرتا رہوں گا۔
        </p>

        {/* 3 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۳۔</strong> میں طے شدہ قسط مبلغ{' '}
          <u><strong>{formatPKR(installment?.perInstallmentAmount)}</strong></u>{' '}
          ہر ماہ کی 5 تاریخ تک فرم کو ادا کرتا رہوں گا۔
        </p>

        {/* 4 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۴۔</strong> میں قسط کی ادائیگی پر اچھی طرح قادر رہوں اور طے شدہ قسط آسانی سے ادا کر سکتا ہوں کوئی عذر حوالے نہیں کروں گا۔
        </p>

        {/* 5 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۵۔</strong> میں نے مذکورہ موٹر سائیکل اپنی ذاتی گھریلو ضروریات کیلئے خود اپنی رضامندی سے خریدی ہے۔ میں ہر گز قسط ادائیگی میں کوتاہی یا دھوکہ کر کے یا انکار نہیں کروں گا۔
        </p>

        {/* 6 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۶۔</strong> اگر میری رہائش یا ملازمت کی جگہ تبدیل ہوئی تو دوکان پر نیا ایڈریس دینے کا پابند ہوں۔
        </p>

        {/* 7 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۷۔</strong> اگر میں نے قسط ادا کرنے سے انکار کیا یا ٹال مٹول کی تو فرم کو حق حاصل ہے کہ وہ موٹر سائیکل واپس لے لے اور ادا شدہ رقم ضبط ہو گی۔ میں کسی عدالت سے رجوع نہیں کروں گا اور نہ ہی فرم کے خلاف کوئی قانونی کارروائی کروں گا۔ تمام اخراجات بشمول وکیل کی فیس میرے ذمہ ہو گی۔
        </p>

        {/* 8 */}
        <p style={{ margin: '4px 0' }}>
          <strong>۸۔</strong> میں تمام شرائط بغور پڑھ لی اور سمجھ لی ہے۔
        </p>
      </div>

      {/* ══ GUARANTOR TITLE ══ */}
      <div style={{ ...st.border, textAlign: 'center', padding: '3px', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>
        ضامن
      </div>

      {/* Signature line row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', direction: 'rtl' }}>
        <div style={{ borderBottom: `1px solid ${C}`, minWidth: '180px', textAlign: 'center', paddingBottom: '2px' }}>دستخط خریدار</div>
        <div style={{ borderBottom: `1px solid ${C}`, minWidth: '180px', textAlign: 'center', paddingBottom: '2px' }}>دستخط دوکاندار</div>
      </div>

      {/* Guarantor 1 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px', direction: 'rtl' }}>
        <tbody>
          <tr>
            <td style={{ ...st.cell, width: '25%', fontWeight: 'bold' }}>ضامن نمبر ۱</td>
            <td style={{ ...st.cell, width: '30%' }}>{g1.fullName || '________________________'}</td>
            <td style={{ ...st.cell, width: '20%' }}>ولد{' '}{g1.fatherName || '____________'}</td>
            <td style={{ ...st.cell, width: '25%' }}>موبائل: {g1.phone || '____________'}</td>
          </tr>
        </tbody>
      </table>

      {/* Guarantor 2 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', direction: 'rtl' }}>
        <tbody>
          <tr>
            <td style={{ ...st.cell, width: '25%', fontWeight: 'bold' }}>ضامن نمبر ۲</td>
            <td style={{ ...st.cell, width: '30%' }}>{g2.fullName || '________________________'}</td>
            <td style={{ ...st.cell, width: '20%' }}>ولد{' '}{g2.fatherName || '____________'}</td>
            <td style={{ ...st.cell, width: '25%' }}>موبائل: {g2.phone || '____________'}</td>
          </tr>
        </tbody>
      </table>

      {/* Guarantor responsibility clause */}
      <p style={{ margin: '4px 0 10px', fontSize: '12px' }}>
        ضامنان مذکورہ اقرار کرتے ہیں کہ اگر خریدار نے قسط ادا نہ کی تو وہ خود ادا کریں گے اور خریدار کو موٹر سائیکل واپس کرنے پر مجبور کریں گے۔
      </p>

      {/* ══ BOTTOM 4-BOX SIGNATURES ══ */}
      <div style={{ display: 'flex', gap: '4px', direction: 'rtl', marginTop: '10px' }}>
        {[
          'دستخط ضامن نمبر ۱',
          'دستخط ضامن نمبر ۲',
          'دستخط خریدار',
          'دستخط فروخت کنندہ',
        ].map((label) => (
          <div key={label} style={st.sigBox}>
            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{label}</div>
            <div style={{ height: '50px' }} />
            <div style={{ borderTop: `1px solid ${C}`, fontSize: '10px', paddingTop: '3px', opacity: 0.6 }}>انگوٹھا</div>
          </div>
        ))}
      </div>

    </div>
  )
})

export default AgreementTemplate
