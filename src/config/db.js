import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ MONGO_URI is not defined in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB Connected Successfully");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB Disconnected");
});

export default connectDB;