import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = "mongodb+srv://lovelylooks:tT81veASVhI72PJx@lovelylooks.ato28ok.mongodb.net/beauty_parlour?appName=lovelylooks";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    
    // Connect to MongoDB
    await client.connect();
    
    // Send a ping to confirm successful connection
    await client.db("admin").command({ ping: 1 });
    
    console.log("✅ Successfully connected to MongoDB Atlas!");
    console.log("✅ Pinged your deployment successfully!");
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("\n⚠️  Troubleshooting:");
    console.error("1. Check IP whitelist (122.166.121.168/32 should be there)");
    console.error("2. Use a VPN or phone hotspot (office network may block)");
    console.error("3. Verify username and password are correct");
  } finally {
    // Close the connection
    await client.close();
    console.log("🔌 Connection closed");
  }
}

run();