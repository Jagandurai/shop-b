import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  try {
    const { default: connectDB } = await import("../src/config/db.js");
    const { default: AllowedUser } = await import("../src/models/AllowedUser.js");

    await connectDB();
    console.log("✅ Connected to MongoDB");

    const users = [
      {
        email: "djagan5656@gmail.com",
        name: "Admin User 1",
        role: "admin",
        isActive: true,
      },
      {
        email: "lovelylooksv@gmail.com",
        name: "Admin User 2",
        role: "admin",
        isActive: true,
      },
    ];

    for (const user of users) {
      await AllowedUser.updateOne(
        { email: user.email.toLowerCase() },
        { $set: { ...user, email: user.email.toLowerCase() } },
        { upsert: true }
      );

      console.log(`✅ Added/Updated: ${user.email}`);
    }

    console.log("🎉 Allowed users seeded successfully");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();