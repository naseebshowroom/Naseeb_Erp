import React from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { numberToWords } from '@/utils/numberToWords';
import { useSettingsStore } from '@/store/settingsStore';

const SaleReceipt = ({ installment, customer }) => {
  if (!installment || !customer) return null;

  const { settings } = useSettingsStore();
  const receiptBrands = settings?.receiptBrands || 'Honda / Super Power / Unique / Impress / Express / Galaxy / United';
  const receiptColors = settings?.receiptColors || 'Red / Black / Selvar / Blue';

  const date = formatDate(new Date());
  const receiptNumber = installment.receiptNumber || '—';
  const totalAmount = installment.installmentPrice + (installment.registrationFee || 0);
  const totalAmountInWords = numberToWords(totalAmount);

  const brandOpts = receiptBrands.split(/[,\/]+/).map(b => b.trim()).filter(Boolean);
  const brandDisplay = brandOpts.map((b, idx) => {
    const isSelected = b.toLowerCase() === (installment.brand || '').toLowerCase();
    return (
      <React.Fragment key={idx}>
        {idx > 0 && ' \u00A0/\u00A0 '}
        {isSelected ? (
          <strong style={{ textDecoration: 'underline', fontSize: '15px' }}>{b}</strong>
        ) : (
          b
        )}
      </React.Fragment>
    );
  });

  const colorOpts = receiptColors.split(/[,\/]+/).map(c => c.trim()).filter(Boolean);
  const colorDisplay = colorOpts.map((c, idx) => {
    const isSelected = c.toLowerCase() === (installment.color || '').toLowerCase();
    return (
      <React.Fragment key={idx}>
        {idx > 0 && ' \u00A0/\u00A0 '}
        {isSelected ? (
          <strong style={{ textDecoration: 'underline', fontSize: '14px' }}>{c}</strong>
        ) : (
          c
        )}
      </React.Fragment>
    );
  });

  const watermarkText = "NASEEB \u00A0\u00A0 NASEEB \u00A0\u00A0 NASEEB \u00A0\u00A0 NASEEB \u00A0\u00A0 NASEEB \u00A0\u00A0 NASEEB";

  return (
    <div
      id="sale-receipt"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm 15mm',
        background: 'white',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: "'Times New Roman', serif",
      }}
    >
      {/* WATERMARK ROW */}
      <div style={{ color: '#ddd', fontSize: '9px', letterSpacing: '3px', textAlign: 'center', marginBottom: '4px' }}>
        {watermarkText}
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #1a1a6e', paddingBottom: '12px' }}>
        <div style={{ border: '2px solid #1a1a6e', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontWeight: '900', fontSize: '14px', color: '#c9a227', letterSpacing: '1px' }}>GALAXY</div>
          <div style={{ fontSize: '9px', color: '#666', letterSpacing: '1px' }}>MOTORCYCLE</div>
        </div>

        <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
          <div style={{ fontSize: '19px', fontWeight: '900', color: '#1a1a6e', letterSpacing: '1px' }}>NASEEB ELECTRONICS & SHOWROOM</div>
          <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '26px', color: '#8b0000', fontWeight: '700', lineHeight: '1.2', direction: 'rtl' }}>نصیب الیکٹرونکس اینڈ شوروم</div>
        </div>

        <div style={{ textAlign: 'right', direction: 'rtl' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a6e', direction: 'ltr' }}>📞 0333-7971303</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a6e', direction: 'ltr' }}>0333-7973444</div>
          <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '10px', lineHeight: '2' }}>میر چاکر خان روڈ آغا شہباز مارکیٹ آزادی چوک خضدار</div>
          <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '10px', lineHeight: '2' }}>نصیب A کمپنی</div>
        </div>
      </div>

      <div style={{ color: '#ddd', fontSize: '9px', letterSpacing: '3px', textAlign: 'center', margin: '4px 0' }}>{watermarkText}</div>

      {/* TITLE */}
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <div style={{ border: '2.5px solid #000', display: 'inline-block', padding: '6px 32px', fontSize: '18px', fontWeight: '900', letterSpacing: '3px' }}>SALE &nbsp; RECEIPT</div>
      </div>

      <div style={{ color: '#ddd', fontSize: '9px', letterSpacing: '3px', textAlign: 'center', margin: '4px 0' }}>{watermarkText}</div>

      {/* FIELDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', margin: '12px 0' }}>
        {[
          ["Costmor's Name", customer.fullName],
          ["Sr.#", receiptNumber],
          ["Father's Name", customer.fatherName],
          ["Dated:", date],
          ["N.I.C #:", customer.cnic],
          ["Cash Price", formatCurrency(installment.installmentPrice)],
          ["Address", customer.address],
          ["Registration Fess", formatCurrency(installment.registrationFee || 0)],
          ["C/o", customer.careOf || '—'],
          ["", ""],
          ["Mobile", customer.phone],
          ["Total Amount", formatCurrency(totalAmount), true],
        ].map(([label, value, bold], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontWeight: bold ? '900' : '700', fontSize: bold ? '14px' : '13px', borderTop: bold ? '2.5px solid #000' : 'none', paddingTop: bold ? '4px' : '0' }}>
            <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
            {label && <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '18px', display: 'inline-block' }}>&nbsp;{value}</span>}
          </div>
        ))}
      </div>

      <div style={{ fontStyle: 'italic', fontWeight: '700', fontSize: '13px', textAlign: 'center', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '6px 0', margin: '8px 0' }}>
        {brandDisplay}
      </div>

      {/* PRODUCT DETAILS */}
      <div style={{ display: 'flex', gap: '16px', margin: '6px 0', fontWeight: '700', fontSize: '13px' }}>
        <span>Model: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: '200px' }}>&nbsp;{installment.brand} {installment.model}</span></span>
        <span>Colour: &nbsp; <span style={{ fontStyle: 'normal' }}>{colorDisplay}</span></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '10px 0' }}>
        {[
          ["Engine #:", installment.engineNumber || '—'],
          ["Received Cash:", formatCurrency(installment.advanceAmount)],
          ["Chasis #:", installment.chassisNumber || '—'],
          ["Pending Cash:", formatCurrency(installment.remainingAmount)],
        ].map(([label, value], i) => (
          <div key={i}>
            <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px' }}>{label}</div>
            <div style={{ border: '1.5px solid #333', padding: '6px 8px', minHeight: '28px', fontSize: '13px', fontWeight: '700' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontWeight: '900', fontSize: '14px', margin: '10px 0' }}>
        <span style={{ whiteSpace: 'nowrap' }}>Total Rupees:</span>
        <span style={{ flex: 1, borderBottom: '1.5px solid #333', minHeight: '18px', display: 'inline-block' }}>&nbsp;{totalAmountInWords}</span>
      </div>

      <div style={{ color: '#ddd', fontSize: '9px', letterSpacing: '3px', textAlign: 'center', margin: '6px 0' }}>{watermarkText}</div>

      {/* URDU TERMS */}
      <div style={{ direction: 'rtl', borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '6px' }}>
        {[
          "خریدا ہوا موٹر سائیکل جو شوروم سے نکلا ہو واپس یا تبدیل نہ ہوگا۔",
          "اگر کسی کسٹمر کو کاغذات بھوانے ہوتو اکرم کراچی نمبر 3 سے 4 مہینے لگ سکتے ہیں۔",
          "اگر ایک سائز پرچی میں کوئی نام ہے سیس نمبر کار رجسٹریشن کارڈ نمبر میں کوئی غلطی ہو تو 2 دن کے اندر شوروم سے رابطہ کریں۔",
          "ایک مہینے کے اندر اپنے نام پر گاڑی رجسٹرڈ کروالیں، اس کے بعد دوکاندار ذمہ دار نہیں ہوگا۔"
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', margin: '4px 0', fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '11px', lineHeight: '2.4', direction: 'rtl' }}>
            <span style={{ color: '#8b0000', fontWeight: '700', minWidth: '20px', fontFamily: "'Times New Roman', serif" }}>{(i + 1).toLocaleString('ar-EG')}۔</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', borderTop: '1px solid #333', paddingTop: '8px' }}>
        <div style={{ fontStyle: 'italic', fontWeight: '700', color: '#1a1a6e', fontSize: '13px' }}>Receiveds Signature</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#555' }}>For:</div>
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#8b0000', letterSpacing: '1px' }}>NASEEB AUTOS & SHOWROOM</div>
        </div>
      </div>

      <div style={{ color: '#ddd', fontSize: '9px', letterSpacing: '3px', textAlign: 'center', marginTop: '6px' }}>{watermarkText}</div>
    </div>
  );
};

export default SaleReceipt;
