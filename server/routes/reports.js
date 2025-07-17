import express from "express";
import PDFReportGenerator from "../services/pdfGenerator.js";
import { getDatabase } from "../db/connection.js";
import User from "../models/user.js";
import Project from "../models/project.js";
import fs from "fs";

// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

// Initialize PDF generator
const pdfGenerator = new PDFReportGenerator();

// This section will create a new report and generate a PDF.
router.post("/", async (req, res) => {
    try {
        // Create the report document
        let newDocument = {
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            jobname: req.body.jobname,
            jobid: req.body.jobid,
            projectId: req.body.projectId, // Add project ID reference
            inspectorId: req.body.inspectorId, // Add inspector ID reference
            createdAt: new Date(),
        };

        // Get database connection
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }

        let collection = database.collection("reports");
        let result = await collection.insertOne(newDocument);
        
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

        // Generate PDF report
        try {
            const pdfPath = await pdfGenerator.generateReportPDF(
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

// This section will help you get a list of all reports.
router.get("/", async (req, res) => {
    try {
        const database = await getDatabase();
        if (!database) {
            return res.status(500).json({ error: "Database connection not available" });
        }
        
        let collection = database.collection("reports");
        let results = await collection.find({}).toArray();
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching reports:", err);
        res.status(500).json({ 
            error: "Error fetching reports",
            details: err.message 
        });
    }
});
// This section will help you get a single report by id
router.get("/:id", async (req, res) => {
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

// This section will help you update a report by id.
router.patch("/:id", async (req, res) => {
    try {
        const query = { _id: new ObjectId(req.params.id) };
        const updates = {
            $set: {
                title: req.body.title,
                content: req.body.content,
                author: req.body.author,
                jobname: req.body.jobname,
                jobid: req.body.jobid,
            },
        };

        let collection = await db.collection("reports");
        let result = await collection.updateOne(query, updates);
        res.send(result).status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating report");
    }
});

// This section will help you delete a report by id.
router.delete("/:id", async (req, res) => {
    try {
        const query = { _id: new ObjectId(req.params.id) };
        let collection = await db.collection("reports");
        let result = await collection.deleteOne(query);

        if (result.deletedCount === 0) {
            res.send("Not found").status(404);
        } else {
            res.send("Report deleted successfully").status(200);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting report");
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
router.delete("/job/:jobid", async (req, res) => {
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
router.get("/:id/pdf", async (req, res) => {
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

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.id}.pdf"`);
        
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
router.post("/:id/regenerate-pdf", async (req, res) => {
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

        // Generate new PDF
        const pdfPath = await pdfGenerator.generateReportPDF(
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