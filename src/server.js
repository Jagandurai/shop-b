import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

let server;

const gracefulShutdown = async () => {
  console.log("\n⚠️ Received shutdown signal");

  try {
    if (server) {
      server.close(() => {
        console.log("HTTP server closed");
      });
    }

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

const startServer = async () => {
  try {
    const { default: app } = await import("./app.js");
    const { default: connectDB } = await import("./config/db.js");

    await connectDB();
    console.log("✅ Database connected");

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();