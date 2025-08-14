// Enhanced PDF Generator with better formatting and reliability
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedPDFReportGenerator {
  constructor() {
    // Ensure reports directory exists
    this.reportsDir = path.join(__dirname, '..', 'generated-reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate a PDF report with project information, report data, and inspector details
   * @param {Object} reportData - The report data
   * @param {Object} projectData - The project information
   * @param {Object} inspectorData - The inspector information
   * @returns {Promise<string>} - Path to the generated PDF file
   */
  async generateReportPDF(reportData, projectData, inspectorData) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document with better margins
        const doc = new PDFDocument({ 
          margin: 40,
          bufferPages: true
        });
        
        // Generate formatted filename: YYYY.MM.DD_Jobname_ReportType_InspectorInitials
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${year}.${month}.${day}`;
        
        // Get job/project name (fallback to "Unknown")
        const jobName = (reportData.jobname || projectData?.name || 'Unknown')
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 30); // Limit length
        
        // Get report type (fallback to "Foundation")
        const reportType = (reportData.inspectionType || reportData.title || 'Foundation')
          .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
          .substring(0, 20); // Limit length
        
        // Get inspector initials (fallback to "XX")
        let inspectorInitials = 'XX';
        if (inspectorData?.firstName && inspectorData?.lastName) {
          inspectorInitials = `${inspectorData.firstName.charAt(0)}${inspectorData.lastName.charAt(0)}`.toUpperCase();
        } else if (reportData.author) {
          // Try to extract initials from author name
          const authorParts = reportData.author.split(' ');
          if (authorParts.length >= 2) {
            inspectorInitials = `${authorParts[0].charAt(0)}${authorParts[authorParts.length - 1].charAt(0)}`.toUpperCase();
          } else if (authorParts.length === 1) {
            inspectorInitials = `${authorParts[0].charAt(0)}${authorParts[0].charAt(1) || 'X'}`.toUpperCase();
          }
        }
        
        const filename = `${datePrefix}_${jobName}_${reportType}_${inspectorInitials}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        
        // Pipe the PDF to a file
        doc.pipe(fs.createWriteStream(filepath));

        // Add content sections
        this.addCleanHeader(doc, reportData, projectData);
        this.addProjectSection(doc, projectData);
        this.addInspectorSection(doc, inspectorData);
        this.addReportSection(doc, reportData);
        this.addCleanFooter(doc);
        
        // Finalize the PDF
        doc.end();
        
        // Wait for the PDF to be written to disk
        doc.on('end', () => {
          console.log(`Enhanced PDF report generated: ${filepath}`);
          resolve(filepath);
        });
        
        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });
        
      } catch (error) {
        console.error('Error creating PDF:', error);
        reject(error);
      }
    });
  }

  addCleanHeader(doc, reportData, projectData) {
    // Clean header with simple styling
    doc.rect(40, 40, 532, 80)
       .fillAndStroke('#f8f9fa', '#dee2e6')
       .lineWidth(1);
    
    // Company/Organization name
    doc.fontSize(24)
       .fillColor('#212529')
       .font('Helvetica-Bold')
       .text('CONSTRUCTION INSPECTION REPORT', 60, 60);
    
    // Report title
    doc.fontSize(14)
       .fillColor('#6c757d')
       .font('Helvetica')
       .text(reportData.title || 'Construction Inspection Report', 60, 90);
    
    // Report metadata box
    doc.rect(400, 50, 160, 60)
       .fillAndStroke('#ffffff', '#adb5bd')
       .lineWidth(1);
    
    const reportDate = reportData.createdAt ? 
      new Date(reportData.createdAt).toLocaleDateString() : 
      new Date().toLocaleDateString();
    
    doc.fontSize(10)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('Report Date:', 410, 60)
       .font('Helvetica')
       .text(reportDate, 410, 75)
       .font('Helvetica-Bold')
       .text('Report ID:', 410, 90)
       .font('Helvetica')
       .text((reportData._id || 'N/A').toString().slice(-8).toUpperCase(), 410, 105);
    
    // Simple divider line
    doc.moveTo(40, 140)
       .lineTo(572, 140)
       .lineWidth(2)
       .strokeColor('#dee2e6')
       .stroke();
  }

  addProjectSection(doc, projectData) {
    let yPos = 160;
    
    // Section header
    doc.fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('PROJECT INFORMATION', 40, yPos);
    
    yPos += 25;
    
    // Project details in a clean table format
    const projectInfo = [
      ['Project Name:', projectData?.name || 'N/A'],
      ['Location:', projectData?.location || 'N/A'],
      ['Client:', projectData?.clientName || 'N/A'],
      ['Start Date:', projectData?.startDate ? new Date(projectData.startDate).toLocaleDateString() : 'N/A'],
      ['Contract Day:', projectData?.contractDay ? `Day ${projectData.contractDay}` : 'N/A'],
      ['Description:', (projectData?.description || 'N/A').substring(0, 60)]
    ];

    projectInfo.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text(label, 60, yPos, { width: 120 })
         .font('Helvetica')
         .fillColor('#212529')
         .text(value, 180, yPos, { width: 350 });
      yPos += 18;
    });
    
    return yPos + 20;
  }

  addInspectorSection(doc, inspectorData) {
    let yPos = 300;
    
    // Section header
    doc.fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('INSPECTOR INFORMATION', 40, yPos);
    
    yPos += 25;
    
    const inspectorName = inspectorData?.firstName && inspectorData?.lastName 
      ? `${inspectorData.firstName} ${inspectorData.lastName}`
      : 'N/A';
    
    const inspectorInfo = [
      ['Inspector:', inspectorName],
      ['Email:', inspectorData?.email || 'N/A'],
      ['Role:', inspectorData?.role || 'N/A'],
      ['Phone:', inspectorData?.phone || 'N/A']
    ];

    inspectorInfo.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text(label, 60, yPos, { width: 120 })
         .font('Helvetica')
         .fillColor('#212529')
         .text(value, 180, yPos, { width: 350 });
      yPos += 18;
    });
    
    return yPos + 20;
  }

  addReportSection(doc, reportData) {
    let yPos = 420;
    
    // Check if we need a new page
    if (yPos > 650) {
      doc.addPage();
      yPos = 60;
    }
    
    // Section header
    doc.fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('INSPECTION DETAILS', 40, yPos);
    
    yPos += 25;
    
    // Basic report information
    const reportInfo = [
      ['Author:', reportData.author || 'N/A'],
      ['Job Name:', reportData.jobname || 'N/A'],
      ['Job ID:', reportData.jobid || 'N/A'],
      ['Inspection Type:', reportData.inspectionType || 'N/A'],
      ['Status:', reportData.status || 'N/A'],
      ['Created:', reportData.createdAt ? new Date(reportData.createdAt).toLocaleString() : 'N/A']
    ];

    reportInfo.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text(label, 60, yPos, { width: 120 })
         .font('Helvetica')
         .fillColor('#212529')
         .text(value, 180, yPos, { width: 350 });
      yPos += 18;
    });
    
    yPos += 20;

    // Weather section if available
    if (reportData.weather) {
      yPos = this.addWeatherSection(doc, reportData.weather, yPos);
      yPos += 20;
    }
    
    // Content section
    if (reportData.content) {
      // Check if we need a new page
      if (yPos > 600) {
        doc.addPage();
        yPos = 60;
      }

      doc.fontSize(14)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text('REPORT CONTENT', 40, yPos);
      
      yPos += 25;
      
      // Content box with border
      doc.rect(40, yPos, 532, 2)
         .fillAndStroke('#dee2e6', '#dee2e6');
      
      yPos += 10;
      
      const content = reportData.content.trim();
      if (content) {
        const contentLines = this.wrapText(content, 480);
        
        contentLines.forEach((line, index) => {
          if (yPos > 720) {
            doc.addPage();
            yPos = 60;
          }
          doc.fontSize(11)
             .fillColor('#212529')
             .font('Helvetica')
             .text(line, 60, yPos);
          yPos += 16;
        });
      }
      
      yPos += 20;
    }
    
    // Findings section
    if (reportData.findings) {
      // Check if we need a new page
      if (yPos > 600) {
        doc.addPage();
        yPos = 60;
      }
      
      doc.fontSize(14)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text('FINDINGS', 40, yPos);
      
      yPos += 25;
      
      // Findings box with border
      doc.rect(40, yPos, 532, 2)
         .fillAndStroke('#dee2e6', '#dee2e6');
      
      yPos += 10;
      
      const findingsLines = this.wrapText(reportData.findings, 480);
      
      findingsLines.forEach((line, index) => {
        if (yPos > 720) {
          doc.addPage();
          yPos = 60;
        }
        doc.fontSize(11)
           .fillColor('#212529')
           .font('Helvetica')
           .text(line, 60, yPos);
        yPos += 16;
      });
      
      yPos += 20;
    }
    
    // Recommendations section
    if (reportData.recommendations) {
      // Check if we need a new page
      if (yPos > 600) {
        doc.addPage();
        yPos = 60;
      }
      
      doc.fontSize(14)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text('RECOMMENDATIONS', 40, yPos);
      
      yPos += 25;
      
      // Recommendations box with border
      doc.rect(40, yPos, 532, 2)
         .fillAndStroke('#dee2e6', '#dee2e6');
      
      yPos += 10;
      
      const recommendationsLines = this.wrapText(reportData.recommendations, 480);
      
      recommendationsLines.forEach((line, index) => {
        if (yPos > 720) {
          doc.addPage();
          yPos = 60;
        }
        doc.fontSize(11)
           .fillColor('#212529')
           .font('Helvetica')
           .text(line, 60, yPos);
        yPos += 16;
      });
      
      yPos += 20;
    }

    // Additional report fields section
    this.addAdditionalReportFields(doc, reportData, yPos);
  }

  addCleanFooter(doc) {
    const footerY = 750;
    
    // Simple footer line
    doc.moveTo(40, footerY)
       .lineTo(572, footerY)
       .lineWidth(1)
       .strokeColor('#dee2e6')
       .stroke();
    
    // Footer text
    doc.fontSize(9)
       .fillColor('#6c757d')
       .font('Helvetica')
       .text('Construction Inspection Report - Generated by ConstructRS', 40, footerY + 10)
       .text(`Generated on: ${new Date().toLocaleString()}`, 40, footerY + 25);
    
    // Page number
    doc.text('Page 1', 520, footerY + 10);
  }

  addWeatherSection(doc, weatherData, yPos) {
    if (!weatherData) return yPos;
    
    // Weather section header
    doc.fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('WEATHER CONDITIONS', 40, yPos);
    
    yPos += 25;
    
    // Weather info in clean table format
    const weatherInfo = [
      ['Temperature:', weatherData.temperature ? `${weatherData.temperature}°F` : 'N/A'],
      ['Conditions:', weatherData.description || 'N/A'],
      ['Humidity:', weatherData.humidity ? `${weatherData.humidity}%` : 'N/A'],
      ['Wind Speed:', weatherData.windSpeed ? `${weatherData.windSpeed} mph` : 'N/A'],
      ['Wind Direction:', weatherData.windDirection || 'N/A'],
      ['Pressure:', weatherData.pressure ? `${weatherData.pressure} inHg` : 'N/A']
    ];
    
    weatherInfo.forEach(([label, value]) => {
      doc.fontSize(11)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text(label, 60, yPos, { width: 120 })
         .font('Helvetica')
         .fillColor('#212529')
         .text(value, 180, yPos, { width: 350 });
      yPos += 18;
    });
    
    return yPos + 20;
  }

  addAdditionalReportFields(doc, reportData, yPos) {
    // Check if we need a new page
    if (yPos > 600) {
      doc.addPage();
      yPos = 60;
    }
    
    // Collect all additional fields that might exist in the report
    const additionalFields = [];
    
    // Common report fields that might be present
    const possibleFields = [
      'photos', 'attachments', 'tags', 'priority', 'category',
      'location', 'duration', 'equipmentUsed', 'materials',
      'safetyNotes', 'quality', 'progress', 'issues', 'delays',
      'nextSteps', 'signature', 'approved', 'reviewedBy',
      'completionPercentage', 'weatherAffected', 'laborHours',
      'costImpact', 'scheduleImpact', 'rework', 'defects'
    ];
    
    possibleFields.forEach(field => {
      if (reportData[field] && reportData[field] !== null && reportData[field] !== '') {
        let value = reportData[field];
        
        // Format different data types appropriately
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            value = value.length > 0 ? value.join(', ') : 'None';
          } else {
            value = JSON.stringify(value);
          }
        } else if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No';
        } else if (typeof value === 'number') {
          value = value.toString();
        }
        
        // Limit length for display
        if (value.length > 100) {
          value = value.substring(0, 100) + '...';
        }
        
        additionalFields.push([this.formatFieldName(field), value]);
      }
    });
    
    if (additionalFields.length > 0) {
      doc.fontSize(14)
         .fillColor('#495057')
         .font('Helvetica-Bold')
         .text('ADDITIONAL INFORMATION', 40, yPos);
      
      yPos += 25;
      
      additionalFields.forEach(([label, value]) => {
        // Check if we need a new page
        if (yPos > 720) {
          doc.addPage();
          yPos = 60;
        }
        
        doc.fontSize(11)
           .fillColor('#495057')
           .font('Helvetica-Bold')
           .text(label, 60, yPos, { width: 120 })
           .font('Helvetica')
           .fillColor('#212529')
           .text(value, 180, yPos, { width: 350 });
        yPos += 18;
      });
    }
  }

  formatFieldName(fieldName) {
    // Convert camelCase to Title Case with spaces
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim() + ':';
  }

  wrapText(text, maxWidth) {
    if (!text) return [];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      // Approximate character width - adjust as needed for PDFKit
      if (testLine.length * 6 > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Get the path to the reports directory
   * @returns {string} - Path to the reports directory
   */
  getReportsDirectory() {
    return this.reportsDir;
  }
}

export default EnhancedPDFReportGenerator;
