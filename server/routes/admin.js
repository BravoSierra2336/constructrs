import express from "express";
import fs from "fs";
import path from "path";
import { getDatabase } from "../db/connection.js";
import { ObjectId } from "mongodb";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /admin/reports - Get all reports with PDF information (Admin only)
 * Accessible to: admin, project_manager, supervisor
 */
router.get("/reports", authenticateToken, requireRole(['admin', 'project_manager', 'supervisor']), async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        // Get all reports with PDF information
        const reportsCollection = database.collection("reports");
        const reports = await reportsCollection.find({}).toArray();

        // Get additional project and user information for each report
        const enrichedReports = await Promise.all(reports.map(async (report) => {
            let projectInfo = null;
            let inspectorInfo = null;

            try {
                // Get project information if projectId exists
                if (report.projectId) {
                    const projectsCollection = database.collection("projects");
                    projectInfo = await projectsCollection.findOne({ _id: new ObjectId(report.projectId) });
                }

                // Get inspector information if inspectorId exists
                if (report.inspectorId) {
                    const usersCollection = database.collection("users");
                    inspectorInfo = await usersCollection.findOne({ _id: new ObjectId(report.inspectorId) });
                    // Remove sensitive information
                    if (inspectorInfo) {
                        delete inspectorInfo.password;
                        delete inspectorInfo.microsoftAccessToken;
                        delete inspectorInfo.microsoftRefreshToken;
                    }
                }
            } catch (err) {
                console.warn(`Error fetching related data for report ${report._id}:`, err.message);
            }

            // Check if PDF file exists on disk
            let pdfExists = false;
            let pdfSize = null;
            if (report.pdfPath && fs.existsSync(report.pdfPath)) {
                pdfExists = true;
                try {
                    const stats = fs.statSync(report.pdfPath);
                    pdfSize = Math.round(stats.size / 1024); // Size in KB
                } catch (err) {
                    console.warn(`Error getting PDF stats for ${report.pdfPath}:`, err.message);
                }
            }

            return {
                ...report,
                projectInfo,
                inspectorInfo,
                pdfExists,
                pdfSize,
                pdfFileName: report.pdfPath ? path.basename(report.pdfPath) : null
            };
        }));

        // Sort reports by creation date (newest first)
        enrichedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            success: true,
            totalReports: enrichedReports.length,
            reportsWithPDFs: enrichedReports.filter(r => r.pdfExists).length,
            reports: enrichedReports
        });

    } catch (err) {
        console.error("Error fetching admin reports:", err);
        res.status(500).json({ 
            error: "Error fetching reports",
            details: err.message 
        });
    }
});

/**
 * GET /admin/reports/stats - Get PDF statistics (Admin only)
 */
router.get("/reports/stats", authenticateToken, requireRole(['admin', 'project_manager', 'supervisor']), async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        const reportsCollection = database.collection("reports");
        const reports = await reportsCollection.find({}).toArray();

        let totalReports = reports.length;
        let reportsWithPDFs = 0;
        let totalPDFSize = 0;
        let reportsByProject = {};
        let reportsByInspector = {};

        for (const report of reports) {
            // Check PDF existence
            if (report.pdfPath && fs.existsSync(report.pdfPath)) {
                reportsWithPDFs++;
                try {
                    const stats = fs.statSync(report.pdfPath);
                    totalPDFSize += stats.size;
                } catch (err) {
                    console.warn(`Error getting PDF stats for ${report.pdfPath}:`, err.message);
                }
            }

            // Count reports by project
            const projectKey = report.projectId || 'unassigned';
            reportsByProject[projectKey] = (reportsByProject[projectKey] || 0) + 1;

            // Count reports by inspector
            const inspectorKey = report.inspectorId || 'unassigned';
            reportsByInspector[inspectorKey] = (reportsByInspector[inspectorKey] || 0) + 1;
        }

        res.status(200).json({
            success: true,
            stats: {
                totalReports,
                reportsWithPDFs,
                reportsWithoutPDFs: totalReports - reportsWithPDFs,
                totalPDFSize: Math.round(totalPDFSize / 1024 / 1024 * 100) / 100, // Size in MB
                averagePDFSize: reportsWithPDFs > 0 ? Math.round(totalPDFSize / reportsWithPDFs / 1024) : 0, // Average size in KB
                reportsByProject,
                reportsByInspector
            }
        });

    } catch (err) {
        console.error("Error fetching PDF statistics:", err);
        res.status(500).json({ 
            error: "Error fetching statistics",
            details: err.message 
        });
    }
});

/**
 * GET /admin/reports/:id/download - Download specific report PDF (Admin only)
 */
router.get("/reports/:id/download", authenticateToken, requireRole(['admin', 'project_manager', 'supervisor']), async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        const reportsCollection = database.collection("reports");
        const report = await reportsCollection.findOne({ _id: new ObjectId(req.params.id) });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        if (!report.pdfPath || !fs.existsSync(report.pdfPath)) {
            return res.status(404).json({ error: "PDF file not found" });
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.id}.pdf"`);
        
        // Stream the PDF file
        const fileStream = fs.createReadStream(report.pdfPath);
        fileStream.pipe(res);

        // Log the download for audit purposes
        console.log(`Admin ${req.user.email} downloaded PDF for report ${req.params.id}`);

    } catch (err) {
        console.error("Error downloading PDF:", err);
        res.status(500).json({ 
            error: "Error downloading PDF",
            details: err.message 
        });
    }
});

/**
 * GET /admin/reports/bulk-download - Download multiple PDFs as ZIP (Admin only)
 */
router.post("/reports/bulk-download", authenticateToken, requireRole(['admin', 'project_manager', 'supervisor']), async (req, res) => {
    try {
        const { reportIds } = req.body;
        
        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({ error: "Report IDs array is required" });
        }

        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        const reportsCollection = database.collection("reports");
        const objectIds = reportIds.map(id => new ObjectId(id));
        const reports = await reportsCollection.find({ _id: { $in: objectIds } }).toArray();

        const validReports = reports.filter(report => report.pdfPath && fs.existsSync(report.pdfPath));

        if (validReports.length === 0) {
            return res.status(404).json({ error: "No valid PDFs found for the specified reports" });
        }

        // For now, return the list of available files
        // In a production environment, you might want to implement ZIP creation
        res.status(200).json({
            success: true,
            message: `Found ${validReports.length} valid PDFs out of ${reportIds.length} requested`,
            availableReports: validReports.map(report => ({
                id: report._id,
                title: report.title,
                pdfPath: report.pdfPath,
                downloadUrl: `/admin/reports/${report._id}/download`
            }))
        });

        // Log the bulk download request
        console.log(`Admin ${req.user.email} requested bulk download of ${reportIds.length} reports`);

    } catch (err) {
        console.error("Error preparing bulk download:", err);
        res.status(500).json({ 
            error: "Error preparing bulk download",
            details: err.message 
        });
    }
});

/**
 * DELETE /admin/reports/:id - Delete report and its PDF (Admin only)
 */
router.delete("/reports/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        const reportsCollection = database.collection("reports");
        const report = await reportsCollection.findOne({ _id: new ObjectId(req.params.id) });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        // Delete the PDF file if it exists
        let pdfDeleted = false;
        if (report.pdfPath && fs.existsSync(report.pdfPath)) {
            try {
                fs.unlinkSync(report.pdfPath);
                pdfDeleted = true;
                console.log(`Deleted PDF file: ${report.pdfPath}`);
            } catch (pdfError) {
                console.error(`Error deleting PDF file: ${pdfError.message}`);
            }
        }

        // Delete the report from database
        const deleteResult = await reportsCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "Report not found in database" });
        }

        res.status(200).json({
            success: true,
            message: "Report deleted successfully",
            pdfDeleted,
            reportId: req.params.id
        });

        // Log the deletion for audit purposes
        console.log(`Admin ${req.user.email} deleted report ${req.params.id} and its PDF`);

    } catch (err) {
        console.error("Error deleting report:", err);
        res.status(500).json({ 
            error: "Error deleting report",
            details: err.message 
        });
    }
});

export default router;
