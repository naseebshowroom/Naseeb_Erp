import puppeteer from 'puppeteer';

const getBrowser = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const launchOptions = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-extensions',
    ],
    timeout: 30000,
  };

  if (isProduction) {
    // On Railway: PUPPETEER_EXECUTABLE_PATH env var takes priority,
    // then fall back to known system Chromium paths (set by nixpacks.toml)
    const chromiumPath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      '/usr/bin/chromium'          ||   // Railway / nixpacks default
      '/usr/bin/chromium-browser';      // Debian/Ubuntu alias

    launchOptions.executablePath = chromiumPath;
  } else {
    // Local dev: let Puppeteer use its own bundled Chrome
    try {
      launchOptions.executablePath = puppeteer.executablePath();
    } catch (_) {
      // Ignored — Puppeteer will find Chrome automatically
    }
  }

  try {
    return await puppeteer.launch(launchOptions);
  } catch (err) {
    console.warn('[PDF] Primary launch failed, retrying with system channel...', err.message);
    return await puppeteer.launch({ ...launchOptions, channel: 'chrome', executablePath: undefined });
  }
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
