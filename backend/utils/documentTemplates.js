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

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CASH SALE RECEIPT
// ═══════════════════════════════════════════════════════════════════════════════
export const cashSaleReceiptHTML = (data) => {
  const {
    customerName = '', fatherName = '', cnic = '', phone = '',
    address = '', date = '', serialNumber = '',
    installmentPrice = 0, registrationFee = 0,
    brand = '', model = '', color = '', engineNumber = '', chassisNumber = '',
    investorName = '', khataNumber = '', isOwnerCopy = false,
  } = data;
  const f = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString('en-PK')}`;
  const total = Number(installmentPrice) + Number(registrationFee);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Times New Roman',serif;color:#1a1a6e;margin:0;padding:20px;}
    .hdr{border-bottom:4px solid #1a1a6e;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;}
    .badge{background:#1a1a6e;color:#fff;padding:3px 10px;font-size:12px;font-weight:700;letter-spacing:1px;display:inline-block;}
    .title-box{text-align:center;margin:14px 0;}
    .title-box span{border:2.5px solid #1a1a6e;padding:6px 44px;font-size:20px;font-weight:900;letter-spacing:2px;display:inline-block;}
    .row{display:flex;gap:8px;margin-bottom:10px;align-items:baseline;}
    .row label{font-weight:700;font-style:italic;min-width:140px;flex-shrink:0;font-size:13px;}
    .row span{flex:1;border-bottom:1.5px solid #333;font-size:13px;font-weight:700;padding-bottom:2px;}
    .total-box{background:#f0f0ff;border:2px solid #1a1a6e;padding:10px 16px;margin:14px 0;text-align:center;font-size:18px;font-weight:900;}
    .note{background:#fff8e1;border-left:4px solid #f59e0b;padding:10px 14px;margin:14px 0;font-size:12px;}
    .sig-block{margin-top:40px;display:flex;justify-content:space-between;}
    .sig-line{border-top:1.5px solid #333;margin-top:36px;padding-top:6px;font-size:11px;color:#555;}
  </style></head><body>
  <div class="hdr">
    <div><div class="badge">NASEEB</div><div style="font-size:11px;font-weight:700;">AUTOS &amp; SHOWROOM</div><div style="font-size:10px;color:#333;">Ph: 0333-7971303</div></div>
    <div style="text-align:center;"><div style="font-size:13px;font-weight:900;text-transform:uppercase;">SALE RECEIPT (CASH)</div><div style="font-size:10px;color:#555;">نقد فروخت رسید</div></div>
    <div style="text-align:right;font-size:12px;"><div><b>Date:</b> ${date}</div><div><b>Khata #:</b> ${khataNumber||'—'}</div><div><b>Sr.#:</b> ${serialNumber}</div></div>
  </div>
  <div class="title-box"><span>CASH SALE RECEIPT</span></div>
  <div class="row"><label>Customer Name:</label><span>${customerName}</span></div>
  <div class="row"><label>Father's Name:</label><span>${fatherName}</span></div>
  <div class="row"><label>CNIC:</label><span>${cnic||'N/A'}</span></div>
  <div class="row"><label>Phone:</label><span>${phone}</span></div>
  <div class="row"><label>Address:</label><span>${address}</span></div>
  <hr style="border:1.5px solid #1a1a6e;margin:14px 0;">
  <div class="row"><label>Item:</label><span>${brand} ${model}${color?' — '+color:''}</span></div>
  ${engineNumber?`<div class="row"><label>Engine #:</label><span>${engineNumber}</span></div>`:''}
  ${chassisNumber?`<div class="row"><label>Chassis #:</label><span>${chassisNumber}</span></div>`:''}
  <div class="total-box">Total Sale Price / کل قیمت: ${f(installmentPrice)}
    ${registrationFee>0?`<div style="font-size:13px;margin-top:4px;">Registration Fee: ${f(registrationFee)}</div><div style="font-size:16px;margin-top:6px;border-top:1px solid #1a1a6e;padding-top:6px;">TOTAL PAID: ${f(total)}</div>`:''}
  </div>
  <div class="note">✅ Full payment received. No installments pending.<br><b>نقد رقم مکمل وصول ہو گئی۔ کوئی قسط باقی نہیں۔</b></div>
  ${isOwnerCopy&&investorName?`<div style="font-size:11px;color:#666;text-align:right;">Investor: <b>${investorName}</b></div>`:''}
  <div class="sig-block">
    <div style="text-align:center;min-width:140px;"><div class="sig-line">Customer Signature<br>دستخط خریدار</div></div>
    <div style="text-align:center;min-width:140px;"><div class="sig-line">For: NASEEB AUTOS &amp; SHOWROOM</div></div>
  </div></body></html>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CUSTOMER STATEMENT / KHATA PRINT
// ═══════════════════════════════════════════════════════════════════════════════
export const customerStatementHTML = (data) => {
  const {
    customerName='',fatherName='',cnic='',phone='',address='',
    khataNumber='',date='',brand='',model='',color='',
    engineNumber='',chassisNumber='',
    installmentPrice=0,advanceAmount=0,perInstallmentAmount=0,
    scheduleType='',investorName='',
    schedule=[],
    summary={totalPaid:0,totalMissed:0,totalPending:0,arrears:0},
  } = data;
  const f=(n)=>`Rs. ${Math.round(Number(n)||0).toLocaleString('en-PK')}`;
  const icon=(s)=>s==='paid'?'✅ Paid':s==='missed'?'❌ MISSED':'🟡 Pending';
  const clr=(s)=>s==='paid'?'#166534':s==='missed'?'#991b1b':'#92400e';
  const bg=(s)=>s==='paid'?'#f0fdf4':s==='missed'?'#fef2f2':'#fffbeb';
  const rows=schedule.map(s=>`<tr style="background:${bg(s.status)};">
    <td style="padding:6px 10px;border:1px solid #ddd;font-size:12px;">${s.dueDate?new Date(s.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
    <td style="padding:6px 10px;border:1px solid #ddd;font-size:12px;text-align:center;">${f(s.status==='paid'?(s.paidAmount||perInstallmentAmount):perInstallmentAmount)}</td>
    <td style="padding:6px 10px;border:1px solid #ddd;font-size:12px;font-weight:700;color:${clr(s.status)};">${icon(s.status)}${s.status==='paid'&&s.paidDate?' — '+new Date(s.paidDate).toLocaleDateString('en-GB'):''}</td>
    <td style="padding:6px 10px;border:1px solid #ddd;font-size:11px;color:#555;">${s.collectedBy?.name||''}</td>
  </tr>`).join('');
  const missedRows=schedule.filter(s=>s.status==='missed').map(s=>`<div style="display:flex;justify-content:space-between;border-bottom:1px dotted #ddd;padding:4px 0;"><span style="font-size:12px;color:#991b1b;font-weight:700;">❌ ${new Date(s.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span><span style="font-size:12px;font-weight:700;">${f(perInstallmentAmount)}</span></div>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Times New Roman',serif;color:#111;margin:0;padding:20px;font-size:13px;}
    table{border-collapse:collapse;width:100%;}th{background:#e8eaf6;border:1px solid #1a1a6e;padding:8px;font-size:12px;}
    .hdr{background:#1a1a6e;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0;}
    .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;}
    .card .v{font-size:15px;font-weight:900;margin-top:4px;}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;}
    .irow{display:flex;gap:6px;margin-bottom:6px;}
    .irow label{font-weight:700;min-width:110px;color:#555;font-size:12px;}
    .irow span{font-weight:700;font-size:12px;}
    .sec{font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#1a1a6e;border-bottom:2px solid #1a1a6e;padding-bottom:4px;margin:16px 0 10px;}
    .arr{background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:12px;margin:12px 0;}
  </style></head><body>
  <div class="hdr"><div><div style="font-size:18px;font-weight:900;">NASEEB AUTOS &amp; SHOWROOM</div><div style="font-size:11px;opacity:.8;">Ph: 0333-7971303 | Khuzdar</div></div><div style="text-align:right;"><div style="font-size:13px;font-weight:700;">CUSTOMER STATEMENT / KHATA</div><div style="font-size:11px;opacity:.8;">Date: ${date}</div></div></div>
  <div class="info"><div>
    <div class="irow"><label>Customer:</label><span>${customerName}</span></div>
    <div class="irow"><label>Father:</label><span>${fatherName}</span></div>
    <div class="irow"><label>Phone:</label><span>${phone}</span></div>
    <div class="irow"><label>CNIC:</label><span>${cnic||'N/A'}</span></div>
  </div><div>
    <div class="irow"><label>Khata #:</label><span>${khataNumber||'—'}</span></div>
    <div class="irow"><label>Item:</label><span>${brand} ${model}${color?' ('+color+')':''}</span></div>
    ${engineNumber?`<div class="irow"><label>Engine #:</label><span>${engineNumber}</span></div>`:''}
    ${chassisNumber?`<div class="irow"><label>Chassis #:</label><span>${chassisNumber}</span></div>`:''}
  </div></div>
  <div style="background:#f0f0ff;border:1.5px solid #1a1a6e;padding:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0;">
    <div><div style="font-size:11px;color:#555;">Total Price</div><div style="font-size:16px;font-weight:900;color:#1a1a6e;">${f(installmentPrice)}</div></div>
    <div><div style="font-size:11px;color:#555;">Advance</div><div style="font-size:15px;font-weight:700;">${advanceAmount>0?f(advanceAmount):'No Advance'}</div></div>
    <div><div style="font-size:11px;color:#555;">Per Qist</div><div style="font-size:15px;font-weight:700;">${f(perInstallmentAmount)} (${scheduleType})</div></div>
  </div>
  <div class="sec">Summary</div>
  <div class="grid4">
    <div class="card"><div style="font-size:11px;color:#166534;">Paid</div><div class="v" style="color:#166534;">${f(summary.totalPaid)}</div></div>
    <div class="card"><div style="font-size:11px;color:#991b1b;">Missed</div><div class="v" style="color:#991b1b;">${f(summary.totalMissed)}</div></div>
    <div class="card"><div style="font-size:11px;color:#92400e;">Pending</div><div class="v" style="color:#92400e;">${f(summary.totalPending)}</div></div>
    <div class="card"><div style="font-size:11px;color:#dc2626;">Arrears</div><div class="v" style="color:#dc2626;">${f(summary.arrears)}</div></div>
  </div>
  <div class="sec">Payment History</div>
  <table><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Collected By</th></tr></thead><tbody>${rows}</tbody></table>
  ${missedRows?`<div class="arr"><div style="font-weight:900;color:#dc2626;font-size:13px;margin-bottom:8px;">BAQAYA TAREEKHAIN (MISSED DATES)</div>${missedRows}<div style="margin-top:8px;padding-top:8px;border-top:1px solid #dc2626;font-weight:900;color:#dc2626;">Total Baqaya: ${f(summary.arrears)}</div></div>`:''}
  <div style="margin-top:20px;display:flex;justify-content:space-between;">
    <div style="font-size:11px;color:#555;">Investor: ${investorName||'Owner'}</div>
    <div style="text-align:center;min-width:160px;"><div style="border-top:1px solid #333;margin-top:36px;padding-top:6px;font-size:11px;">Owner Signature</div></div>
  </div></body></html>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. DISTRIBUTOR LETTER (Return / Purchase Confirmation)
// ═══════════════════════════════════════════════════════════════════════════════
export const distributorLetterHTML = (data) => {
  const {
    distributorName='',distributorAddress='',
    brand='',model='',color='',engineNumber='',chassisNumber='',
    dateSupplied='',unitPrice=0,date='',letterType='purchase',ownerName='Naseeb',
  } = data;
  const f=(n)=>`Rs. ${Math.round(Number(n)||0).toLocaleString('en-PK')}`;
  const subject=letterType==='return'?'Vehicle Return / گاڑی واپسی':'Purchase Confirmation / خریداری';
  const body=letterType==='return'
    ?'We are returning the following vehicle to your stock. Please confirm receipt.'
    :'We hereby confirm the purchase of the following vehicle from your dealership.';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Times New Roman',serif;color:#1a1a6e;margin:0;padding:40px;font-size:14px;max-width:680px;}
    .hdr{border-bottom:3px solid #1a1a6e;padding-bottom:12px;margin-bottom:24px;display:flex;justify-content:space-between;}
    table{width:100%;border-collapse:collapse;margin:20px 0;}
    td{padding:8px 12px;border:1px solid #1a1a6e;}
    td:first-child{font-weight:700;width:140px;background:#f0f0ff;}
  </style></head><body>
  <div class="hdr"><div><div style="font-size:20px;font-weight:900;">NASEEB AUTOS &amp; SHOWROOM</div><div style="font-size:11px;color:#555;">Ph: 0333-7971303 | Khuzdar</div></div><div style="text-align:right;font-size:12px;">Date: <b>${date}</b></div></div>
  <p><b>To:</b> ${distributorName}${distributorAddress?'<br><span style="color:#555;">'+distributorAddress+'</span>':''}</p>
  <p style="font-size:15px;font-weight:700;border-bottom:1px solid #ddd;padding-bottom:8px;">Subject: ${subject}</p>
  <p>${body}</p>
  <table>
    <tr><td>Brand</td><td><b>${brand}</b></td></tr>
    <tr><td>Model</td><td><b>${model}</b></td></tr>
    <tr><td>Color</td><td><b>${color||'—'}</b></td></tr>
    <tr><td>Engine #</td><td><b>${engineNumber||'—'}</b></td></tr>
    <tr><td>Chassis #</td><td><b>${chassisNumber||'—'}</b></td></tr>
    <tr><td>Date Supplied</td><td><b>${dateSupplied?new Date(dateSupplied).toLocaleDateString('en-GB'):'—'}</b></td></tr>
    <tr><td>Amount</td><td><b style="font-size:15px;">${f(unitPrice)}</b></td></tr>
  </table>
  <p style="font-size:12px;color:#555;">${letterType==='return'?'The customer has returned/defaulted and we are returning this vehicle per our agreement.':'This letter serves as purchase confirmation. Please keep for your records.'}</p>
  <div style="margin-top:60px;text-align:right;"><p>Regards,</p><div style="margin-top:40px;border-top:1px solid #333;width:200px;display:inline-block;padding-top:6px;font-size:12px;">${ownerName}<br>NASEEB AUTOS &amp; SHOWROOM</div></div>
  </body></html>`;
};
