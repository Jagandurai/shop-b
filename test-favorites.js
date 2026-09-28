import mongoose from "mongoose";
import dotenv from "dotenv";
import Image from "./src/models/Image.js";
import Favorite from "./src/models/Favorite.js";
import AllowedUser from "./src/models/AllowedUser.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/beauty-parlour";

async function testFavorites() {
  console.log("Starting favorites tests...");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    const testEmail = "test@example.com";
    const testEmail2 = "test2@example.com";

    await Favorite.deleteMany({ userId: { $in: [testEmail, testEmail2] } });
    console.log("✓ Cleaned up existing test favorites");

    const testImage = await Image.findOne();
    if (!testImage) {
      console.log("✗ No test image found. Please upload an image first.");
      process.exit(1);
    }
    console.log(`✓ Found test image: ${testImage.id}`);

    console.log("\n--- Test 1: Add favorite ---");
    const favorite1 = await Favorite.create({
      userId: testEmail,
      imageId: testImage.id,
    });
    console.log("✓ Favorite created:", favorite1);

    console.log("\n--- Test 2: Prevent duplicate favorite ---");
    try {
      await Favorite.create({
        userId: testEmail,
        imageId: testImage.id,
      });
      console.log("✗ Duplicate favorite was allowed (should have failed)");
    } catch (error) {
      if (error.code === 11000) {
        console.log("✓ Duplicate favorite prevented with unique constraint");
      } else {
        console.log("✗ Unexpected error:", error.message);
      }
    }

    console.log("\n--- Test 3: Get user favorites ---");
    const userFavorites = await Favorite.find({ userId: testEmail });
    console.log(`✓ User has ${userFavorites.length} favorite(s)`);

    console.log("\n--- Test 4: Another user's favorites ---");
    await Favorite.create({
      userId: testEmail2,
      imageId: testImage.id,
    });
    const user2Favorites = await Favorite.find({ userId: testEmail2 });
    console.log(`✓ User 2 has ${user2Favorites.length} favorite(s)`);

    console.log("\n--- Test 5: Users cannot see each other's favorites ---");
    const user1FavoritesAgain = await Favorite.find({ userId: testEmail });
    if (user1FavoritesAgain.length === 1) {
      console.log("✓ User 1 can only see their own favorites");
    } else {
      console.log("✗ User 1 can see other users' favorites");
    }

    console.log("\n--- Test 6: Remove favorite ---");
    const deleted = await Favorite.findOneAndDelete({
      userId: testEmail,
      imageId: testImage.id,
    });
    if (deleted) {
      console.log("✓ Favorite removed successfully");
    } else {
      console.log("✗ Failed to remove favorite");
    }

    console.log("\n--- Test 7: User with zero favorites ---");
    const emptyFavorites = await Favorite.find({ userId: testEmail });
    if (emptyFavorites.length === 0) {
      console.log("✓ User with zero favorites returns empty array");
    } else {
      console.log("✗ User still has favorites after deletion");
    }

    console.log("\n--- Test 8: Invalid image ID ---");
    try {
      await Favorite.create({
        userId: testEmail,
        imageId: new mongoose.Types.ObjectId(),
      });
      console.log("✗ Favorite with non-existent image was allowed");
    } catch (error) {
      console.log("✓ Note: Database allows non-existent image IDs (API should validate)");
    }

    await Favorite.deleteMany({ userId: { $in: [testEmail, testEmail2] } });
    console.log("\n✓ Cleanup completed");

    console.log("\n=== All tests completed ===");
  } catch (error) {
    console.error("✗ Test error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

testFavorites();
