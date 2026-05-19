import generatePDF from './utils/generatePDF.js';

async function run() {
  console.log('PDF compile test starting...');
  try {
    const pdf = await generatePDF('<h1>Naseeb PDF Test</h1>');
    console.log('PDF Compiled successfully! Buffer size:', pdf.length);
  } catch (err) {
    console.error('CRITICAL PDF COMPILE FAILURE:', err);
  }
}

run();
