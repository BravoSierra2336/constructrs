// Use createRequire for maximum compatibility with Render deployment
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFReportGenerator {
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
        // Create a new PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // Generate formatted filename: YYYY.MM.DD Jobname_ReportType_InspectorInitials
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
        
        // Get report type (fallback to "General")
        const reportType = (reportData.inspectionType || 'General')
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

        // Add header
        this.addHeader(doc, reportData, projectData);
        
        // Add project information section
        this.addProjectInformation(doc, projectData);
        
        // Add inspector information section
        this.addInspectorInformation(doc, inspectorData);
        
        // Add report details section
        this.addReportDetails(doc, reportData);
        
        // Add footer
        this.addFooter(doc);
        
        // Finalize the PDF
        doc.end();
        
        // Wait for the PDF to be written to disk
        doc.on('end', () => {
          console.log(`PDF report generated: ${filepath}`);
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

  addHeader(doc, reportData, projectData) {
    // Add a professional header background
    doc.rect(0, 0, 612, 140)
       .fillAndStroke('#2c5282', '#1a365d')
       .fill('#ffffff');
    
    // Add company logo area with background
    doc.rect(30, 20, 120, 80)
       .fillAndStroke('#ffffff', '#e2e8f0')
       .fill('#f7fafc');
    
    // Company logo placeholder text
    doc.fontSize(12)
       .fillColor('#4a5568')
       .font('Helvetica-Bold')
       .text('COMPANY', 50, 45)
       .text('LOGO', 65, 65);
    
    // Main title with elegant styling
    doc.fontSize(28)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('CONSTRUCTION REPORT', 180, 35);
    
    // Subtitle
    doc.fontSize(14)
       .fillColor('#e2e8f0')
       .font('Helvetica')
       .text(reportData.title || 'Daily Construction Inspection Report', 180, 70);
    
    // Header info box
    doc.rect(420, 20, 160, 100)
       .fillAndStroke('#ffffff', '#e2e8f0')
       .fill('#f7fafc');
    
    // Report metadata in the info box
    const reportDate = reportData.createdAt ? new Date(reportData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    doc.fontSize(10)
       .fillColor('#2d3748')
       .font('Helvetica-Bold')
       .text('REPORT DATE:', 430, 35)
       .font('Helvetica')
       .text(reportDate, 430, 48)
       .font('Helvetica-Bold')
       .text('REPORT ID:', 430, 65)
       .font('Helvetica')
       .text((reportData._id || 'N/A').toString().slice(-8), 430, 78)
       .font('Helvetica-Bold')
       .text('PROJECT:', 430, 95)
       .font('Helvetica')
       .text((projectData?.name || 'N/A').substring(0, 18), 430, 108);
    
    // Decorative line with gradient effect
    doc.moveTo(30, 155)
       .lineTo(582, 155)
       .lineWidth(3)
       .strokeColor('#2c5282')
       .stroke();
    
    doc.moveTo(30, 158)
       .lineTo(582, 158)
       .lineWidth(1)
       .strokeColor('#4299e1')
       .stroke();
  }

  addProjectInformation(doc, projectData) {
    let yPosition = 180;
    
    // Section header with background
    doc.rect(30, yPosition - 5, 552, 25)
       .fillAndStroke('#e6fffa', '#38b2ac')
       .fill('#38b2ac');
    
    doc.fontSize(14)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('📍 PROJECT INFORMATION', 40, yPosition + 5);
    
    yPosition += 35;
    
    // Create a bordered content area
    doc.rect(30, yPosition, 552, 140)
       .fillAndStroke('#f7fafc', '#e2e8f0')
       .lineWidth(1);
    
    yPosition += 15;
    
    const projectInfo = [
      { label: 'Project Name:', value: projectData?.name || 'N/A', icon: '🏗️' },
      { label: 'Description:', value: projectData?.description || 'N/A', icon: '📝' },
      { label: 'Location:', value: projectData?.location || 'N/A', icon: '📍' },
      { label: 'Client Name:', value: projectData?.clientName || 'N/A', icon: '👤' },
      { label: 'Start Date:', value: projectData?.startDate ? new Date(projectData.startDate).toLocaleDateString() : 'N/A', icon: '📅' },
      { label: 'End Date:', value: projectData?.endDate ? new Date(projectData.endDate).toLocaleDateString() : 'N/A', icon: '🏁' },
      { label: 'Contract Day:', value: projectData?.contractDay ? `Day ${projectData.contractDay}` : 'N/A', icon: '📊' }
    ];

    doc.fontSize(11);
    
    projectInfo.forEach((info, index) => {
      const leftColumn = index % 2 === 0;
      const xPos = leftColumn ? 45 : 310;
      const adjustedY = yPosition + Math.floor(index / 2) * 18;
      
      // Icon
      doc.fontSize(10).fillColor('#4a5568').text(info.icon, xPos, adjustedY);
      
      // Label
      doc.font('Helvetica-Bold').fillColor('#2d3748').text(info.label, xPos + 15, adjustedY);
      
      // Value with color coding based on content
      const valueColor = info.value === 'N/A' ? '#e53e3e' : '#2d3748';
      doc.font('Helvetica').fillColor(valueColor).text(info.value, xPos + 100, adjustedY);
    });
    
    return yPosition + 145;
  }

  addInspectorInformation(doc, inspectorData) {
    let yPosition = 360;
    
    // Section header with background
    doc.rect(30, yPosition - 5, 552, 25)
       .fillAndStroke('#fef5e7', '#ed8936')
       .fill('#ed8936');
    
    doc.fontSize(14)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('👷 INSPECTOR INFORMATION', 40, yPosition + 5);
    
    yPosition += 35;
    
    // Create a bordered content area
    doc.rect(30, yPosition, 552, 80)
       .fillAndStroke('#fffaf0', '#fed7aa')
       .lineWidth(1);
    
    yPosition += 15;
    
    const inspectorInfo = [
      { label: 'Inspector Name:', value: inspectorData ? `${inspectorData.firstName || ''} ${inspectorData.lastName || ''}`.trim() : 'N/A', icon: '👤' },
      { label: 'Email:', value: inspectorData?.email || 'N/A', icon: '📧' },
      { label: 'Job Title:', value: inspectorData?.jobName || 'N/A', icon: '💼' },
      { label: 'Role:', value: inspectorData?.role || 'N/A', icon: '🎯' }
    ];

    doc.fontSize(11);
    
    inspectorInfo.forEach((info, index) => {
      const leftColumn = index % 2 === 0;
      const xPos = leftColumn ? 45 : 310;
      const adjustedY = yPosition + Math.floor(index / 2) * 18;
      
      // Icon
      doc.fontSize(10).fillColor('#9c4221').text(info.icon, xPos, adjustedY);
      
      // Label
      doc.font('Helvetica-Bold').fillColor('#7c2d12').text(info.label, xPos + 15, adjustedY);
      
      // Value with color coding
      const valueColor = info.value === 'N/A' ? '#dc2626' : '#7c2d12';
      doc.font('Helvetica').fillColor(valueColor).text(info.value, xPos + 100, adjustedY);
    });
    
    return yPosition + 85;
  }

  addReportDetails(doc, reportData) {
    let yPosition = 470;
    
    // Section header with background
    doc.rect(30, yPosition - 5, 552, 25)
       .fillAndStroke('#e6f3ff', '#3182ce')
       .fill('#3182ce');
    
    doc.fontSize(14)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('📋 REPORT DETAILS', 40, yPosition + 5);
    
    yPosition += 40;
    
    // Weather section if available
    if (reportData.weather) {
      this.addWeatherSection(doc, reportData.weather, yPosition);
      yPosition += 80;
    }
    
    // Content section with enhanced styling
    doc.rect(30, yPosition, 552, 25)
       .fillAndStroke('#f0f9ff', '#0ea5e9')
       .fill('#0ea5e9');
    
    doc.fontSize(12)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('📝 REPORT CONTENT', 40, yPosition + 8);
    
    yPosition += 35;
    
    // Content box
    const contentHeight = Math.min(200, this.calculateContentHeight(reportData.content || 'No content provided'));
    doc.rect(30, yPosition, 552, contentHeight)
       .fillAndStroke('#f8fafc', '#cbd5e0')
       .lineWidth(1);
    
    yPosition += 15;
    
    const content = reportData.content || 'No content provided';
    const contentLines = this.wrapText(content, 500);
    
    doc.fontSize(11)
       .fillColor('#2d3748')
       .font('Helvetica');
    
    contentLines.forEach((line, index) => {
      if (yPosition > 720) {
        doc.addPage();
        yPosition = 50;
      }
      doc.text(line, 45, yPosition);
      yPosition += 14;
    });
    
    yPosition += 20;
    
    // Additional information in a grid layout
    const additionalInfo = [
      { label: 'Author:', value: reportData.author || 'N/A', icon: '✍️' },
      { label: 'Job Name:', value: reportData.jobname || 'N/A', icon: '🏗️' },
      { label: 'Job ID:', value: reportData.jobid || 'N/A', icon: '🔢' },
      { label: 'Created:', value: reportData.createdAt ? new Date(reportData.createdAt).toLocaleString() : 'N/A', icon: '🕒' }
    ];

    // Additional info section
    if (yPosition > 680) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.rect(30, yPosition, 552, 25)
       .fillAndStroke('#f0fdf4', '#16a34a')
       .fill('#16a34a');
    
    doc.fontSize(12)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('ℹ️ ADDITIONAL INFORMATION', 40, yPosition + 8);
    
    yPosition += 35;
    
    doc.rect(30, yPosition, 552, 80)
       .fillAndStroke('#f7fef7', '#bbf7d0')
       .lineWidth(1);
    
    yPosition += 15;

    additionalInfo.forEach((info, index) => {
      const leftColumn = index % 2 === 0;
      const xPos = leftColumn ? 45 : 310;
      const adjustedY = yPosition + Math.floor(index / 2) * 18;
      
      if (adjustedY > 720) {
        doc.addPage();
        return;
      }
      
      // Icon
      doc.fontSize(10).fillColor('#166534').text(info.icon, xPos, adjustedY);
      
      // Label
      doc.font('Helvetica-Bold').fillColor('#14532d').text(info.label, xPos + 15, adjustedY);
      
      // Value
      const valueColor = info.value === 'N/A' ? '#dc2626' : '#14532d';
      doc.font('Helvetica').fillColor(valueColor).text(info.value, xPos + 80, adjustedY);
    });
  }

  addWeatherSection(doc, weatherData, yPosition) {
    if (!weatherData) return;
    
    // Weather section header
    doc.rect(30, yPosition, 552, 20)
       .fillAndStroke('#e0f2fe', '#0284c7')
       .fill('#0284c7');
    
    doc.fontSize(11)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('🌤️ WEATHER CONDITIONS', 40, yPosition + 6);
    
    yPosition += 25;
    
    // Weather content box
    doc.rect(30, yPosition, 552, 50)
       .fillAndStroke('#f0f9ff', '#bae6fd')
       .lineWidth(1);
    
    yPosition += 10;
    
    const weatherInfo = [
      { label: 'Temperature:', value: weatherData.temperature ? `${weatherData.temperature}°F` : 'N/A', icon: '🌡️' },
      { label: 'Conditions:', value: weatherData.description || 'N/A', icon: '☁️' },
      { label: 'Humidity:', value: weatherData.humidity ? `${weatherData.humidity}%` : 'N/A', icon: '💧' },
      { label: 'Wind:', value: weatherData.windSpeed ? `${weatherData.windSpeed} mph` : 'N/A', icon: '💨' }
    ];
    
    doc.fontSize(10);
    
    weatherInfo.forEach((info, index) => {
      const leftColumn = index % 2 === 0;
      const xPos = leftColumn ? 45 : 310;
      const adjustedY = yPosition + Math.floor(index / 2) * 16;
      
      // Icon
      doc.fillColor('#0369a1').text(info.icon, xPos, adjustedY);
      
      // Label and value
      doc.font('Helvetica-Bold').fillColor('#0c4a6e').text(info.label, xPos + 15, adjustedY);
      doc.font('Helvetica').fillColor('#164e63').text(info.value, xPos + 80, adjustedY);
    });
  }

  calculateContentHeight(content) {
    const lines = this.wrapText(content, 500);
    return Math.max(50, lines.length * 14 + 30);
  }

  addFooter(doc) {
    const pageHeight = 792;
    const footerY = pageHeight - 60;
    
    // Footer background
    doc.rect(0, footerY - 10, 612, 70)
       .fillAndStroke('#2d3748', '#1a202c')
       .fill('#ffffff');
    
    // Decorative line
    doc.moveTo(30, footerY - 5)
       .lineTo(582, footerY - 5)
       .lineWidth(2)
       .strokeColor('#4299e1')
       .stroke();
    
    // Footer content
    doc.fontSize(9)
       .fillColor('#4a5568')
       .font('Helvetica')
       .text(`📅 Generated on ${new Date().toLocaleString()}`, 50, footerY + 10)
       .text('🔒 Confidential Construction Report', 350, footerY + 10);
    
    // Company info line
    doc.fontSize(8)
       .fillColor('#718096')
       .text('Professional Construction Services | Quality Assurance Report', 50, footerY + 25);
    
    // Page number (if needed for multi-page reports)
    doc.fontSize(8)
       .fillColor('#a0aec0')
       .text('Page 1', 550, footerY + 25);
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      // Approximate character width - adjust as needed
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

  /**
   * Delete old PDF files (optional cleanup method)
   * @param {number} daysOld - Delete files older than this many days
   */
  cleanupOldReports(daysOld = 30) {
    try {
      const files = fs.readdirSync(this.reportsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      files.forEach(file => {
        const filePath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old report: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
    }
  }
}

export default PDFReportGenerator;
