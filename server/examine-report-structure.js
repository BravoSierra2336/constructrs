// Comprehensive test to examine report structure and identify missing fields
import { createRequire } from 'module';
import { getDatabase } from "./db/connection.js";

const require = createRequire(import.meta.url);

async function examineReportStructure() {
  console.log('🔍 Examining Report Structure to Identify Missing PDF Fields...\n');

  try {
    // Connect to database
    const database = await getDatabase();
    if (!database) {
      console.error('❌ Database connection failed');
      return;
    }

    // Get a sample report
    const reportsCollection = database.collection("reports");
    const report = await reportsCollection.findOne({});
    
    if (!report) {
      console.log('⚠️  No reports found in database');
      return;
    }

    console.log('📋 Sample Report Structure:');
    console.log('=====================================');
    
    // Examine all fields in the report
    Object.keys(report).forEach(key => {
      const value = report[key];
      const type = typeof value;
      const preview = type === 'string' && value.length > 100 
        ? value.substring(0, 100) + '...' 
        : JSON.stringify(value);
      
      console.log(`${key}: (${type}) ${preview}`);
    });

    console.log('\n📝 Fields Currently Included in Enhanced PDF:');
    console.log('=====================================');
    const includedFields = [
      'title', 'author', 'jobname', 'jobid', 'inspectionType', 
      'status', 'createdAt', 'content', 'findings', 'recommendations'
    ];
    
    includedFields.forEach(field => {
      const hasField = report.hasOwnProperty(field);
      const status = hasField ? '✅' : '❌';
      const value = hasField ? report[field] : 'NOT PRESENT';
      console.log(`${status} ${field}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    });

    console.log('\n🔍 Potentially Missing Fields:');
    console.log('=====================================');
    const potentiallyMissingFields = Object.keys(report).filter(key => 
      !includedFields.includes(key) && 
      !['_id', 'createdAt', 'updatedAt'].includes(key)
    );
    
    potentiallyMissingFields.forEach(field => {
      const value = report[field];
      console.log(`⚠️  ${field}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : JSON.stringify(value)}`);
    });

    console.log('\n📊 Field Analysis Summary:');
    console.log('=====================================');
    console.log(`Total fields in report: ${Object.keys(report).length}`);
    console.log(`Currently included in PDF: ${includedFields.filter(f => report.hasOwnProperty(f)).length}`);
    console.log(`Potentially missing from PDF: ${potentiallyMissingFields.length}`);

    if (potentiallyMissingFields.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('=====================================');
      console.log('Consider adding these fields to the enhanced PDF generator:');
      potentiallyMissingFields.forEach(field => {
        console.log(`   • ${field}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during report examination:', error);
  }
}

examineReportStructure();
