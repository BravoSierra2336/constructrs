
import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = "mongodb+srv://sdv2336jr:Tin%40Estrada2336@employees.7gquzek.mongodb.net/?retryWrites=true&w=majority&appName=employees";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

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
    process.exit(1);
  }
}

// Connect to database when module is imported
connectToDatabase();

export default db;
