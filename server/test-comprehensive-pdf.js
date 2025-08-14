// Test script to generate a comprehensive PDF with all possible report fields
import { createRequire } from 'module';
import EnhancedPDFReportGenerator from "./services/enhancedPdfGenerator.js";

const require = createRequire(import.meta.url);

async function testComprehensivePDF() {
  console.log('🔄 Testing Comprehensive PDF with All Report Fields...\n');

  try {
    // Create a comprehensive test report with many fields
    const comprehensiveReport = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Comprehensive Foundation Inspection Report',
      author: 'John Smith',
      jobname: 'Downtown Office Complex',
      jobid: 'DOC-2025-001',
      inspectionType: 'Foundation Inspection',
      status: 'Completed',
      content: `This is a comprehensive inspection report that covers all aspects of the foundation work completed on August 14, 2025. The inspection was conducted following industry standards and safety protocols. All concrete pours were observed and documented. The foundation meets all structural requirements and specifications outlined in the project plans. Quality control measures were implemented throughout the process. No major defects or issues were identified during the inspection. Minor cosmetic issues were noted and addressed immediately. The work progresses according to schedule with no delays expected.`,
      findings: `Concrete strength test results show compliance with design specifications (4000 PSI achieved). Rebar placement and spacing conform to structural drawings. Foundation dimensions are within acceptable tolerances (+/- 1/4 inch). Waterproofing membrane properly installed and inspected. Drainage systems functioning as designed. No honeycombing or cold joints observed. Surface finish is smooth and uniform. Anchor bolts positioned correctly for structural steel placement.`,
      recommendations: `Proceed with backfill operations after 48-hour cure time. Install perimeter drainage before final grading. Apply additional waterproofing coating at specified locations. Schedule structural steel erection for next phase. Continue monitoring concrete cure strength. Document any weather-related delays or impacts. Maintain proper site drainage during construction.`,
      createdAt: new Date(),
      
      // Weather data
      weather: {
        temperature: 72,
        description: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 8,
        windDirection: 'Southwest',
        pressure: 30.15
      },
      
      // Additional comprehensive fields
      photos: ['foundation_north.jpg', 'rebar_placement.jpg', 'concrete_pour.jpg'],
      attachments: ['test_results.pdf', 'structural_drawings.dwg'],
      tags: ['foundation', 'concrete', 'structural', 'quality-control'],
      priority: 'High',
      category: 'Structural Inspection',
      location: 'Foundation - North Section',
      duration: '4.5 hours',
      equipmentUsed: ['Concrete pump truck', 'Vibrating equipment', 'Testing equipment'],
      materials: ['Concrete mix design 4000 PSI', '#5 Rebar', 'Waterproofing membrane'],
      safetyNotes: 'All safety protocols followed. PPE worn by all personnel. No incidents reported.',
      quality: 'Exceeds Standards',
      progress: '85% Complete',
      issues: 'Minor formwork adjustment required at corner section',
      delays: 'None - work proceeding on schedule',
      nextSteps: 'Begin curing process, schedule next inspection in 48 hours',
      signature: 'John Smith, P.E.',
      approved: true,
      reviewedBy: 'Sarah Johnson, Project Manager',
      completionPercentage: 85,
      weatherAffected: false,
      laborHours: 36,
      costImpact: 'None',
      scheduleImpact: 'None',
      rework: 'None required',
      defects: 'None identified'
    };

    // Mock project data
    const projectData = {
      name: 'Downtown Office Complex',
      description: 'Multi-story office building construction project',
      location: '123 Business District, Downtown',
      clientName: 'Metropolitan Development Corp',
      startDate: new Date('2025-07-01'),
      contractDay: 44
    };

    // Mock inspector data
    const inspectorData = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@construction.com',
      role: 'Senior Structural Inspector',
      phone: '(555) 123-4567'
    };

    console.log('🎨 Generating comprehensive PDF with all fields...');
    
    // Initialize enhanced PDF generator
    const enhancedGenerator = new EnhancedPDFReportGenerator();
    
    // Generate comprehensive PDF
    const pdfPath = await enhancedGenerator.generateReportPDF(
      comprehensiveReport,
      projectData,
      inspectorData
    );

    console.log('✅ Comprehensive PDF generated successfully!');
    console.log(`📄 PDF location: ${pdfPath}`);
    
    // Check filename format
    const filename = pdfPath.split(/[\\\/]/).pop();
    console.log(`📋 Filename: ${filename}`);
    
    console.log('\n📊 Report Content Summary:');
    console.log('=====================================');
    console.log(`• Title: ${comprehensiveReport.title}`);
    console.log(`• Author: ${comprehensiveReport.author}`);
    console.log(`• Job: ${comprehensiveReport.jobname} (${comprehensiveReport.jobid})`);
    console.log(`• Type: ${comprehensiveReport.inspectionType}`);
    console.log(`• Status: ${comprehensiveReport.status}`);
    console.log(`• Content: ${comprehensiveReport.content.length} characters`);
    console.log(`• Findings: ${comprehensiveReport.findings.length} characters`);
    console.log(`• Recommendations: ${comprehensiveReport.recommendations.length} characters`);
    console.log(`• Weather: ${comprehensiveReport.weather.temperature}°F, ${comprehensiveReport.weather.description}`);
    console.log(`• Photos: ${comprehensiveReport.photos.length} files`);
    console.log(`• Additional fields: ${Object.keys(comprehensiveReport).length - 11} extra fields`);

    console.log('\n✅ All report information should now be included in the PDF!');
    console.log('The enhanced PDF generator includes:');
    console.log('   • Project information');
    console.log('   • Inspector details');
    console.log('   • Report metadata');
    console.log('   • Weather conditions');
    console.log('   • Full content, findings, and recommendations');
    console.log('   • All additional report fields');
    console.log('   • Proper text wrapping and page breaks');

  } catch (error) {
    console.error('❌ Error during comprehensive PDF generation:', error);
  }
}

testComprehensivePDF();
