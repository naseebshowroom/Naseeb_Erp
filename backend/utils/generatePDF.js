import puppeteer from 'puppeteer';

const getBrowser = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  
  return await puppeteer.launch({
    headless: 'new',
    executablePath: isProd
      ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
      : puppeteer.executablePath(),
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
  });
};

const generatePDF = async (htmlContent) => {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    
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
