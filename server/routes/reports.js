import { createRequire } from 'module';
import PDFReportGenerator from "../services/pdfGenerator.js";
import EnhancedPDFReportGenerator from "../services/enhancedPdfGenerator.js";
import { getDatabase } from "../db/connection.js";
import User from "../models/user.js";
import Project from "../models/project.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import fs from "fs";
import path from "path";

// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

const require = createRequire(import.meta.url);
const express = require("express");
const jwt = require("jsonwebtoken");

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

// Initialize PDF generators
const pdfGenerator = new PDFReportGenerator();
const enhancedPdfGenerator = new EnhancedPDFReportGenerator();

// Test endpoint to check database connection and report count
router.get("/test-db", async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }
        
        let collection = database.collection("reports");
        let count = await collection.countDocuments();
        let sampleReports = await collection.find({}).limit(3).toArray();
        
        res.json({
            success: true,
            message: "Database connection working",
            reportCount: count,
            sampleReports: sampleReports
        });
    } catch (err) {
        console.error("Database test error:", err);
        res.status(500).json({ 
            error: "Database test failed",
            details: err.message 
        });
    }
});

// New endpoint to regenerate PDFs with enhanced generator
router.post("/regenerate-pdf/:id", authenticateToken, async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        const collection = database.collection("reports");
        const reportId = req.params.id;

        // Validate ObjectId
        if (!ObjectId.isValid(reportId)) {
            return res.status(400).json({ error: "Invalid report ID" });
        }

        // Find the report
        const report = await collection.findOne({ _id: new ObjectId(reportId) });
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        console.log("Regenerating PDF for report:", reportId);
        console.log("Report data:", JSON.stringify(report, null, 2));

        // Fetch related data
        let projectData = null;
        let inspectorData = null;

        try {
            if (report.projectId) {
                projectData = await Project.findById(report.projectId);
            }
            if (report.inspectorId) {
                inspectorData = await User.findById(report.inspectorId);
            }
        } catch (fetchError) {
            console.warn("Could not fetch related data for PDF regeneration:", fetchError.message);
        }

        // Generate new PDF with enhanced generator
        const pdfPath = await enhancedPdfGenerator.generateReportPDF(
            report,
            projectData,
            inspectorData
        );

        // Update the report with new PDF path
        await collection.updateOne(
            { _id: new ObjectId(reportId) },
            { $set: { pdfPath: pdfPath, regeneratedAt: new Date() } }
        );

        console.log(`PDF regenerated successfully: ${pdfPath}`);

        res.json({
            success: true,
            message: "PDF regenerated successfully with enhanced generator",
            pdfPath: pdfPath,
            reportId: reportId
        });

    } catch (error) {
        console.error("PDF regeneration error:", error);
        res.status(500).json({ 
            error: "PDF regeneration failed",
            details: error.message 
        });
    }
});

// This section will create a new report and generate a PDF.
router.post("/", authenticateToken, async (req, res) => {
    try {
        console.log('POST /reports called by user:', req.user);
        console.log('Request body:', req.body);
        
        // Create the report document (capture all fields used by PDF)
        let newDocument = {
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            jobname: req.body.jobname,
            jobid: req.body.jobid,
            projectId: req.body.projectId,
            inspectorId: req.body.inspectorId,
            // Additional report fields
            inspectionType: req.body.inspectionType,
            findings: req.body.findings,
            recommendations: req.body.recommendations,
            status: req.body.status || 'pending',
            laborBreakdownTitle: req.body.laborBreakdownTitle || 'Labor Breakdown',
            laborBreakdown: Array.isArray(req.body.laborBreakdown) ? req.body.laborBreakdown : [],
            equipmentBreakdownTitle: req.body.equipmentBreakdownTitle || 'Equipment Breakdown',
            equipmentBreakdown: Array.isArray(req.body.equipmentBreakdown) ? req.body.equipmentBreakdown : [],
            weather: req.body.weather || null,
            contractDay: req.body.contractDay,
            isDraft: false,
            createdAt: new Date(),
        };

        console.log('New document to insert:', newDocument);

        // Get database connection
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        let collection = database.collection("reports");
        let result = await collection.insertOne(newDocument);
        
        console.log('Insert result:', result);
        
        // Add the generated ID to the document for PDF generation
        newDocument._id = result.insertedId;

        // Fetch related project and inspector data for PDF
        let projectData = null;
        let inspectorData = null;

        try {
            // Fetch project data if projectId is provided
            if (newDocument.projectId) {
                projectData = await Project.findById(newDocument.projectId);
            }

            // Fetch inspector data if inspectorId is provided
            if (newDocument.inspectorId) {
                inspectorData = await User.findById(newDocument.inspectorId);
            }
        } catch (fetchError) {
            console.warn("Could not fetch related data for PDF:", fetchError.message);
            // Continue with PDF generation even if we can't fetch related data
        }

        // Generate PDF report using enhanced generator
        try {
            const pdfPath = await enhancedPdfGenerator.generateReportPDF(
                newDocument,
                projectData,
                inspectorData
            );
            
            // Update the report document with the PDF path
            await collection.updateOne(
                { _id: result.insertedId },
                { $set: { pdfPath: pdfPath } }
            );

            console.log(`Report created with PDF: ${pdfPath}`);
            
            res.status(201).json({
                success: true,
                message: "Report created and PDF generated successfully",
                reportId: result.insertedId,
                pdfPath: pdfPath,
                report: newDocument
            });
        } catch (pdfError) {
            console.error("PDF generation failed:", pdfError);
            
            // Still return success for the report creation, but note PDF failure
            res.status(201).json({
                success: true,
                message: "Report created successfully, but PDF generation failed",
                reportId: result.insertedId,
                pdfError: pdfError.message,
                report: newDocument
            });
        }
    } catch (err) {
        console.error("Error creating report:", err);
        res.status(500).json({ 
            error: "Error creating report",
            details: err.message 
        });
    }
});

// Save draft report (without PDF generation)
router.post("/draft", authenticateToken, async (req, res) => {
    try {
        console.log('POST /reports/draft called by user:', req.user);
        console.log('Draft data:', req.body);
        
        // Create the draft document
        let draftDocument = {
            title: req.body.title || 'Untitled Draft',
            content: req.body.content || '',
            author: req.body.author,
            jobname: req.body.jobname || req.body.title || 'Untitled Draft',
            jobid: req.body.jobid,
            projectId: req.body.projectId,
            inspectorId: req.body.inspectorId,
            inspectionType: req.body.inspectionType || 'safety',
            findings: req.body.findings || '',
            recommendations: req.body.recommendations || '',
            status: 'draft', // Always draft status
            laborBreakdownTitle: req.body.laborBreakdownTitle || 'Labor Breakdown',
            laborBreakdown: req.body.laborBreakdown || [],
            equipmentBreakdownTitle: req.body.equipmentBreakdownTitle || 'Equipment Breakdown',
            equipmentBreakdown: req.body.equipmentBreakdown || [],
            isDraft: true, // Flag to identify drafts
            createdAt: new Date(),
            lastModified: new Date()
        };

        console.log('Draft document to insert:', draftDocument);

        // Get database connection
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        let collection = database.collection("reports");
        let result = await collection.insertOne(draftDocument);
        
        console.log('Draft save result:', result);
        
        res.status(201).json({
            success: true,
            message: "Draft saved successfully",
            reportId: result.insertedId,
            report: draftDocument
        });
    } catch (err) {
        console.error("Error saving draft:", err);
        res.status(500).json({ 
            error: "Error saving draft",
            details: err.message 
        });
    }
});

// This section will help you get a list of all reports.
router.get("/", authenticateToken, async (req, res) => {
    try {
        console.log('GET /reports called by user:', req.user);
        
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }
        
        let collection = database.collection("reports");
        let results = await collection.find({}).toArray();
        
        console.log(`Found ${results.length} reports in database`);
        console.log('Sample reports:', results.slice(0, 2));
        
        res.status(200).json({
            success: true,
            reports: results
        });
    } catch (err) {
        console.error("Error fetching reports:", err);
        res.status(500).json({ 
            error: "Error fetching reports",
            details: err.message 
        });
    }
});
// This section will help you get a single report by id
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }
        
        let collection = database.collection("reports");
        let query = { _id: new ObjectId(req.params.id) };
        let result = await collection.findOne(query);

        if (!result) {
            res.status(404).json({ error: "Report not found" });
        } else {
            res.status(200).json(result);
        }
    } catch (err) {
        console.error("Error fetching report:", err);
        res.status(500).json({ 
            error: "Error fetching report",
            details: err.message 
        });
    }
});

// Update a report by id (with authorization and PDF regeneration)
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        console.log('PUT /reports/:id called by user:', req.user);
        const reportId = req.params.id;
        
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        let collection = database.collection("reports");
        const query = { _id: new ObjectId(reportId) };
        
        // Get the existing report
        const existingReport = await collection.findOne(query);
        if (!existingReport) {
            return res.status(404).json({ error: "Report not found" });
        }

        // Authorization check: Only the inspector who created the report OR project manager+ can edit
        const isReportAuthor = existingReport.inspectorId && existingReport.inspectorId.toString() === req.user.id;
        const isProjectManagerOrHigher = ['admin', 'project_manager'].includes(req.user.role);
        
        if (!isReportAuthor && !isProjectManagerOrHigher) {
            return res.status(403).json({ 
                error: "You can only edit reports you created, or you must be a Project Manager or higher" 
            });
        }

        console.log(`User ${req.user.id} authorized to edit report ${reportId}`);

        // Prepare updated document
        let updatedDocument = {
            title: req.body.title || existingReport.title,
            content: req.body.content || existingReport.content,
            author: req.body.author || existingReport.author,
            jobname: req.body.jobname || existingReport.jobname,
            jobid: req.body.jobid || existingReport.jobid,
            projectId: req.body.projectId || existingReport.projectId,
            inspectorId: req.body.inspectorId || existingReport.inspectorId,
            inspectionType: req.body.inspectionType || existingReport.inspectionType,
            findings: req.body.findings || existingReport.findings,
            recommendations: req.body.recommendations || existingReport.recommendations,
            status: req.body.status || existingReport.status,
            laborBreakdownTitle: req.body.laborBreakdownTitle || existingReport.laborBreakdownTitle,
            laborBreakdown: req.body.laborBreakdown || existingReport.laborBreakdown,
            equipmentBreakdownTitle: req.body.equipmentBreakdownTitle || existingReport.equipmentBreakdownTitle,
            equipmentBreakdown: req.body.equipmentBreakdown || existingReport.equipmentBreakdown,
            lastModified: new Date(),
            editedBy: req.user.id,
            editedAt: new Date()
        };

        // Keep original creation data
        updatedDocument.createdAt = existingReport.createdAt;
        updatedDocument.isDraft = false; // Report is no longer a draft after editing

        console.log('Updated document:', updatedDocument);

        // Delete old PDF if it exists
        let oldPdfDeleted = false;
        if (existingReport.pdfPath && fs.existsSync(existingReport.pdfPath)) {
            try {
                fs.unlinkSync(existingReport.pdfPath);
                oldPdfDeleted = true;
                console.log(`Deleted old PDF: ${existingReport.pdfPath}`);
            } catch (pdfError) {
                console.warn(`Could not delete old PDF: ${existingReport.pdfPath}`, pdfError);
            }
        }

        // Generate new PDF
        const pdfGenerator = new PDFReportGenerator();
        
        // Get related data for PDF generation
        let projectData = null;
        let inspectorData = null;

        if (updatedDocument.projectId) {
            try {
                const projectsCollection = database.collection("projects");
                projectData = await projectsCollection.findOne({ _id: new ObjectId(updatedDocument.projectId) });
            } catch (err) {
                console.warn("Could not fetch project data for PDF:", err);
            }
        }

        if (updatedDocument.inspectorId) {
            try {
                const usersCollection = database.collection("users");
                inspectorData = await usersCollection.findOne({ _id: new ObjectId(updatedDocument.inspectorId) });
                if (inspectorData) {
                    // Remove sensitive information
                    delete inspectorData.password;
                    delete inspectorData.microsoftAccessToken;
                    delete inspectorData.microsoftRefreshToken;
                }
            } catch (err) {
                console.warn("Could not fetch inspector data for PDF:", err);
            }
        }

        // Generate the new PDF using enhanced generator
        const pdfPath = await enhancedPdfGenerator.generateReportPDF(
            { ...updatedDocument, _id: reportId },
            projectData,
            inspectorData
        );
        
        console.log('New PDF generated at:', pdfPath);
        updatedDocument.pdfPath = pdfPath;

        // Update the document in database
        const updateResult = await collection.updateOne(query, { $set: updatedDocument });
        
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        console.log('Report update result:', updateResult);
        
        res.status(200).json({
            success: true,
            message: "Report updated successfully",
            reportId: reportId,
            pdfPath: pdfPath,
            oldPdfDeleted: oldPdfDeleted,
            editedBy: req.user.id,
            editedAt: updatedDocument.editedAt
        });
    } catch (err) {
        console.error("Error updating report:", err);
        res.status(500).json({ 
            error: "Error updating report",
            details: err.message 
        });
    }
});

// This section will help you delete a report by id.
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        // Only allow admin users to delete reports
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only admin users can delete reports" });
        }

        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        let collection = database.collection("reports");
        const query = { _id: new ObjectId(req.params.id) };
        
        // First check if report exists and get PDF path for moving
        const report = await collection.findOne(query);
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        // Create deleted reports folder if it doesn't exist
        const deletedReportsDir = path.join(process.cwd(), 'deleted-reports');
        if (!fs.existsSync(deletedReportsDir)) {
            fs.mkdirSync(deletedReportsDir, { recursive: true });
        }

        let pdfMoved = false;
        // Move the PDF file to deleted reports folder if it exists
        if (report.pdfPath && fs.existsSync(report.pdfPath)) {
            try {
                const originalFilename = path.basename(report.pdfPath);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const newFilename = `${timestamp}-${originalFilename}`;
                const newPath = path.join(deletedReportsDir, newFilename);
                
                fs.renameSync(report.pdfPath, newPath);
                pdfMoved = true;
                console.log(`Moved PDF file from ${report.pdfPath} to ${newPath}`);
            } catch (pdfError) {
                console.warn(`Could not move PDF file: ${report.pdfPath}`, pdfError);
                // Continue with database deletion even if PDF move fails
            }
        }

        // Delete the report from database
        let result = await collection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Report not found" });
        } else {
            res.status(200).json({ 
                success: true, 
                message: "Report deleted successfully",
                pdfMoved: pdfMoved
            });
        }
    } catch (err) {
        console.error("Error deleting report:", err);
        res.status(500).json({ 
            error: "Error deleting report",
            details: err.message 
        });
    }
});

// This section will help you update the latest report for a job.
router.patch("/latest", async (req, res) => {
    try {
        const query = { _id: new ObjectId(req.body.id) };
        const updates = {
            $set: {
                latestReport: req.body.latestReport,
            },
        };

        let collection = await db.collection("reports");
        let result = await collection.updateOne(query, updates);
        res.send(result).status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating latest report");
    }
});

// This section will help you get all reports for a specific job by job ID.
router.get("/job/:jobid", async (req, res) => {
    try {
        const query = { jobid: req.params.jobid };
        let collection = await db.collection("reports");
        let results = await collection.find(query).toArray();
        res.send(results).status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching reports for job");
    }
});

// This section will help you delete a report by job ID.
router.delete("/job/:jobid", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const query = { jobid: req.params.jobid };
        let collection = await db.collection("reports");
        let result = await collection.deleteMany(query);

        if (result.deletedCount === 0) {
            res.send("No reports found for this job").status(404);
        } else {
            res.send("Reports deleted successfully").status(200);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting reports for job");
    }
}); 

// Route to download the PDF for a specific report
// Custom authentication middleware for PDF downloads that handles query token
const authenticateTokenForDownload = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    const queryToken = req.query.token; // Token from query parameter
    
    const token = headerToken || queryToken;

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
};

router.get("/:id/pdf", authenticateTokenForDownload, async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }
        
        let collection = database.collection("reports");
        let query = { _id: new ObjectId(req.params.id) };
        let report = await collection.findOne(query);

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        if (!report.pdfPath) {
            return res.status(404).json({ error: "PDF not found for this report" });
        }

        // Check if the PDF file exists
        if (!fs.existsSync(report.pdfPath)) {
            return res.status(404).json({ error: "PDF file not found on server" });
        }

        // Extract the actual filename from the path for a proper download filename
        const actualFilename = path.basename(report.pdfPath);
        
        // Set headers for PDF download with the actual filename
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${actualFilename}"`);
        
        // Stream the PDF file
        const fileStream = fs.createReadStream(report.pdfPath);
        fileStream.pipe(res);
        
    } catch (err) {
        console.error("Error downloading PDF:", err);
        res.status(500).json({ 
            error: "Error downloading PDF",
            details: err.message 
        });
    }
});

// Route to regenerate PDF for an existing report
router.post("/:id/regenerate-pdf", authenticateToken, async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }
        
        let collection = database.collection("reports");
        let query = { _id: new ObjectId(req.params.id) };
        let report = await collection.findOne(query);

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        // Fetch related project and inspector data for PDF
        let projectData = null;
        let inspectorData = null;

        try {
            if (report.projectId) {
                projectData = await Project.findById(report.projectId);
            }
            if (report.inspectorId) {
                inspectorData = await User.findById(report.inspectorId);
            }
        } catch (fetchError) {
            console.warn("Could not fetch related data for PDF regeneration:", fetchError.message);
        }

        // Generate new PDF using enhanced generator
        const pdfPath = await enhancedPdfGenerator.generateReportPDF(
            report,
            projectData,
            inspectorData
        );
        
        // Update the report document with the new PDF path
        await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { pdfPath: pdfPath, pdfRegeneratedAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: "PDF regenerated successfully",
            pdfPath: pdfPath
        });
        
    } catch (err) {
        console.error("Error regenerating PDF:", err);
        res.status(500).json({ 
            error: "Error regenerating PDF",
            details: err.message 
        });
    }
});

// Export the router to be used in the main server file.
export default router;