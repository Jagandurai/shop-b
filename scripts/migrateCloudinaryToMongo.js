import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const inferTypeFromPublicId = (publicId) => {
  const value = publicId.toLowerCase();

  if (value.includes("/makeup/") || value.includes("makeup")) return "makeup";
  if (value.includes("/hairstyle/") || value.includes("hairstyle")) return "hairstyle";
  if (value.includes("/nails/") || value.includes("nails")) return "nails";
  if (value.includes("/facial/") || value.includes("facial")) return "facial";
  if (value.includes("/bridal/") || value.includes("bridal")) return "bridal";

  return "other";
};

const migrateCloudinaryToMongo = async () => {
  try {
    const { default: connectDB } = await import("../src/config/db.js");
    const { default: cloudinary } = await import("../src/config/cloudinary.js");
    const { default: Image } = await import("../src/models/Image.js");

    await connectDB();
    console.log("✅ Connected to MongoDB");

    let nextCursor = undefined;
    let totalFetched = 0;
    let insertedCount = 0;
    let skippedCount = 0;

    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: "gallery",
        max_results: 100,
        next_cursor: nextCursor,
      });

      const resources = result.resources || [];
      totalFetched += resources.length;

      for (const resource of resources) {
        const existing = await Image.findOne({ public_id: resource.public_id });

        if (existing) {
          skippedCount++;
          continue;
        }

        const type = inferTypeFromPublicId(resource.public_id);

        await Image.create({
          image_url: resource.secure_url,
          public_id: resource.public_id,
          type,
          uploaded_by: "migration-script",
          description: "",
          tags: [],
          createdAt: resource.created_at ? new Date(resource.created_at) : new Date(),
          updatedAt: new Date(),
        });

        insertedCount++;
        console.log(`✅ Inserted: ${resource.public_id}`);
      }

      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log("\n🎉 Migration completed");
    console.log(`Total fetched from Cloudinary: ${totalFetched}`);
    console.log(`Inserted into MongoDB: ${insertedCount}`);
    console.log(`Skipped existing: ${skippedCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

migrateCloudinaryToMongo();