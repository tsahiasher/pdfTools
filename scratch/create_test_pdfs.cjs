const { PDFDocument, rgb, StandardFonts } = require('@cantoo/pdf-lib');
const fs = require('fs');
const path = require('path');

async function createTestPdfs() {
  const scratchDir = path.join(__dirname, 'test_pdfs');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  // 1. Doc A (2 pages)
  const docA = await PDFDocument.create();
  const font = await docA.embedFont(StandardFonts.HelveticaBold);
  
  const pageA1 = docA.addPage([400, 500]);
  pageA1.drawText('Document A - Page 1', { x: 50, y: 400, size: 24, font, color: rgb(0.2, 0.4, 0.8) });
  pageA1.drawRectangle({ x: 50, y: 200, width: 100, height: 100, color: rgb(0.8, 0.2, 0.2) });

  const pageA2 = docA.addPage([400, 500]);
  pageA2.drawText('Document A - Page 2', { x: 50, y: 400, size: 24, font, color: rgb(0.2, 0.4, 0.8) });
  pageA2.drawCircle({ x: 150, y: 250, size: 50, color: rgb(0.2, 0.8, 0.3) });

  const bytesA = await docA.save();
  fs.writeFileSync(path.join(scratchDir, 'docA.pdf'), bytesA);

  // 2. Doc B (3 pages)
  const docB = await PDFDocument.create();
  const fontB = await docB.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= 3; i++) {
    const page = docB.addPage([500, 350]);
    page.drawText(`Document B - Page ${i} of 3`, { x: 40, y: 280, size: 20, font: fontB, color: rgb(0.1, 0.6, 0.5) });
    page.drawRectangle({ x: 40, y: 100, width: 200, height: 80, borderColor: rgb(0.1, 0.1, 0.8), borderWidth: 2 });
  }

  const bytesB = await docB.save();
  fs.writeFileSync(path.join(scratchDir, 'docB.pdf'), bytesB);

  console.log('Created docA.pdf (2 pages) and docB.pdf (3 pages) in', scratchDir);
}

createTestPdfs();
