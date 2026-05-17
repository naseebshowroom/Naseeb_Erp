import React from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';

const CarAgreement = ({ installment, customer }) => {
  if (!installment || !customer) return null;

  const {
    fullName: customerName,
    fatherName,
    guarantors = []
  } = customer;

  const {
    perInstallmentAmount,
    installmentPrice,
    advanceAmount,
    remainingAmount,
    totalInstallments,
    engineNumber,
    chassisNumber,
    color,
    model
  } = installment;

  const accountNumber = installment._id?.toString().slice(-6).toUpperCase() || 'N/A';
  const date = formatDate(new Date());

  const guarantor1 = guarantors[0] || {};
  const guarantor2 = guarantors[1] || {};

  return (
    <div
      id="car-agreement"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 18mm',
        background: 'white',
        color: '#1a1a6e',
        boxSizing: 'border-box',
        fontFamily: "'Noto Nastaliq Urdu', serif",
        margin: '0 auto',
      }}
    >
      {/* ══ HEADER ══ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '3px solid #1a1a6e',
        paddingBottom: '10px',
        marginBottom: '12px',
      }}>
        {/* LEFT — English */}
        <div style={{ direction: 'ltr', minWidth: '160px' }}>
          <div style={{
            background: '#1a1a6e',
            color: 'white',
            padding: '5px 12px',
            fontWeight: '900',
            fontSize: '16px',
            fontFamily: "'Times New Roman', serif",
            letterSpacing: '1px',
            display: 'inline-block',
          }}>NASEEB</div>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#1a1a6e',
            marginTop: '3px',
            fontFamily: "'Times New Roman', serif",
            direction: 'ltr',
          }}>AUTOS & SHOWROOM</div>
          <div style={{
            fontSize: '10px',
            color: '#333',
            fontFamily: 'Arial, sans-serif',
            direction: 'ltr',
          }}>Ph: 0333-7971303 / 0333-7973444</div>
          <div style={{
            fontSize: '10px',
            color: '#333',
            fontFamily: "'Noto Nastaliq Urdu', serif",
            direction: 'rtl',
            lineHeight: '2',
          }}>آغا عباس مارکیٹ خضدار</div>
        </div>

        {/* RIGHT — Urdu */}
        <div style={{ direction: 'rtl', textAlign: 'right' }}>
          <div style={{
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: '22px',
            fontWeight: '700',
            color: '#1a1a6e',
            lineHeight: '2',
            direction: 'rtl',
          }}>نصیب الیکٹرونکس اینڈ شوروم</div>
          <div style={{
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: '12px',
            color: '#333',
            lineHeight: '2',
            direction: 'rtl',
          }}>نصیب A کمپنی</div>
        </div>
      </div>

      {/* ══ TITLE ══ */}
      <div style={{ textAlign: 'center', margin: '10px 0 14px' }}>
        <div style={{
          border: '2.5px solid #1a1a6e',
          display: 'inline-block',
          padding: '6px 48px',
          fontFamily: "'Noto Nastaliq Urdu', serif",
          fontSize: '26px',
          fontWeight: '700',
          color: '#1a1a6e',
          lineHeight: '2',
        }}>ایگریمنٹ</div>
      </div>

      {/* ══ FIELDS ROW 1 ══ */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1.5px solid #1a1a6e',
        margin: '10px 0',
        direction: 'rtl',
      }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #1a1a6e', padding: '6px 10px', width: '33%' }}>
              <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', fontWeight: '700', direction: 'rtl', lineHeight: '2' }}>اکاؤنٹ نمبر</div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', fontSize: '13px', direction: 'ltr' }}>{accountNumber}</div>
            </td>
            <td style={{ border: '1px solid #1a1a6e', padding: '6px 10px', width: '34%', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', fontWeight: '700', direction: 'rtl', lineHeight: '2' }}>منجانب خریدار</div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', fontSize: '13px' }}>{customerName}</div>
            </td>
            <td style={{ border: '1px solid #1a1a6e', padding: '6px 10px', width: '33%' }}>
              <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', fontWeight: '700', direction: 'rtl', lineHeight: '2' }}>تاریخ</div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', fontSize: '13px', direction: 'ltr' }}>{date}</div>
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #1a1a6e', padding: '6px 10px' }}>
              <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', fontWeight: '700', direction: 'rtl', lineHeight: '2' }}>انجن نمبر</div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', fontSize: '11px', direction: 'ltr' }}>{engineNumber || '—'}</div>
            </td>
            <td style={{ border: '1px solid #1a1a6e', padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', fontWeight: '700', direction: 'rtl', lineHeight: '2' }}>چیسس نمبر</div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', fontSize: '11px', direction: 'ltr' }}>{chassisNumber || '—'}</div>
            </td>
            <td style={{ border: '1px solid #1a1a6e', padding: '6px 10px' }}>
              <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', fontWeight: '700', direction: 'rtl', lineHeight: '2' }}>رنگ / ماڈل</div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', fontSize: '11px', direction: 'ltr' }}>{color} / {model}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ CLAUSES ══ */}
      <div style={{ direction: 'rtl', padding: '0 2px' }}>
        {[
          `میں <span class="english-inline">${customerName}</span> ولد <span class="english-inline">${fatherName}</span> اقرار کرتا/کرتی ہوں کہ مجھے مذکورہ کار چیک اور درست حالت میں وصول ہوا ہے۔`,
          "گم ہونے یا خراب ہونے کی صورت میں ماہانہ قسط ہر گز نہیں روکوں گا/گی بلکہ بروقت قسط ادا کرتا/کرتی رہوں گا/گی۔",
          `میں طے شدہ قسط مبلغ <span class="english-inline">Rs. ${perInstallmentAmount}</span> ہر ماہ کی 5 تاریخ کو فرم کو ادا کرتا/کرتی رہوں گا/گی۔`,
          "میں قسط کی ادائیگی پر اچھی طرح قادر ہوں اور طے شدہ قسط آسانی سے ادا کر سکتا/سکتی ہوں، کوئی عذر حوالے نہیں کروں گا/گی۔",
          "میں نے مذکورہ کار اپنی ذاتی گھریلو ضروریات کیلئے خود اپنی رضامندی سے خریدا ہے۔ میں ہر گز قسط ادائیگی میں کوتاہی یا دھوکہ نہیں کروں گا/گی۔",
          "اگر میری رہائش یا ملازمت کی جگہ تبدیل ہوئی تو دوکان پر نیا ایڈریس دینے کا/کی پابند ہوں۔",
          "اگر میں نے قسط ادا کرنے سے انکار کیا یا ٹال مٹول کیا تو فرم کو حق حاصل ہے کہ وہ کار واپس لے لے اور ادا شدہ رقم ضبط ہو گی۔",
          "میں فرم کے خلاف کوئی قانونی کاروائی نہیں کروں گا/گی۔ تمام اخراجات بشمول وکیل کی فیس میرے ذمہ ہوں گے۔",
          "میں تمام شرائط بغور پڑھ لی اور سمجھ لی ہیں۔"
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', margin: '8px 0', direction: 'rtl', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: "'Times New Roman', serif", fontWeight: '700', color: '#1a1a6e', minWidth: '28px', fontSize: '13px', direction: 'ltr', paddingTop: '8px' }}>{(i + 1).toLocaleString('ar-EG')}۔</span>
            <span 
              style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '13px', lineHeight: '2.6', direction: 'rtl', flex: 1 }}
              dangerouslySetInnerHTML={{ __html: text.replace(/class="english-inline"/g, 'style="font-family: \'Times New Roman\', serif !important; direction: ltr !important; unicode-bidi: isolate !important; display: inline-block !important; font-weight: 700 !important; font-size: 13px !important;"') }}
            />
          </div>
        ))}
      </div>

      {/* ══ FINANCIAL TABLE ══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', direction: 'rtl', border: '1.5px solid #1a1a6e' }}>
        <thead>
          <tr style={{ background: '#e8eaf6' }}>
            {['مدت (ماہ)', 'قسط', 'بقایا', 'ایڈوانس', 'ملی قیمت'].map((label, i) => (
              <th key={i} style={{ border: '1px solid #1a1a6e', padding: '8px', textAlign: 'center', fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '13px', fontWeight: '700', lineHeight: '2' }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border:'1px solid #1a1a6e', padding:'8px', textAlign:'center', fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'14px', direction:'ltr' }}>{totalInstallments}</td>
            <td style={{ border:'1px solid #1a1a6e', padding:'8px', textAlign:'center', fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'14px', direction:'ltr' }}>Rs. {perInstallmentAmount}</td>
            <td style={{ border:'1px solid #1a1a6e', padding:'8px', textAlign:'center', fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'14px', direction:'ltr' }}>Rs. {remainingAmount}</td>
            <td style={{ border:'1px solid #1a1a6e', padding:'8px', textAlign:'center', fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'14px', direction:'ltr' }}>Rs. {advanceAmount}</td>
            <td style={{ border:'1px solid #1a1a6e', padding:'8px', textAlign:'center', fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'14px', direction:'ltr' }}>Rs. {installmentPrice}</td>
          </tr>
        </tbody>
      </table>

      {/* ══ GUARANTOR SECTION ══ */}
      <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
        <div style={{ border: '2px solid #1a1a6e', display: 'inline-block', padding: '5px 40px', background: '#f0f0ff' }}>
          <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '18px', fontWeight: '700', color: '#1a1a6e', lineHeight: '2', direction: 'rtl' }}>ضامن</span>
        </div>
      </div>

      <div style={{ direction: 'rtl' }}>
        <div style={{ display:'flex', justifyContent:'space-between', margin:'10px 0', direction:'rtl' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
            <span style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:'12px', lineHeight:'2', direction:'rtl', whiteSpace:'nowrap' }}>دستخط دوکاندار</span>
            <span style={{ borderBottom:'1px solid #333', display:'inline-block', minWidth:'180px', height:'16px' }}></span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
            <span style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:'12px', lineHeight:'2', direction:'rtl', whiteSpace:'nowrap' }}>نام دوکاندار</span>
            <span style={{ borderBottom:'1px solid #333', display:'inline-block', minWidth:'140px', height:'16px' }}></span>
          </div>
        </div>

        {[guarantor1, guarantor2].map((g, i) => (
          <div key={i} style={{ margin:'12px 0 4px', direction:'rtl' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'nowrap', direction:'rtl' }}>
              <span style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:'12px', lineHeight:'2', whiteSpace:'nowrap', fontWeight:'700' }}>ضامن نمبر {(i + 1).toLocaleString('ar-EG')}</span>
              <span style={{ fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'13px', minWidth:'100px', borderBottom:'1px solid #333', display:'inline-block', height:'16px' }}>{g.fullName || g.name || ''}</span>
              <span style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:'12px', lineHeight:'2', whiteSpace:'nowrap' }}>ولد</span>
              <span style={{ fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'13px', minWidth:'100px', borderBottom:'1px solid #333', display:'inline-block', height:'16px' }}>{g.fatherName || ''}</span>
              <span style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:'12px', lineHeight:'2', whiteSpace:'nowrap' }}>قوم</span>
              <span style={{ borderBottom:'1px solid #333', display:'inline-block', minWidth:'70px', height:'16px' }}></span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'6px 0', direction:'rtl' }}>
              <span style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:'12px', lineHeight:'2', whiteSpace:'nowrap', fontWeight:'700' }}>موبائل نمبر</span>
              <span style={{ fontFamily:"'Times New Roman',serif", fontWeight:'700', fontSize:'13px', minWidth:'140px', borderBottom:'1px solid #333', display:'inline-block', height:'16px' }}>{g.phone || ''}</span>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #ddd', marginTop: '10px', paddingTop: '8px', fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '12px', lineHeight: '2.6', direction: 'rtl', color: '#1a1a6e' }}>
          ضامنان مذکورہ اقرار کرتے ہیں کہ اگر خریدار نے قسط ادا نہ کی تو وہ خود قسط ادا کریں گے اور خریدار کو مال واپس کرنے پر مجبور کریں گے۔
        </div>
      </div>

      <hr style={{ border: '1.5px solid #1a1a6e', margin: '16px 0' }} />

      <div style={{ display:'flex', justifyContent:'space-between', direction:'rtl', marginTop:'8px', gap:'16px' }}>
        {['دستخط فروخت کنندہ اینڈ شوروم', 'دستخط خریدار', 'خریدار کا نام'].map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #333', minHeight: '32px', marginBottom: '6px' }}></div>
            <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', lineHeight: '2', direction: 'rtl', color: '#1a1a6e' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarAgreement;
