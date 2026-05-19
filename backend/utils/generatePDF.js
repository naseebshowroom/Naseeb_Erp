import puppeteer from 'puppeteer';

const getBrowser = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  
  const options = {
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
    ],
    timeout: 30000,
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (isProd && process.platform !== 'win32') {
    options.executablePath = '/usr/bin/chromium-browser';
  } else {
    try {
      options.executablePath = puppeteer.executablePath();
    } catch (e) {
      // Ignored - fallback will handle it
    }
  }

  try {
    return await puppeteer.launch(options);
  } catch (err) {
    console.warn('Primary puppeteer launch failed, attempting to launch with local Chrome channel...', err.message);
    // Fallback: try launching with the user's installed Google Chrome
    return await puppeteer.launch({
      ...options,
      channel: 'chrome',
      executablePath: undefined, // Let Puppeteer find system Chrome
    });
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
