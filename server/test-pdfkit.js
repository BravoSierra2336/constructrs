import PDFDocument from 'pdfkit';

console.log('Testing pdfkit import...');
try {
  const doc = new PDFDocument();
  console.log('✓ PDFDocument created successfully');
  console.log('✓ pdfkit is working correctly');
} catch (error) {
  console.error('✗ Error creating PDFDocument:', error.message);
  process.exit(1);
}
