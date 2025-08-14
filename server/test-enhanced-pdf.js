import PDFReportGenerator from './services/pdfGenerator.js';

async function testEnhancedPDF() {
  console.log('🎨 Testing enhanced PDF generation...');
  
  const generator = new PDFReportGenerator();
  
  // Sample report data
  const reportData = {
    _id: '674b8c9d123456789abcdef0',
    title: 'Daily Construction Inspection Report',
    content: 'Today\'s inspection revealed excellent progress on the foundation work. The concrete pour was completed successfully with proper curing procedures in place. All safety protocols were followed during the installation of rebar framework. Weather conditions were favorable for construction activities.\n\nKey observations:\n• Foundation walls are progressing on schedule\n• Quality of workmanship meets specifications\n• Safety equipment properly utilized by all workers\n• Material deliveries arrived on time\n• No safety incidents reported',
    author: 'John Martinez',
    jobname: 'Downtown Office Complex',
    jobid: 'DOC-2025-001',
    inspectionType: 'Foundation',
    createdAt: new Date().toISOString(),
    weather: {
      temperature: 72,
      description: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 8
    }
  };
  
  // Sample project data
  const projectData = {
    name: 'Downtown Office Complex Phase II',
    description: 'Modern 15-story office building with underground parking and retail space',
    location: '1234 Main Street, Downtown City, ST 12345',
    clientName: 'Metropolitan Development Corp',
    startDate: '2025-01-15',
    endDate: '2025-12-31',
    contractDay: 45
  };
  
  // Sample inspector data
  const inspectorData = {
    firstName: 'John',
    lastName: 'Martinez',
    email: 'j.martinez@construction.com',
    jobName: 'Senior Construction Inspector',
    role: 'inspector'
  };
  
  try {
    const pdfPath = await generator.generateReportPDF(reportData, projectData, inspectorData);
    console.log('✅ Enhanced PDF generated successfully!');
    console.log('📄 File location:', pdfPath);
    console.log('🎯 Key improvements added:');
    console.log('   • Professional header with color scheme');
    console.log('   • Section backgrounds and borders');
    console.log('   • Icons for visual appeal');
    console.log('   • Two-column layouts for efficiency');
    console.log('   • Weather conditions section');
    console.log('   • Enhanced typography and spacing');
    console.log('   • Color-coded content areas');
    console.log('   • Professional footer design');
  } catch (error) {
    console.error('❌ Error generating enhanced PDF:', error);
  }
}

testEnhancedPDF();
