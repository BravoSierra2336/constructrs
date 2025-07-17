
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
      w: 'majority',
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false
    });

    // Connect the client to the server with retry logic
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB Atlas!");
    
    // Set the database
    db = client.db("Construction");
    console.log("✅ Connected to Construction database");
    
    return db;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    
    // Try fallback connection with minimal SSL settings
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log("🔄 Attempting fallback connection with minimal SSL settings...");
      try {
        client = new MongoClient(uri, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: false,
            deprecationErrors: false,
          },
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 30000,
          retryWrites: true,
          w: 'majority'
        });
        
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Fallback connection successful!");
        
        db = client.db("Construction");
        return db;
      } catch (fallbackError) {
        console.error("❌ Fallback connection also failed:", fallbackError.message);
      }
    }
    
    console.log("⚠️ Server will continue running without database connection");
    return null;
  }
}

// Function to get database instance (wait for connection if needed)
async function getDatabase() {
  if (!db) {
    db = await connectToDatabase();
  }
  return db;
}

// Connect to database when module is imported
connectToDatabase().then(database => {
  db = database;
}).catch(error => {
  console.error("Initial database connection failed:", error.message);
});

export { getDatabase };
export default getDatabase;
