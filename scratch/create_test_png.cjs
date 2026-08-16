const fs = require('fs');
const path = require('path');

// Generate a minimal valid 1x1 or 100x100 PNG
function createTestPng() {
  const scratchDir = path.join(__dirname, 'test_pdfs');
  // 1x1 red PNG base64
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAPElEQVR42u3RAQ0AAAgDoNu/tD2mBhZgkp6ZkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkHDlAZh3AWd9jLd+AAAAAElFTkSuQmCC';
  const buffer = Buffer.from(base64Png, 'base64');
  fs.writeFileSync(path.join(scratchDir, 'test_image.png'), buffer);
  console.log('Created test_image.png in', scratchDir);
}

createTestPng();
