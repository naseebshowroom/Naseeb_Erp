import puppeteer from 'puppeteer';

let browserInstance = null;
let isGenerating = false;

const getBrowser = async () => {
  if (browserInstance && browserInstance.connected) return browserInstance;

  console.log('[PDF] Launching Chromium...');
  browserInstance = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      ...(process.env.PUPPETEER_EXECUTABLE_PATH
        ? ['--single-process', '--no-zygote']
        : []),
    ],
  });

  browserInstance.on('disconnected', () => {
    console.log('[PDF] Browser disconnected — will relaunch on next request.');
    browserInstance = null;
  });

  console.log('[PDF] Chromium ready.');
  return browserInstance;
};

/**
 * Generates a PDF from an HTML string using a shared Puppeteer browser.
 * Queues concurrent requests to prevent Chromium crashes.
 * @param {string} htmlContent  — body HTML (from documentTemplates.js)
 * @returns {Buffer}            — raw PDF bytes
 */
const generatePDF = async (htmlContent) => {
  // Simple mutex — queue if already generating
  let waited = 0;
  while (isGenerating) {
    if (waited > 30_000) throw new Error('PDF queue timeout — server too busy');
    await new Promise(r => setTimeout(r, 500));
    waited += 500;
  }

  isGenerating = true;
  let page = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    const fullHTML = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { background:#fff; font-family:'Times New Roman',serif; color:#1a1a6e; }
    .u  { font-family:'Noto Nastaliq Urdu',serif; direction:rtl; line-height:2.6; }
    .uh { font-family:'Noto Nastaliq Urdu',serif; direction:rtl; line-height:2.0; font-weight:700; }
    .en { font-family:'Times New Roman',serif; direction:ltr; unicode-bidi:isolate; display:inline-block; font-weight:700; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500)); // let Urdu font settle

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '18mm', right: '18mm' },
      displayHeaderFooter: false,
    });

    console.log(`[PDF] Done — ${Math.round(pdfBuffer.length / 1024)} KB`);
    return pdfBuffer;

  } catch (err) {
    console.error('[PDF] Error:', err.message);
    browserInstance = null; // force relaunch next time
    throw err;
  } finally {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    isGenerating = false;
  }
};

export default generatePDF;
