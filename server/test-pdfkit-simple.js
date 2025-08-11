import { createRequire } from 'module';

const require = createRequire(import.meta.url);

console.log('Testing pdfkit import...');
try {
  const PDFDocument = require('pdfkit');
  console.log('✅ PDFDocument loaded:', typeof PDFDocument);
  
  const doc = new PDFDocument();
  console.log('✅ PDFDocument instance created successfully');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Error details:', error);
}
