
import '../config/env.js'; // Load environment variables first
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.ATLAS_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client;
let db;

async function connectToDatabase() {
  try {
    if (!uri) {
      throw new Error('MongoDB connection string (ATLAS_URI) is not defined in environment variables');
    }
    
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      retryWrites: true,
      w: 'majority'
    });

    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    // Get the database (replace 'your_database_name' with your actual database name)
    db = client.db("Construction"); // or whatever your database name is
    
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Server will continue running without database connection");
    // Don't exit the process, allow server to start without DB
    return null;
  }
}

// Function to get database instance (wait for connection if needed)
async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

// Connect to database when module is imported
connectToDatabase();

export default db;
export { getDatabase };
