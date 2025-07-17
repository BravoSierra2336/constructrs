import express from "express";

// This will help us connect to the database
import db from "../db/connection.js";

// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

// This section will create a new report.
router.post("/", async (req, res) => {
    try {
        let newDocument = {
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            jobname: req.body.jobname,
            jobid: req.body.jobid,
            createdAt: new Date(),
        };
        let collection = await db.collection("reports");
        let result = await collection.insertOne(newDocument);
        res.send(result).status(201);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating report");
    }
});

// This section will help you get a list of all reports.
router.get("/", async (req, res) => {
    try {
        let collection = await db.collection("reports");
        let results = await collection.find({}).toArray();
        res.send(results).status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching reports");
    }
});
// This section will help you get a single report by id
router.get("/:id", async (req, res) => {
    try {
        let collection = await db.collection("reports");
        let query = { _id: new ObjectId(req.params.id) };
        let result = await collection.findOne(query);

        if (!result) {
            res.send("Not found").status(404);
        } else {
            res.send(result).status(200);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching report");
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
// Export the router to be used in the main server file.
export default router;