
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.ATLAS_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client;
let db;

try {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
} catch (error) {
  console.error("Error creating MongoDB client:", error);
  console.log("Server will continue without database client");
}

async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    // Get the database (replace 'your_database_name' with your actual database name)
    db = client.db("employees"); // or whatever your database name is
    
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Server will continue running without database connection");
    // Don't exit the process, allow server to start without DB
  }
}

// Connect to database when module is imported
connectToDatabase();

export default db;
