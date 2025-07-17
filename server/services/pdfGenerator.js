import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `report-${reportData._id || 'new'}-${timestamp}.pdf`;
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
    // Add company logo area (placeholder)
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('CONSTRUCTION REPORT', 50, 50);
    
    // Add report title
    doc.fontSize(16)
       .font('Helvetica')
       .text(reportData.title || 'Daily Construction Report', 50, 80);
    
    // Add date and report ID
    const reportDate = reportData.createdAt ? new Date(reportData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    doc.fontSize(12)
       .text(`Report Date: ${reportDate}`, 400, 50)
       .text(`Report ID: ${reportData._id || 'N/A'}`, 400, 70)
       .text(`Project: ${projectData?.name || 'N/A'}`, 400, 90);
    
    // Add a line separator
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .stroke();
  }

  addProjectInformation(doc, projectData) {
    let yPosition = 140;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('PROJECT INFORMATION', 50, yPosition);
    
    yPosition += 25;
    
    const projectInfo = [
      { label: 'Project Name:', value: projectData?.name || 'N/A' },
      { label: 'Description:', value: projectData?.description || 'N/A' },
      { label: 'Location:', value: projectData?.location || 'N/A' },
      { label: 'Client Name:', value: projectData?.clientName || 'N/A' },
      { label: 'Start Date:', value: projectData?.startDate ? new Date(projectData.startDate).toLocaleDateString() : 'N/A' },
      { label: 'End Date:', value: projectData?.endDate ? new Date(projectData.endDate).toLocaleDateString() : 'N/A' },
      { label: 'Contract Day:', value: projectData?.contractDay ? `Day ${projectData.contractDay}` : 'N/A' }
    ];

    doc.fontSize(11).font('Helvetica');
    
    projectInfo.forEach(info => {
      doc.font('Helvetica-Bold').text(info.label, 50, yPosition);
      doc.font('Helvetica').text(info.value, 150, yPosition);
      yPosition += 18;
    });
    
    return yPosition + 10;
  }

  addInspectorInformation(doc, inspectorData) {
    let yPosition = 300;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INSPECTOR INFORMATION', 50, yPosition);
    
    yPosition += 25;
    
    const inspectorInfo = [
      { label: 'Inspector Name:', value: inspectorData ? `${inspectorData.firstName || ''} ${inspectorData.lastName || ''}`.trim() : 'N/A' },
      { label: 'Email:', value: inspectorData?.email || 'N/A' },
      { label: 'Job Title:', value: inspectorData?.jobName || 'N/A' },
      { label: 'Role:', value: inspectorData?.role || 'N/A' }
    ];

    doc.fontSize(11).font('Helvetica');
    
    inspectorInfo.forEach(info => {
      doc.font('Helvetica-Bold').text(info.label, 50, yPosition);
      doc.font('Helvetica').text(info.value, 150, yPosition);
      yPosition += 18;
    });
    
    return yPosition + 10;
  }

  addReportDetails(doc, reportData) {
    let yPosition = 420;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('REPORT DETAILS', 50, yPosition);
    
    yPosition += 25;
    
    // Report content
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Report Content:', 50, yPosition);
    
    yPosition += 20;
    
    const content = reportData.content || 'No content provided';
    const contentLines = this.wrapText(content, 500); // Wrap text to fit page width
    
    doc.font('Helvetica');
    contentLines.forEach(line => {
      if (yPosition > 720) { // Check if we need a new page
        doc.addPage();
        yPosition = 50;
      }
      doc.text(line, 50, yPosition);
      yPosition += 15;
    });
    
    yPosition += 20;
    
    // Additional report information
    const additionalInfo = [
      { label: 'Author:', value: reportData.author || 'N/A' },
      { label: 'Job Name:', value: reportData.jobname || 'N/A' },
      { label: 'Job ID:', value: reportData.jobid || 'N/A' },
      { label: 'Created At:', value: reportData.createdAt ? new Date(reportData.createdAt).toLocaleString() : 'N/A' }
    ];

    additionalInfo.forEach(info => {
      if (yPosition > 720) { // Check if we need a new page
        doc.addPage();
        yPosition = 50;
      }
      doc.font('Helvetica-Bold').text(info.label, 50, yPosition);
      doc.font('Helvetica').text(info.value, 150, yPosition);
      yPosition += 18;
    });
  }

  addFooter(doc) {
    const pageHeight = 792; // Standard letter size height
    const footerY = pageHeight - 50;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated on ${new Date().toLocaleString()}`, 50, footerY)
       .text('Confidential Construction Report', 400, footerY);
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
