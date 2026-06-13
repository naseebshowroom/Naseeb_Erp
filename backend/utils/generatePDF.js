/**
 * generatePDF.js
 *
 * Uses @sparticuz/chromium + puppeteer-core.
 *
 * WHY NOT full `puppeteer`:
 *   The full `puppeteer` package bundles its own Chromium binary that requires
 *   system libraries (libnss3, libXss, libXcomposite, etc.) NOT present in
 *   Railway's minimal Linux container. Result: "cannot open shared object file"
 *   crash at launch time.
 *
 * WHY @sparticuz/chromium:
 *   Ships a pre-compiled, *statically-linked* Chromium binary specifically built
 *   for containerised/serverless environments (Railway, Render, Lambda, Vercel).
 *   No system libraries required. Works on Windows/macOS locally too because it
 *   falls back to local Chrome when not in production.
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

// ---------------------------------------------------------------------------
// Browser factory
// ---------------------------------------------------------------------------

const getBrowser = async () => {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    /**
     * Production / Railway path.
     *
     * chromium.args    — correct flags for a headless container
     * chromium.executablePath() — returns the path inside the @sparticuz
     *                             package's bundled binary (no system Chrome needed)
     * headless: true   — use the new headless mode (string 'new' is also accepted
     *                    by puppeteer-core ≥ v21)
     */
    const executablePath = await chromium.executablePath();
    console.log('[PDF] Production mode — Chromium path:', executablePath);

    return puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-web-security',       // needed for Google Fonts @import
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,                   // works with puppeteer-core v21 + v22
    });
  }

  /**
   * Local dev path (Windows / macOS / Linux).
   * Tries common Chrome install locations in order.
   */
  const localPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,                              // explicit override
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',       // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',    // macOS
    '/usr/bin/google-chrome-stable',                                    // Linux stable
    '/usr/bin/google-chrome',                                           // Linux generic
    '/usr/bin/chromium-browser',                                        // Debian/Ubuntu
    '/usr/bin/chromium',                                                // Alpine / Arch
  ].filter(Boolean);

  const executablePath = localPaths.find((p) => existsSync(p));
  if (!executablePath) {
    throw new Error(
      '[PDF] Could not find Chrome/Chromium locally. ' +
      'Set PUPPETEER_EXECUTABLE_PATH in your .env to point to chrome.exe / google-chrome.'
    );
  }

  console.log('[PDF] Local dev mode — Chrome path:', executablePath);

  return puppeteer.launch({
    headless: 'new',
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
    ],
    timeout: 30000,
  });
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const generatePDF = async (htmlContent) => {
  let browser = null;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    const fullHTML = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { background: white; width: 210mm; font-family: 'Times New Roman', serif; color: #000; }
    .urdu       { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; unicode-bidi: isolate; display: inline-block; line-height: 2.2; }
    .urdu-block { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; unicode-bidi: isolate; display: block; text-align: right; line-height: 2.2; }
    .u          { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; line-height: 2.6; }
    .uh         { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; line-height: 2.0; font-weight: 700; }
    .english    { direction: ltr; unicode-bidi: isolate; display: inline-block; font-family: 'Times New Roman', serif; }
    .en         { font-family: 'Times New Roman', serif; direction: ltr; unicode-bidi: isolate; display: inline-block; font-weight: 700; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

    await page.setContent(fullHTML, {
      waitUntil: 'networkidle0',  // waits for Google Fonts to fully load
      timeout: 30000,
    });

    // Extra wait for Noto Nastaliq Urdu font rendering (slow CDN load)
    await new Promise((r) => setTimeout(r, 1500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '18mm',
        right: '18mm',
      },
    });

    return pdfBuffer;

  } catch (error) {
    console.error('[PDF] generatePDF failed:', error.message);
    // Re-throw with clear message so PDF routes can return it to the frontend
    throw new Error(`PDF generation failed: ${error.message}`);

  } finally {
    // ALWAYS close browser — even if PDF generation throws
    if (browser) {
      await browser.close().catch((e) => {
        console.warn('[PDF] browser.close() error (ignored):', e.message);
      });
    }
  }
};

export default generatePDF;
