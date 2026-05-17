/**
 * documentTemplates.js
 * Plain-HTML generators for Puppeteer PDF rendering.
 * All three agreement types: Electronics, Motorcycle, Car.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as PKR currency, always rounded — never decimals */
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('en-PK');

/** Wrap an English word/number inside an Urdu sentence */
const en = (text) =>
  `<span class="en">${text}</span>`;

/** Urdu ordinal numerals 1–11 */
const urduNum = ['', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۱۰', '۱۱'];

/** Render a single numbered clause */
const clause = (num, html) => `
  <div style="display:flex;gap:10px;margin:9px 0;direction:rtl;align-items:flex-start;">
    <span style="font-family:'Times New Roman',serif;font-weight:700;color:#1a1a6e;
                 min-width:30px;font-size:14px;padding-top:8px;flex-shrink:0;">
      ${urduNum[num]}۔
    </span>
    <span class="u" style="flex:1;font-size:13px;">${html}</span>
  </div>`;

// ─── Shared HTML blocks ───────────────────────────────────────────────────────

const sharedHeader = () => `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;
              border-bottom:3px solid #1a1a6e;padding-bottom:10px;margin-bottom:14px;">

    <!-- LEFT — English brand block -->
    <div style="direction:ltr;min-width:175px;">
      <div style="background:#1a1a6e;color:#fff;padding:5px 14px;font-weight:900;
                  font-size:17px;display:inline-block;letter-spacing:1px;
                  font-family:'Times New Roman',serif;">NASEEB</div>
      <div style="font-size:11px;font-weight:700;margin-top:3px;
                  font-family:'Times New Roman',serif;">AUTOS &amp; SHOWROOM</div>
      <div style="font-size:10px;color:#333;font-family:'Times New Roman',serif;">
        Ph: 0333-7971303 / 0333-7973444
      </div>
      <div class="u" style="font-size:10px;color:#333;line-height:1.8;">آغا عباس مارکیٹ خضدار</div>
    </div>

    <!-- RIGHT — Urdu brand block -->
    <div style="direction:rtl;text-align:right;">
      <div class="uh" style="font-size:24px;color:#1a1a6e;">نصیب الیکٹرونکس اینڈ شوروم</div>
      <div class="u"  style="font-size:12px;color:#555;line-height:1.8;">نصیب A کمپنی</div>
    </div>
  </div>`;

const titleBox = () => `
  <div style="text-align:center;margin:12px 0 16px;">
    <div style="border:2.5px solid #1a1a6e;display:inline-block;padding:6px 52px;">
      <span class="uh" style="font-size:28px;color:#1a1a6e;">ایگریمنٹ</span>
    </div>
  </div>`;

const infoRow = ({ accountNumber, customerName, date }) => `
  <table style="width:100%;border-collapse:collapse;border:1.5px solid #1a1a6e;
                direction:rtl;margin:10px 0;">
    <tr>
      <td style="width:33%;border:1px solid #1a1a6e;padding:7px 10px;">
        <div class="u"  style="font-size:11px;font-weight:700;line-height:1.8;">اکاؤنٹ نمبر</div>
        <div class="en" style="font-size:13px;">${accountNumber}</div>
      </td>
      <td style="width:34%;border:1px solid #1a1a6e;padding:7px 10px;text-align:center;">
        <div class="u"  style="font-size:11px;font-weight:700;line-height:1.8;">منجانب خریدار</div>
        <div style="font-size:13px;font-weight:700;">${customerName}</div>
      </td>
      <td style="width:33%;border:1px solid #1a1a6e;padding:7px 10px;">
        <div class="u"  style="font-size:11px;font-weight:700;line-height:1.8;">تاریخ</div>
        <div class="en" style="font-size:13px;">${date}</div>
      </td>
    </tr>
  </table>`;

const financialTable = ({ totalInstallments, perInstallmentAmount, remainingAmount, advanceAmount, installmentPrice }) => `
  <table style="width:100%;border-collapse:collapse;border:1.5px solid #1a1a6e;
                direction:rtl;margin:16px 0;">
    <thead>
      <tr style="background:#e8eaf6;">
        <th class="u" style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-size:13px;">مدت (ماہ)</th>
        <th class="u" style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-size:13px;">قسط</th>
        <th class="u" style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-size:13px;">بقایا</th>
        <th class="u" style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-size:13px;">ایڈوانس</th>
        <th class="u" style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-size:13px;">قسط قیمت</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-weight:700;font-size:14px;">${totalInstallments}</td>
        <td style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-weight:700;font-size:14px;">Rs. ${fmt(perInstallmentAmount)}</td>
        <td style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-weight:700;font-size:14px;">Rs. ${fmt(remainingAmount)}</td>
        <td style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-weight:700;font-size:14px;">Rs. ${fmt(advanceAmount)}</td>
        <td style="border:1px solid #1a1a6e;padding:8px;text-align:center;font-weight:700;font-size:14px;">Rs. ${fmt(installmentPrice)}</td>
      </tr>
    </tbody>
  </table>`;

const guarantorSection = ({ guarantor1 = {}, guarantor2 = {} }) => `
  <!-- Guarantor title -->
  <div style="text-align:center;margin:16px 0 10px;">
    <div style="border:2px solid #1a1a6e;display:inline-block;padding:5px 44px;background:#f0f0ff;">
      <span class="uh" style="font-size:20px;color:#1a1a6e;">ضامن</span>
    </div>
  </div>

  <!-- Shopkeeper sig row -->
  <div style="display:flex;justify-content:space-between;direction:rtl;margin:10px 0;">
    <div style="display:flex;align-items:baseline;gap:8px;">
      <span class="u" style="font-size:12px;line-height:1.8;white-space:nowrap;">دستخط دوکاندار</span>
      <span style="border-bottom:1px solid #333;display:inline-block;min-width:180px;height:18px;"></span>
    </div>
    <div style="display:flex;align-items:baseline;gap:8px;">
      <span class="u" style="font-size:12px;line-height:1.8;white-space:nowrap;">نام دوکاندار</span>
      <span style="border-bottom:1px solid #333;display:inline-block;min-width:150px;height:18px;"></span>
    </div>
  </div>

  ${[{ g: guarantor1, num: '۱' }, { g: guarantor2, num: '۲' }].map(({ g, num }) => `
  <div style="margin:12px 0;direction:rtl;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:nowrap;direction:rtl;">
      <span class="u" style="font-size:12px;font-weight:700;white-space:nowrap;line-height:1.8;">ضامن نمبر ${num}</span>
      <span style="font-weight:700;font-size:13px;min-width:110px;
                   border-bottom:1px solid #333;display:inline-block;height:16px;">
        ${g.fullName || ''}
      </span>
      <span class="u" style="font-size:12px;white-space:nowrap;line-height:1.8;">ولد</span>
      <span style="font-weight:700;font-size:13px;min-width:110px;
                   border-bottom:1px solid #333;display:inline-block;height:16px;">
        ${g.fatherName || ''}
      </span>
      <span class="u" style="font-size:12px;white-space:nowrap;line-height:1.8;">قوم</span>
      <span style="border-bottom:1px solid #333;display:inline-block;min-width:70px;height:16px;"></span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin:6px 0;direction:rtl;">
      <span class="u" style="font-size:12px;font-weight:700;white-space:nowrap;line-height:1.8;">موبائل نمبر</span>
      <span style="font-weight:700;font-size:13px;min-width:160px;
                   border-bottom:1px solid #333;display:inline-block;height:16px;">
        ${g.phone || ''}
      </span>
    </div>
  </div>`).join('')}

  <!-- Guarantor clause -->
  <div class="u" style="border-top:1px solid #ddd;margin-top:10px;padding-top:10px;
                         font-size:12px;color:#1a1a6e;">
    ضامنان مذکورہ اقرار کرتے ہیں کہ اگر خریدار نے قسط ادا نہ کی تو وہ خود قسط ادا کریں گے اور
    خریدار کو مال واپس کرنے پر مجبور کریں گے۔
  </div>`;

const signatureRow = () => `
  <hr style="border:1.5px solid #1a1a6e;margin:16px 0;">
  <div style="display:flex;justify-content:space-between;direction:rtl;gap:16px;margin-top:8px;">
    ${['دستخط فروخت کنندہ اینڈ شوروم', 'دستخط خریدار', 'خریدار کا نام'].map(label => `
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1px solid #333;min-height:36px;margin-bottom:6px;"></div>
        <div class="u" style="font-size:11px;color:#1a1a6e;line-height:1.8;">${label}</div>
      </div>`).join('')}
  </div>`;

// ─── Shared base clauses (Electronics defaults) ───────────────────────────────

const baseClause1 = ({ customerName, fatherName, item }) =>
  `میں ${en(customerName)} ولد ${en(fatherName)} اقرار کرتا/کرتی ہوں کہ مجھے مذکورہ ${item} چیک اور درست حالت میں وصول ہوا ہے۔`;

const baseClause2 = () =>
  `گم ہونے یا خراب ہونے کی صورت میں ماہانہ قسط ہر گز نہیں روکوں گا/گی بلکہ بروقت قسط ادا کرتا/کرتی رہوں گا/گی۔`;

const baseClause3 = ({ perInstallmentAmount, scheduleDay }) =>
  `میں طے شدہ قسط مبلغ ${en('Rs. ' + fmt(perInstallmentAmount))} ہر ${en(String(scheduleDay))} دن بعد فرم کو ادا کرتا/کرتی رہوں گا/گی۔`;

const baseClause4 = () =>
  `میں قسط کی ادائیگی پر اچھی طرح قادر ہوں اور طے شدہ قسط آسانی سے ادا کر سکتا/سکتی ہوں، کوئی عذر حوالے نہیں کروں گا/گی۔`;

const baseClause6 = () =>
  `اگر میری رہائش یا ملازمت کی جگہ تبدیل ہوئی تو دوکان پر نیا ایڈریس دینے کا/کی پابند ہوں۔`;

const baseClause7 = ({ item }) =>
  `اگر میں نے قسط ادا کرنے سے انکار کیا یا ٹال مٹول کیا تو فرم کو حق حاصل ہے کہ وہ ${item} واپس لے لے اور ادا شدہ رقم ضبط ہو گی۔`;

const baseClause8 = () =>
  `میں فرم کے خلاف کوئی قانونی کاروائی نہیں کروں گا/گی۔ تمام اخراجات بشمول وکیل کی فیس میرے ذمہ ہوں گے۔`;

const baseClause9 = () =>
  `میں نے تمام شرائط بغور پڑھ لی اور سمجھ لی ہیں۔`;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ELECTRONICS AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const electronicsAgreementHTML = (data) => {
  const {
    customerName, fatherName, accountNumber, date,
    itemName = 'الیکٹرونکس مال',
    installmentPrice, advanceAmount, remainingAmount,
    perInstallmentAmount, scheduleDay, totalInstallments,
    guarantor1 = {}, guarantor2 = {},
  } = data;

  const d = { customerName, fatherName, perInstallmentAmount, scheduleDay, item: itemName };

  const clauses = [
    clause(1,  baseClause1({ ...d, item: 'الیکٹرونکس مال' })),
    clause(2,  baseClause2()),
    clause(3,  baseClause3(d)),
    clause(4,  baseClause4()),
    clause(5,  `میں نے مذکورہ مال اپنی ذاتی گھریلو ضروریات کیلئے خود اپنی رضامندی سے خریدا ہے۔ میں ہر گز قسط ادائیگی میں کوتاہی یا دھوکہ نہیں کروں گا/گی۔`),
    clause(6,  baseClause6()),
    clause(7,  baseClause7({ item: 'مال' })),
    clause(8,  baseClause8()),
    clause(9,  baseClause9()),
  ].join('');

  return `
  <div style="padding:0 8px;">
    ${sharedHeader()}
    ${titleBox()}
    ${infoRow({ accountNumber, customerName, date })}

    <!-- Clauses -->
    <div style="direction:rtl;margin:10px 0;">${clauses}</div>

    ${financialTable({ totalInstallments, perInstallmentAmount, remainingAmount, advanceAmount, installmentPrice })}
    ${guarantorSection({ guarantor1, guarantor2 })}
    ${signatureRow()}
  </div>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MOTORCYCLE AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const motorcycleAgreementHTML = (data) => {
  const {
    customerName, fatherName, accountNumber, date,
    bikeCompany = '', bikeModel = '', bikeColor = '',
    engineNumber = '—', chassisNumber = '—', registrationNumber = '—',
    installmentPrice, advanceAmount, remainingAmount,
    perInstallmentAmount, scheduleDay, totalInstallments,
    guarantor1 = {}, guarantor2 = {},
  } = data;

  const d = { customerName, fatherName, perInstallmentAmount, scheduleDay };

  const clauses = [
    clause(1,
      `میں ${en(customerName)} ولد ${en(fatherName)} اقرار کرتا/کرتی ہوں کہ مجھے مذکورہ موٹرسائیکل ${en(bikeCompany)} ${en(bikeModel)} رنگ ${en(bikeColor)} انجن نمبر ${en(engineNumber)} چیسس نمبر ${en(chassisNumber)} درست حالت میں وصول ہوئی ہے۔`),
    clause(2,  baseClause2()),
    clause(3,  baseClause3(d)),
    clause(4,  baseClause4()),
    clause(5,  `میں نے مذکورہ موٹرسائیکل اپنی ذاتی ضروریات کیلئے خریدی ہے اور کسی اور کو فروخت یا منتقل نہیں کروں گا/گی۔`),
    clause(6,  baseClause6()),
    clause(7,  baseClause7({ item: 'موٹرسائیکل' })),
    clause(8,  baseClause8()),
    clause(9,  baseClause9()),
    clause(10, `موٹرسائیکل کی رجسٹریشن فرم کے نام پر ہو گی جب تک تمام اقساط ادا نہ ہو جائیں۔`),
  ].join('');

  // Motorcycle detail table
  const detailTable = `
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #1a1a6e;
                  direction:rtl;margin:12px 0;">
      <thead>
        <tr style="background:#e8eaf6;">
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">کمپنی</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">ماڈل</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">رنگ</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">انجن نمبر</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">چیسس نمبر</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:13px;">${bikeCompany}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:13px;">${bikeModel}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:13px;">${bikeColor}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:13px;">${engineNumber}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:13px;">${chassisNumber}</td>
        </tr>
      </tbody>
    </table>`;

  return `
  <div style="padding:0 8px;">
    ${sharedHeader()}
    ${titleBox()}
    ${infoRow({ accountNumber, customerName, date })}

    <div style="direction:rtl;margin:10px 0;">${clauses}</div>

    ${financialTable({ totalInstallments, perInstallmentAmount, remainingAmount, advanceAmount, installmentPrice })}
    ${detailTable}
    ${guarantorSection({ guarantor1, guarantor2 })}
    ${signatureRow()}
  </div>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CAR AGREEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const carAgreementHTML = (data) => {
  const {
    customerName, fatherName, accountNumber, date,
    carMake = '', carModel = '', carYear = '', carColor = '',
    engineNumber = '—', chassisNumber = '—', registrationNumber = '—',
    installmentPrice, advanceAmount, remainingAmount,
    perInstallmentAmount, scheduleDay, totalInstallments,
    guarantor1 = {}, guarantor2 = {},
  } = data;

  const d = { customerName, fatherName, perInstallmentAmount, scheduleDay };

  const clauses = [
    clause(1,
      `میں ${en(customerName)} ولد ${en(fatherName)} اقرار کرتا/کرتی ہوں کہ مجھے مذکورہ گاڑی ${en(carMake)} ${en(carModel)} سال ${en(String(carYear))} رنگ ${en(carColor)} انجن نمبر ${en(engineNumber)} چیسس نمبر ${en(chassisNumber)} درست حالت میں وصول ہوئی ہے۔`),
    clause(2,  baseClause2()),
    clause(3,  baseClause3(d)),
    clause(4,  baseClause4()),
    clause(5,  `میں نے مذکورہ گاڑی اپنی ذاتی ضروریات کیلئے خریدی ہے اور بغیر فرم کی اجازت کے کسی کو فروخت، گروی یا منتقل نہیں کروں گا/گی۔`),
    clause(6,  baseClause6()),
    clause(7,  baseClause7({ item: 'گاڑی' })),
    clause(8,  baseClause8()),
    clause(9,  baseClause9()),
    clause(10, `گاڑی کی رجسٹریشن اور تمام کاغذات فرم کے پاس محفوظ رہیں گے جب تک تمام اقساط مکمل ادا نہ ہو جائیں۔`),
    clause(11, `بیمہ (انشورنس) کا خرچ خریدار کے ذمہ ہو گا۔`),
  ].join('');

  // Car detail table
  const detailTable = `
    <table style="width:100%;border-collapse:collapse;border:1.5px solid #1a1a6e;
                  direction:rtl;margin:12px 0;">
      <thead>
        <tr style="background:#e8eaf6;">
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">کمپنی</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">ماڈل</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">سال</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">رنگ</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">انجن نمبر</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">چیسس نمبر</th>
          <th class="u" style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-size:12px;">رجسٹریشن</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${carMake}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${carModel}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${carYear}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${carColor}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${engineNumber}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${chassisNumber}</td>
          <td style="border:1px solid #1a1a6e;padding:7px;text-align:center;font-weight:700;font-size:12px;">${registrationNumber}</td>
        </tr>
      </tbody>
    </table>`;

  return `
  <div style="padding:0 8px;">
    ${sharedHeader()}
    ${titleBox()}
    ${infoRow({ accountNumber, customerName, date })}

    <div style="direction:rtl;margin:10px 0;">${clauses}</div>

    ${financialTable({ totalInstallments, perInstallmentAmount, remainingAmount, advanceAmount, installmentPrice })}
    ${detailTable}
    ${guarantorSection({ guarantor1, guarantor2 })}
    ${signatureRow()}
  </div>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SALE RECEIPT
// ═══════════════════════════════════════════════════════════════════════════════
export const saleReceiptHTML = (data) => {
  const {
    customerName    = '',
    fatherName      = '',
    cnicNumber      = '',
    address         = '',
    careOf          = '',
    mobile          = '',
    serialNumber    = '',
    date            = '',
    cashPrice       = 0,
    registrationFee = 0,
    totalAmount     = 0,
    bikeCompany     = '',
    bikeModel       = '',
    bikeColor       = '',
    engineNumber    = '',
    chassisNumber   = '',
    receivedCash    = 0,
    pendingCash     = 0,
    totalRupees     = 0,
  } = data;

  const f = (n) => Math.round(Number(n) || 0).toLocaleString('en-PK');

  // Colour options — underline the selected one
  const colorOpts = ['Red', 'Black', 'Selvar', 'Blue'];
  const colorDisplay = colorOpts.map(c =>
    c.toLowerCase() === (bikeColor || '').toLowerCase()
      ? `<strong style="text-decoration:underline;font-size:14px;">${c}</strong>`
      : c
  ).join(' &nbsp;/&nbsp; ');

  // Left-column info rows
  const leftRows = [
    ["Customer's Name", customerName],
    ["Father's Name",   fatherName],
    ["N.I.C #:",        cnicNumber],
    ["Address",         address],
    ["C/o",             careOf],
    ["Mobile",          mobile],
  ].map(([label, val]) => `
    <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:9px;">
      <span style="font-size:12px;font-weight:700;font-style:italic;white-space:nowrap;min-width:105px;flex-shrink:0;">${label}</span>
      <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;padding-bottom:1px;">${val}</span>
    </div>`).join('');

  // Urdu clauses
  const urduClauses = [
    'خریدہ ہوا موٹرسائیکل جو شوروم سے نکلا ہو واپس یا تبدیل نہ ہوگا۔',
    'اگر کسی کسٹمر کو کاغذات بھجوانے ہو تو کراچی نمبر 3 سے 4 مہینے لگ سکتے ہیں۔',
    'اگر ایک سائز پرچی میں کوئی نام ،فیس نمبر ،شناختی کارڈ نمبر میں کوئی غلطی ہو تو 2 دن کے اندر شوروم سے رابطہ کریں۔',
    'ایک مہینے کے اندر اپنے نام پر گاڑی رجسٹر ڈکروالیں، اس کے بعد دکاندار ذمہ دار نہیں ہوگا۔',
  ].map((text, i) => `
    <div style="display:flex;gap:6px;margin:4px 0;direction:rtl;align-items:flex-start;">
      <span style="font-family:'Times New Roman',serif;font-weight:700;color:#8b0000;font-size:11px;min-width:18px;flex-shrink:0;padding-top:6px;">${['۱','۲','۳','۴'][i]}۔</span>
      <span style="font-family:'Noto Nastaliq Urdu',serif;font-size:11px;line-height:2.2;direction:rtl;flex:1;">${text}</span>
    </div>`).join('');

  return `
  <div style="direction:ltr;font-family:'Times New Roman',serif;color:#1a1a6e;position:relative;">

    <!-- ── Diagonal NASEEB watermark ── -->
    <div style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;">
      <svg width="100%" height="100%" style="position:absolute;top:0;left:0;">
        <defs>
          <pattern id="wm" x="0" y="0" width="200" height="130" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <text x="10" y="70" font-family="Times New Roman" font-size="20" fill="#555" opacity="0.08" font-weight="bold">NASEEB</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)"/>
      </svg>
    </div>

    <!-- ══ HEADER ══ -->
    <div style="background:#fdf8e8;padding:10px 14px;border-bottom:4px solid #1a1a6e;position:relative;overflow:hidden;">

      <!-- Leaf decorations: left & right bands -->
      <div style="position:absolute;left:0;top:0;width:42px;height:100%;
                  background:repeating-linear-gradient(180deg,#c8e6c9 0px,#c8e6c9 8px,transparent 8px,transparent 20px);
                  opacity:0.35;"></div>
      <div style="position:absolute;right:0;top:0;width:42px;height:100%;
                  background:repeating-linear-gradient(180deg,#c8e6c9 0px,#c8e6c9 8px,transparent 8px,transparent 20px);
                  opacity:0.35;"></div>

      <!-- Header grid: Logo | Center Titles | Right Info -->
      <div style="display:grid;grid-template-columns:80px 1fr 190px;gap:8px;align-items:center;padding:0 48px;">

        <!-- Left: Galaxy Logo -->
        <div style="background:#111;border:2px solid #555;width:72px;height:72px;
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    box-shadow:2px 2px 6px rgba(0,0,0,0.4);">
          <div style="width:0;height:0;border-left:16px solid transparent;
                      border-right:16px solid transparent;border-bottom:24px solid #c9a227;
                      margin-bottom:4px;"></div>
          <div style="color:#fff;font-size:10px;font-weight:900;letter-spacing:1.5px;">GALAXY</div>
          <div style="color:#aaa;font-size:7px;letter-spacing:0.5px;">MOTORCYCLE</div>
        </div>

        <!-- Center: English + Urdu brand titles -->
        <div style="text-align:center;">
          <div style="font-size:19px;font-weight:900;color:#1a1a6e;letter-spacing:1px;text-transform:uppercase;">
            NASEEB ELECTRONICS &amp; SHOWROOM
          </div>
          <div style="font-family:'Noto Nastaliq Urdu',serif;font-size:26px;font-weight:700;
                      color:#8b0000;direction:rtl;line-height:1.5;margin-top:2px;">
            نصیب الیکٹرونکس اینڈ شوروم
          </div>
        </div>

        <!-- Right: Address badge + phones + company -->
        <div style="text-align:right;">
          <div style="background:#2e7d32;color:#fff;border-radius:12px;padding:3px 8px;
                      font-family:'Noto Nastaliq Urdu',serif;font-size:8.5px;direction:rtl;
                      line-height:1.9;display:inline-block;width:100%;margin-bottom:4px;">
            میرچاکر خان روڈ آغاشہباز مارکیٹ آزادی چوک خضدار
          </div>
          <div style="font-size:11px;font-weight:700;color:#1a1a6e;">📱 0333-7971303</div>
          <div style="font-size:11px;font-weight:700;color:#1a1a6e;">📱 0333-7973444</div>
          <div style="font-family:'Noto Nastaliq Urdu',serif;font-size:9px;color:#555;
                      direction:rtl;margin-top:3px;line-height:1.6;">نصیب A کمپنی</div>
        </div>
      </div>
    </div>

    <!-- ══ BODY ══ -->
    <div style="padding:6px 8px;position:relative;">

      <!-- SALE RECEIPT title box -->
      <div style="text-align:center;margin:10px 0 12px;">
        <div style="display:inline-block;border:2px solid #1a1a6e;padding:4px 44px;">
          <span style="font-size:22px;font-weight:900;font-style:italic;
                       color:#1a1a6e;letter-spacing:3px;">SALE RECEIPT</span>
        </div>
      </div>

      <!-- Customer info: two columns -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 28px;margin:10px 0;">

        <!-- Left col -->
        <div>${leftRows}</div>

        <!-- Right col -->
        <div>
          <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:9px;">
            <span style="font-size:12px;font-weight:700;font-style:italic;white-space:nowrap;min-width:38px;flex-shrink:0;">Sr.#</span>
            <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;">${serialNumber}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:9px;">
            <span style="font-size:12px;font-weight:700;font-style:italic;white-space:nowrap;min-width:56px;flex-shrink:0;">Dated:</span>
            <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;">${date}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:9px;">
            <span style="font-size:12px;font-weight:700;font-style:italic;white-space:nowrap;min-width:120px;flex-shrink:0;">Cash Price</span>
            <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;">Rs. ${f(cashPrice)}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:9px;">
            <span style="font-size:12px;font-weight:700;font-style:italic;white-space:nowrap;min-width:120px;flex-shrink:0;">Registration Fess</span>
            <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;">Rs. ${f(registrationFee)}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:9px;">
            <span style="min-width:120px;flex-shrink:0;"></span>
            <span style="flex:1;border-bottom:1.5px solid #333;min-height:18px;"></span>
          </div>
          <div style="display:flex;align-items:baseline;gap:5px;border-top:2px solid #1a1a6e;padding-top:4px;">
            <span style="font-size:13px;font-weight:900;font-style:italic;white-space:nowrap;min-width:120px;flex-shrink:0;">Total Amount</span>
            <span style="flex:1;border-bottom:2.5px double #333;font-size:13px;font-weight:900;">Rs. ${f(totalAmount)}</span>
          </div>
        </div>
      </div>

      <!-- Motorcycle brands line -->
      <div style="border-top:1.5px solid #1a1a6e;border-bottom:1.5px solid #1a1a6e;
                  text-align:center;padding:5px 0;margin:10px 0;">
        <span style="font-size:14px;font-weight:900;font-style:italic;color:#1a1a6e;">
          Honda &nbsp;/&nbsp; Super Power &nbsp;/&nbsp; Unique &nbsp;/&nbsp; Impress &nbsp;/&nbsp; Express &nbsp;/&nbsp; Glaxy &nbsp;/&nbsp; United
        </span>
      </div>

      <!-- Vehicle details -->
      <div style="margin:10px 0;">

        <!-- Model row -->
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">
          <span style="font-size:13px;font-weight:900;font-style:italic;min-width:55px;flex-shrink:0;">Model:</span>
          <span style="flex:1;border-bottom:1.5px solid #333;font-size:13px;font-weight:700;">${bikeCompany} ${bikeModel}</span>
        </div>

        <!-- Colour row -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:900;font-style:italic;min-width:55px;flex-shrink:0;">Colour:</span>
          <span style="font-size:13px;font-weight:700;">${colorDisplay}</span>
        </div>

        <!-- Engine # + Received Cash -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
          <div>
            <div style="font-size:12px;font-weight:900;font-style:italic;margin-bottom:3px;">Engine #:</div>
            <div style="border:1.5px solid #1a1a6e;padding:5px 8px;font-size:12px;font-weight:700;min-height:26px;">${engineNumber}</div>
          </div>
          <div style="display:flex;align-items:flex-end;gap:6px;padding-bottom:2px;">
            <span style="font-size:12px;font-weight:900;font-style:italic;white-space:nowrap;">Received Cash:</span>
            <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;">Rs. ${f(receivedCash)}</span>
          </div>
        </div>

        <!-- Chasis # + Pending Cash -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <div>
            <div style="font-size:12px;font-weight:900;font-style:italic;margin-bottom:3px;">Chasis #:</div>
            <div style="border:1.5px solid #1a1a6e;padding:5px 8px;font-size:12px;font-weight:700;min-height:26px;">${chassisNumber}</div>
          </div>
          <div style="display:flex;align-items:flex-end;gap:6px;padding-bottom:2px;">
            <span style="font-size:12px;font-weight:900;font-style:italic;white-space:nowrap;">Pending Cash:</span>
            <span style="flex:1;border-bottom:1.5px solid #333;font-size:12px;font-weight:700;">Rs. ${f(pendingCash)}</span>
          </div>
        </div>

        <!-- Total Rupees -->
        <div style="display:flex;align-items:baseline;gap:8px;margin:8px 0 14px;">
          <span style="font-size:14px;font-weight:900;font-style:italic;white-space:nowrap;">Total Rupees:</span>
          <span style="flex:1;border-bottom:2.5px solid #333;font-size:14px;font-weight:900;">Rs. ${f(totalRupees)}</span>
        </div>
      </div>

      <!-- ── Bottom: Urdu clauses (left) + Signature (right) ── -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:10px;align-items:end;">

        <!-- Urdu clauses -->
        <div style="direction:rtl;">${urduClauses}</div>

        <!-- Signature block -->
        <div style="direction:ltr;">
          <div style="margin-bottom:30px;">
            <div style="font-size:12px;font-style:italic;color:#333;margin-bottom:4px;">Receiveds Signature</div>
            <div style="border-bottom:1.5px solid #333;min-width:200px;height:30px;"></div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#555;margin-bottom:3px;">For:</div>
            <div style="font-size:14px;font-weight:900;color:#1a1a6e;letter-spacing:0.5px;">
              NASEEB AUTOS &amp; SHOWROOM
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>`;
};

