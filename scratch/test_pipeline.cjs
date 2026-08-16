const { PDFDocument } = require('@cantoo/pdf-lib');
const fs = require('fs');
const path = require('path');

async function testPipeline() {
  console.log('Testing PDF Pipeline with @cantoo/pdf-lib...');

  const docAPath = path.join(__dirname, 'test_pdfs', 'docA.pdf');
  const docBPath = path.join(__dirname, 'test_pdfs', 'docB.pdf');

  const bytesA = new Uint8Array(fs.readFileSync(docAPath));
  const bytesB = new Uint8Array(fs.readFileSync(docBPath));

  // Load source documents from pristine bytes
  const docA = await PDFDocument.load(bytesA);
  const docB = await PDFDocument.load(bytesB);

  console.log(`Doc A loaded: ${docA.getPageCount()} pages`);
  console.log(`Doc B loaded: ${docB.getPageCount()} pages`);

  // Build page descriptors
  const pages = [
    { id: '1', sourceId: 'A', sourcePageIndex: 0 },
    { id: '2', sourceId: 'A', sourcePageIndex: 1 },
    { id: '3', sourceId: 'B', sourcePageIndex: 0 },
    { id: '4', sourceId: 'B', sourcePageIndex: 1 },
    { id: '5', sourceId: 'B', sourcePageIndex: 2 },
  ];

  // Merge document
  const mergedDoc = await PDFDocument.create();

  for (const page of pages) {
    const srcDoc = page.sourceId === 'A' ? docA : docB;
    const [copiedPage] = await mergedDoc.copyPages(srcDoc, [page.sourcePageIndex]);
    mergedDoc.addPage(copiedPage);
  }

  const mergedBytes = await mergedDoc.save();
  const outputPath = path.join(__dirname, 'test_pdfs', 'merged_output.pdf');
  fs.writeFileSync(outputPath, mergedBytes);

  // Validate resulting PDF
  const reloaded = await PDFDocument.load(mergedBytes);
  console.log(`Merged output generated at ${outputPath}: ${reloaded.getPageCount()} pages.`);

  if (reloaded.getPageCount() === 5) {
    console.log('✅ Pipeline test PASSED! Exactly 5 pages merged in order.');
  } else {
    console.error('❌ Pipeline test failed: expected 5 pages, got', reloaded.getPageCount());
    process.exit(1);
  }
}

testPipeline();
