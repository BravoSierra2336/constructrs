import express from "express";
import fs from "fs";
import path from "path";
import { getDatabase } from "../db/connection.js";
import { ObjectId } from "mongodb";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /admin/check-access - Check if user has admin access (Debug endpoint)
 */
router.get("/check-access", authenticateToken, async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        // Get full user data
        const usersCollection = database.collection("users");
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const hasAdminAccess = ['admin', 'project_manager', 'supervisor'].includes(user.role);

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isAdmin: user.isAdmin
            },
            tokenUser: req.user,
            hasAdminAccess,
            requiredRoles: ['admin', 'project_manager', 'supervisor']
        });
    } catch (error) {
        console.error("Error checking admin access:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /admin/reports - Get all reports with PDF information (Admin only)
 * Accessible to: admin, project_manager, supervisor
 */
router.get("/reports", authenticateToken, requireRole(['admin', 'project_manager', 'supervisor']), async (req, res) => {
    try {
        console.log("=== GET /admin/reports REQUEST START ===");
        console.log("User:", req.user);
        
        const database = await getDatabase();
        if (!database) {
            console.log("ERROR: Database connection not available");
            return res.status(500).json({ error: "Database connection not available" });
        }

        console.log("Database connection established");

        // Get all reports with PDF information
        const reportsCollection = database.collection("reports");
        console.log("Getting reports from collection...");
        const reports = await reportsCollection.find({}).toArray();
        console.log(`Found ${reports.length} reports in database`);

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
 * DELETE /admin/reports/bulk - Bulk delete reports (Admin only)
 * Accessible to: admin only
 */
router.delete("/reports/bulk", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log("=== BULK DELETE REQUEST START ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        console.log("User:", req.user);
        
        const { reportIds } = req.body;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            console.log("ERROR: Invalid reportIds:", reportIds);
            return res.status(400).json({ error: "Report IDs array is required" });
        }

        console.log("Report IDs to delete:", reportIds);

        const database = await getDatabase();
        if (!database) {
            console.log("ERROR: Database connection not available");
            return res.status(500).json({ error: "Database connection not available" });
        }

        console.log("Database connection established");

        const reportsCollection = database.collection("reports");
        
        // Convert string IDs to ObjectIds with error handling
        let objectIds;
        try {
            objectIds = reportIds.map(id => {
                console.log("Converting ID:", id, "Type:", typeof id);
                if (!ObjectId.isValid(id)) {
                    throw new Error(`Invalid ObjectId: ${id}`);
                }
                return new ObjectId(id);
            });
            console.log("Successfully converted to ObjectIds:", objectIds);
        } catch (idError) {
            console.error("Error converting report IDs to ObjectId:", idError);
            return res.status(400).json({ error: "Invalid report ID format", details: idError.message });
        }
        
        // Get all reports to delete (to find PDF paths)
        const reportsToDelete = await reportsCollection.find({
            _id: { $in: objectIds }
        }).toArray();

        // Create deleted reports folder if it doesn't exist
        const deletedReportsDir = path.join(process.cwd(), 'deleted-reports');
        if (!fs.existsSync(deletedReportsDir)) {
            fs.mkdirSync(deletedReportsDir, { recursive: true });
        }

        let movedPDFs = 0;
        let failedPDFs = 0;

        // Move PDF files to deleted reports folder
        for (const report of reportsToDelete) {
            if (report.pdfPath && fs.existsSync(report.pdfPath)) {
                try {
                    const originalFilename = path.basename(report.pdfPath);
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const newFilename = `${timestamp}-${originalFilename}`;
                    const newPath = path.join(deletedReportsDir, newFilename);
                    
                    fs.renameSync(report.pdfPath, newPath);
                    movedPDFs++;
                    console.log(`Moved PDF file from ${report.pdfPath} to ${newPath}`);
                } catch (pdfError) {
                    failedPDFs++;
                    console.warn(`Failed to move PDF file: ${report.pdfPath}`, pdfError);
                }
            }
        }

        // Delete reports from database
        const deleteResult = await reportsCollection.deleteMany({
            _id: { $in: objectIds }
        });

        res.status(200).json({
            success: true,
            message: `Bulk deletion completed`,
            deletedReports: deleteResult.deletedCount,
            totalRequested: reportIds.length,
            movedPDFs,
            failedPDFs
        });

        // Log the bulk deletion for audit purposes
        console.log(`Admin ${req.user.email} bulk deleted ${deleteResult.deletedCount} reports`);

    } catch (err) {
        console.error("Error with bulk delete:", err);
        res.status(500).json({ 
            error: "Error with bulk delete",
            details: err.message 
        });
    }
});

/**
 * DELETE /admin/reports/all - Delete all reports (Admin only)
 * Accessible to: admin only
 */
router.delete("/reports/all", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        const reportsCollection = database.collection("reports");
        
        // Get all reports (to find PDF paths)
        const allReports = await reportsCollection.find({}).toArray();

        // Create deleted reports folder if it doesn't exist
        const deletedReportsDir = path.join(process.cwd(), 'deleted-reports');
        if (!fs.existsSync(deletedReportsDir)) {
            fs.mkdirSync(deletedReportsDir, { recursive: true });
        }

        let movedPDFs = 0;
        let failedPDFs = 0;

        // Move all PDF files to deleted reports folder
        for (const report of allReports) {
            if (report.pdfPath && fs.existsSync(report.pdfPath)) {
                try {
                    const originalFilename = path.basename(report.pdfPath);
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const newFilename = `${timestamp}-${originalFilename}`;
                    const newPath = path.join(deletedReportsDir, newFilename);
                    
                    fs.renameSync(report.pdfPath, newPath);
                    movedPDFs++;
                    console.log(`Moved PDF file from ${report.pdfPath} to ${newPath}`);
                } catch (pdfError) {
                    failedPDFs++;
                    console.warn(`Failed to move PDF file: ${report.pdfPath}`, pdfError);
                }
            }
        }

        // Delete all reports from database
        const deleteResult = await reportsCollection.deleteMany({});

        res.status(200).json({
            success: true,
            message: `All reports deleted successfully`,
            deletedReports: deleteResult.deletedCount,
            movedPDFs,
            failedPDFs
        });

        // Log the complete deletion for audit purposes
        console.log(`Admin ${req.user.email} deleted ALL ${deleteResult.deletedCount} reports`);

    } catch (err) {
        console.error("Error deleting all reports:", err);
        res.status(500).json({ 
            error: "Error deleting all reports",
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

        // Move the PDF file to deleted reports folder if it exists
        let pdfMoved = false;
        if (report.pdfPath && fs.existsSync(report.pdfPath)) {
            try {
                // Create deleted reports folder if it doesn't exist
                const deletedReportsDir = path.join(process.cwd(), 'deleted-reports');
                if (!fs.existsSync(deletedReportsDir)) {
                    fs.mkdirSync(deletedReportsDir, { recursive: true });
                }

                const originalFilename = path.basename(report.pdfPath);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const newFilename = `${timestamp}-${originalFilename}`;
                const newPath = path.join(deletedReportsDir, newFilename);
                
                fs.renameSync(report.pdfPath, newPath);
                pdfMoved = true;
                console.log(`Moved PDF file from ${report.pdfPath} to ${newPath}`);
            } catch (pdfError) {
                console.error(`Error moving PDF file: ${pdfError.message}`);
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
            pdfMoved,
            reportId: req.params.id
        });

        // Log the deletion for audit purposes
        console.log(`Admin ${req.user.email} deleted report ${req.params.id} and moved its PDF to deleted reports folder`);

    } catch (err) {
        console.error("Error deleting report:", err);
        res.status(500).json({ 
            error: "Error deleting report",
            details: err.message 
        });
    }
});

export default router;
