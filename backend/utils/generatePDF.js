// BUG 7 FIX: Switch from `puppeteer` (full, bundled Chromium) to
// `puppeteer-core` + `@sparticuz/chromium`.
//
// ROOT CAUSE: The full `puppeteer` package downloads its own Chromium during
// `npm install`. On Railway, that bundled Chromium fails to launch because
// the container lacks several required system libraries (libXss, libXcomposite,
// libXrandr etc.) that are not listed in railpack.json.
//
// @sparticuz/chromium is a pre-compiled, statically-linked Chromium binary
// purpose-built for serverless/container environments. It works on Railway
// without any extra apt packages.
//
// REQUIRED: Run these commands in /backend:
//   npm install puppeteer-core @sparticuz/chromium
//   npm uninstall puppeteer
// AND update backend/package.json accordingly.

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const getBrowser = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Railway / serverless path — use the sparticuz statically-linked binary
    return await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  // Local dev path — use locally installed Chrome / Chromium
  const localChromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',       // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',    // macOS
    '/usr/bin/google-chrome',                                           // Linux
    '/usr/bin/chromium-browser',                                        // Linux Chromium
  ].filter(Boolean);

  // Find the first Chrome/Chromium path that actually exists on this machine
  const executablePath = localChromePaths.find((p) => existsSync(p)) || localChromePaths[0];

  return await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    timeout: 30000,
  });
};



const generatePDF = async (htmlContent) => {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    
    const fullHTML = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; font-family:'Times New Roman',serif; color:#000; direction: ltr !important; }
    .urdu { font-family:'Noto Nastaliq Urdu',serif; direction:rtl; unicode-bidi:isolate; display:inline-block; line-height:2.2; }
    .urdu-block { font-family:'Noto Nastaliq Urdu',serif; direction:rtl; unicode-bidi:isolate; display:block; text-align:right; line-height:2.2; }
    .english { direction:ltr; unicode-bidi:isolate; display:inline-block; font-family:'Times New Roman',serif; }
    .u  { font-family:'Noto Nastaliq Urdu',serif; direction:rtl; line-height:2.6; }
    .uh { font-family:'Noto Nastaliq Urdu',serif; direction:rtl; line-height:2.0; font-weight:700; }
    .en { font-family:'Times New Roman',serif; direction:ltr; unicode-bidi:isolate; display:inline-block; font-weight:700; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

    await page.setContent(fullHTML, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait extra for Urdu font (Noto Nastaliq loads slowly)
    await new Promise(r => setTimeout(r, 1500));

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
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // ALWAYS close browser even if error occurs
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
};

export default generatePDF;
