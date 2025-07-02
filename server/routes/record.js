import express from "express";

// This will help us connect to the database
import db from "../db/connection.js";

// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

// This section will help you get a list of all the records.
router.get("/", async (req, res) => {
  let collection = await db.collection("records");
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

// This section will help you get a single record by id
router.get("/:id", async (req, res) => {
  let collection = await db.collection("records");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// To GET record by jobname
router.get("/jobname/:jobname", async (req, res) => {
  let collection = await db.collection("records");
  let query = { jobclient: req.params.jobname };
  let results = await collection.find(query).toArray();

  if (results.length === 0) {
    res.send("No records found").status(404);
  } else {
    res.send(results).status(200);
  }
});
// This section will help you create a new record.
router.post("/", async (req, res) => {
  try {
    let newDocument = {
      sitename: req.body.sitename,
      location: req.body.location,
      jobclient: req.body.jobclient,
      jobcontractor: req.body.jobcontractor,
    };
    let collection = await db.collection("records");
    let result = await collection.insertOne(newDocument);
    res.send(result).status(204);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding record");
  }
});

// This section will help you update a record by id.
router.patch("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
      sitename: req.body.sitename,
      location: req.body.location,
      jobclient: req.body.jobclient,
      jobcontractor: req.body.jobcontractor,
      latestreport: req.body.latestreport,
      },
    };

    let collection = await db.collection("records");
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating record");
  }
});

// This section will help you delete a record
router.delete("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };

    const collection = db.collection("records");
    let result = await collection.deleteOne(query);

    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting record");
  }
});
// This section will update the latest report
router.patch("/latest", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.body.id) };
    const updates = {
      $set: {
        latestReport: req.body.latestReport,
      },
    };

    let collection = await db.collection("records");
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating latest report");
  }
});
export default router;