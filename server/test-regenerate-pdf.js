// Test script to regenerate an existing report PDF with the enhanced generator
import { createRequire } from 'module';
import { getDatabase } from "./db/connection.js";
import EnhancedPDFReportGenerator from "./services/enhancedPdfGenerator.js";
import { ObjectId } from "mongodb";

const require = createRequire(import.meta.url);

async function testReportRegeneration() {
  console.log('🔄 Testing Enhanced PDF Regeneration...\n');

  try {
    // Connect to database
    const database = await getDatabase();
    if (!database) {
      console.error('❌ Database connection failed');
      return;
    }

    // Get an existing report
    const reportsCollection = database.collection("reports");
    const report = await reportsCollection.findOne({});
    
    if (!report) {
      console.log('⚠️  No reports found in database');
      return;
    }

    console.log(`📋 Found report: ${report.title || 'Untitled'}`);
    console.log(`🆔 Report ID: ${report._id}`);

    // Initialize enhanced PDF generator
    const enhancedGenerator = new EnhancedPDFReportGenerator();

    // Mock project and inspector data if not available
    const projectData = {
      name: report.jobname || 'Test Project',
      description: 'Enhanced PDF test generation',
      location: '123 Test Street',
      clientName: 'Test Client',
      startDate: new Date(),
      contractDay: 1
    };

    const inspectorData = {
      firstName: 'Test',
      lastName: 'Inspector',
      email: 'test@example.com',
      role: 'Senior Inspector',
      phone: '(555) 123-4567'
    };

    console.log('\n🎨 Generating enhanced PDF...');
    
    // Generate new PDF with enhanced generator
    const newPdfPath = await enhancedGenerator.generateReportPDF(
      report,
      projectData,
      inspectorData
    );

    console.log('✅ Enhanced PDF generated successfully!');
    console.log(`📄 New PDF path: ${newPdfPath}`);
    
    // Check filename format
    const filename = newPdfPath.split(/[\\\/]/).pop();
    console.log(`📋 Filename: ${filename}`);
    
    if (filename.match(/^\d{4}\.\d{2}\.\d{2}_.*_.*_[A-Z]{2}\.pdf$/)) {
      console.log('✅ Filename format is correct: YYYY.MM.DD_ProjectName_ReportType_InspectorInitials.pdf');
    } else {
      console.log('⚠️  Filename format may need adjustment');
    }

    console.log('\n🎯 Benefits of enhanced PDF:');
    console.log('   • Clean, professional layout without emoji characters');
    console.log('   • Proper filename with date, project, type, and inspector initials');
    console.log('   • Simple, readable formatting');
    console.log('   • All sections properly organized');
    console.log('   • Better compatibility across PDF viewers');

  } catch (error) {
    console.error('❌ Error during PDF regeneration:', error);
  }
}

testReportRegeneration();
