import { createRequire } from 'module';
import fs from "fs";
import path from "path";
import { getDatabase } from "../db/connection.js";
import User from "../models/user.js";
import { ObjectId } from "mongodb";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Resolve a report's PDF path across environments (local/prod) and cwd variants
const resolvePdfPath = (report) => {
    if (!report) return null;
    const candidates = [];
    const cwd = process.cwd();
    const pdfPath = report.pdfPath;
    const pdfFileName = pdfPath ? path.basename(pdfPath) : null;

    if (pdfPath) {
        // Absolute or relative as recorded
        candidates.push(path.isAbsolute(pdfPath) ? pdfPath : path.resolve(cwd, pdfPath));
    }
    if (pdfFileName) {
        // Typical locations depending on where node was started from
        candidates.push(path.join(cwd, 'generated-reports', pdfFileName));
        candidates.push(path.join(cwd, 'server', 'generated-reports', pdfFileName));
        candidates.push(path.join(cwd, '..', 'server', 'generated-reports', pdfFileName));
    }

    for (const p of candidates) {
        try {
            if (p && fs.existsSync(p)) return p;
        } catch {}
    }
    return null;
};

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
            const resolvedPath = resolvePdfPath(report);
            if (resolvedPath) {
                pdfExists = true;
                try {
                    const stats = fs.statSync(resolvedPath);
                    pdfSize = Math.round(stats.size / 1024); // Size in KB
                } catch (err) {
                    console.warn(`Error getting PDF stats for ${resolvedPath}:`, err.message);
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
 * USER MANAGEMENT (Admin only)
 * Endpoints to list, create, update, and delete users
 */

// Helper: collections and utilities
const getUsersCollection = async () => (await getDatabase()).collection('users');
const getAuditCollection = async () => (await getDatabase()).collection('audit_logs');
const logAudit = async ({ actorId, action, targetId, details = {}, req }) => {
    try {
        const col = await getAuditCollection();
        await col.insertOne({
            actorId: actorId ? new ObjectId(actorId) : null,
            action, // e.g., 'user.create', 'user.update.role', 'user.delete'
            targetId: targetId ? new ObjectId(targetId) : null,
            details,
            ip: req?.ip,
            userAgent: req?.headers['user-agent'],
            createdAt: new Date()
        });
    } catch (e) {
        console.warn('Audit log failed:', e.message);
    }
};
const countOtherAdmins = async (excludeId) => {
    const col = await getUsersCollection();
    const filter = excludeId ? { role: 'admin', _id: { $ne: new ObjectId(excludeId) } } : { role: 'admin' };
    return col.countDocuments(filter);
};

// GET /admin/users - List users with search and pagination (Admin only)
router.get("/users", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const q = (req.query.q || '').toString().trim();
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '25', 10), 1), 200);

        const col = await getUsersCollection();
        const filter = q
            ? {
                $or: [
                    { firstName: { $regex: q, $options: 'i' } },
                    { lastName: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ]
              }
            : {};

        const total = await col.countDocuments(filter);
        const users = await col
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .project({ password: 0, microsoftAccessToken: 0, microsoftRefreshToken: 0 })
            .toArray();

        res.json({ success: true, users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /admin/users - Create a new user (Admin only)
router.post("/users", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { firstName, lastName, email, password, role = 'employee', jobName } = req.body;
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password,
            role,
            jobName: jobName || role,
            isAdmin: role === 'admin'
        });
    // Audit
    await logAudit({ actorId: req.user?.id, action: 'user.create', targetId: newUser._id, details: { role: newUser.role }, req });
    res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /admin/users/:id - Update a user (Admin only)
router.put("/users/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role, jobName, password } = req.body;

        // Prevent removing own admin by downgrading? Allow but warn: not enforced here

        // Fetch current user to check role changes
        const current = await User.findById(id);
        if (!current) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email.toLowerCase();
        if (role !== undefined) {
            updateData.role = role;
            updateData.isAdmin = role === 'admin';
        }
        if (jobName !== undefined) updateData.jobName = jobName;

        // If password provided, hash before update
        if (password && typeof password === 'string' && password.trim().length >= 6) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(password, saltRounds);
        }
        // Last-admin protection: if changing an admin to non-admin and they are the last admin, block
        if (current.role === 'admin' && role && role !== 'admin') {
            const otherAdmins = await countOtherAdmins(id);
            if (otherAdmins === 0) {
                return res.status(400).json({ error: 'Cannot remove the last remaining admin' });
            }
        }

        const updatedUser = await User.updateById(id, updateData);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Audit: role change only
        if (role && role !== current.role) {
            await logAudit({ actorId: req.user?.id, action: 'user.update.role', targetId: id, details: { from: current.role, to: role }, req });
        }
        // Remove sensitive fields
        const { password: _p, microsoftAccessToken, microsoftRefreshToken, ...safe } = updatedUser;
        res.json({ success: true, user: safe });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /admin/users/:id - Delete a user (Admin only)
router.delete("/users/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent deleting self
        if (req.user && req.user.id && req.user.id.toString() === id.toString()) {
            return res.status(400).json({ error: "You can't delete your own account" });
        }
        // Last-admin protection on delete
        const target = await User.findById(id);
        if (!target) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (target.role === 'admin') {
            const otherAdmins = await countOtherAdmins(id);
            if (otherAdmins === 0) {
                return res.status(400).json({ error: 'Cannot delete the last remaining admin' });
            }
        }

        const result = await User.deleteById(id);
        await logAudit({ actorId: req.user?.id, action: 'user.delete', targetId: id, details: { email: target.email, role: target.role }, req });
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(400).json({ error: error.message });
    }
});

// GET /admin/audit-logs - List recent audit logs (Admin only)
router.get('/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 200);
        const col = await getAuditCollection();
        const total = await col.countDocuments({});
        const logs = await col.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();
        // Resolve actor/target names/emails
        const ids = [];
        for (const l of logs) {
            if (l.actorId) ids.push(l.actorId);
            if (l.targetId) ids.push(l.targetId);
        }
        const uniqueIds = Array.from(new Set(ids.map(id => id.toString()))).map(id => new ObjectId(id));
        let userMap = new Map();
        if (uniqueIds.length > 0) {
            const usersCol = await getUsersCollection();
            const users = await usersCol.find({ _id: { $in: uniqueIds } }).project({ firstName: 1, lastName: 1, email: 1 }).toArray();
            userMap = new Map(users.map(u => [u._id.toString(), u]));
        }

        const enriched = logs.map(l => {
            const actorU = l.actorId ? userMap.get(l.actorId.toString()) : null;
            const targetU = l.targetId ? userMap.get(l.targetId.toString()) : null;
            return {
                ...l,
                actor: actorU ? `${actorU.firstName || ''} ${actorU.lastName || ''}`.trim() || actorU.email : (l.actorId || null),
                actorEmail: actorU ? actorU.email : null,
                target: targetU ? `${targetU.firstName || ''} ${targetU.lastName || ''}`.trim() || targetU.email : (l.targetId || null),
                targetEmail: targetU ? targetU.email : null
            };
        });

        res.json({ success: true, logs: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (e) {
        console.error('Error fetching audit logs:', e);
        res.status(500).json({ error: 'Internal server error' });
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

        // Resolve the actual PDF path dynamically
        const actualPath = resolvePdfPath(report);
        if (!actualPath) {
            return res.status(404).json({ error: "PDF file not found" });
        }

        // Extract the actual filename from the path for a proper download filename
        const actualFilename = path.basename(actualPath);

        // Set headers for PDF download with the actual filename
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${actualFilename}"`);
        
        // Stream the PDF file
        const fileStream = fs.createReadStream(actualPath);
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
