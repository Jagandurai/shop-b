import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Image from "../models/Image.js";
import AllowedUser from "../models/AllowedUser.js";
import Favorite from "../models/Favorite.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const parseTags = (tags) => {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

/**
 * Authenticate user (lightweight - just validates email is present)
 * For favorites, any authenticated Google user can favorite images
 */
const authenticateUser = async (req, res, next) => {
  try {
    const rawEmail = req.headers["x-user-email"];
    const email = normalizeEmail(rawEmail);

    if (!email) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    req.userEmail = email;
    next();
  } catch (err) {
    console.error("authenticateUser error:", err);
    res.status(500).json({
      success: false,
      error: "Authentication check failed",
    });
  }
};

/**
 * Authorize email for upload/delete/update (admin/editor only)
 */
const authorizeEmail = async (req, res, next) => {
  try {
    const rawEmail = req.headers["x-user-email"];
    const email = normalizeEmail(rawEmail);

    if (!email) {
      return res.status(401).json({
        success: false,
        error: "Email required in headers",
      });
    }

    const user = await AllowedUser.findOne({
      email,
      isActive: true,
    }).lean();

    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized email",
      });
    }

    req.userEmail = email;
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error("authorizeEmail error:", err);
    res.status(500).json({
      success: false,
      error: "Authorization check failed",
    });
  }
};

/**
 * GET all images
 * Query params:
 * - type=makeup|hairstyle|nails|facial|bridal|other
 * - page=1
 * - limit=12
 * - sort=latest|oldest
 */
router.get("/", async (req, res) => {
  try {
    const { type, page = 1, limit = 12, sort = "latest" } = req.query;

    const filter = {};

    if (type && type !== "all") {
      filter.type = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const sortOption =
      sort === "oldest"
        ? { isPinned: -1, pinnedAt: -1, createdAt: 1 }
        : { isPinned: -1, pinnedAt: -1, createdAt: -1 };

    const total = await Image.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const images = await Image.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: images,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("Fetch images error:", err);
    res.status(500).json({
      success: false,
      error: "Could not fetch images",
    });
  }
});

/**
 * GET all image types
 * Must come before /:id
 */
router.get("/types/list", async (req, res) => {
  try {
    const types = await Image.distinct("type");

    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (err) {
    console.error("Fetch types error:", err);
    res.status(500).json({
      success: false,
      error: "Could not fetch types",
    });
  }
});

/**
 * GET user's favorites
 * Must come before /:id
 */
router.get("/favorites", authenticateUser, async (req, res) => {
  try {
    const { userEmail } = req;

    const favorites = await Favorite.find({ userId: userEmail })
      .select("imageId createdAt")
      .lean();

    const imageIds = favorites.map((fav) => fav.imageId);

    res.status(200).json({
      success: true,
      data: imageIds,
    });
  } catch (err) {
    console.error("Fetch favorites error:", err);
    res.status(500).json({
      success: false,
      error: "Could not fetch favorites",
    });
  }
});

/**
 * GET single image by id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image id",
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    res.status(200).json({
      success: true,
      data: image,
    });
  } catch (err) {
    console.error("Fetch single image error:", err);
    res.status(500).json({
      success: false,
      error: "Could not fetch image",
    });
  }
});

/**
 * POST upload image
 */
router.post("/", authorizeEmail, upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const { type, description, tags } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: "Image type is required",
      });
    }

    const normalizedTags = parseTags(tags);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "gallery",
        resource_type: "auto",
        use_filename: true,
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({
            success: false,
            error: "Cloudinary upload failed",
          });
        }

        try {
          const newImage = await Image.create({
            image_url: result.secure_url,
            public_id: result.public_id,
            type,
            uploaded_by: req.userEmail,
            description: description || "",
            tags: normalizedTags,
            isPinned: false,
            pinnedAt: null,
          });

          res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            data: newImage,
          });
        } catch (dbError) {
          console.error("MongoDB save error:", dbError);

          try {
            await cloudinary.uploader.destroy(result.public_id);
          } catch (cleanupError) {
            console.error("Cloudinary cleanup error:", cleanupError);
          }

          res.status(500).json({
            success: false,
            error: "Failed to save image metadata",
          });
        }
      }
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      success: false,
      error: "Upload failed",
      details: err.message,
    });
  }
});

/**
 * DELETE image
 */
router.delete("/:id", authorizeEmail, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image id",
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    try {
      await cloudinary.uploader.destroy(image.public_id);
    } catch (cloudinaryError) {
      console.error("Cloudinary delete failed:", cloudinaryError.message);
    }

    await Image.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      deletedId: id,
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      error: "Delete failed",
    });
  }
});

/**
 * Check admin/editor access
 */
router.post("/check-admin", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email required",
      });
    }

    const user = await AllowedUser.findOne({
      email,
      isActive: true,
    }).lean();

    if (!user) {
      return res.status(200).json({
        success: false,
        isAdmin: false,
      });
    }

    res.status(200).json({
      success: true,
      isAdmin: user.role === "admin",
      role: user.role,
      user: {
        email: user.email,
        name: user.name || "",
      },
    });
  } catch (err) {
    console.error("check-admin error:", err);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * PATCH image type
 */
router.patch("/:id/type", authorizeEmail, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const allowedTypes = [
      "makeup",
      "hairstyle",
      "nails",
      "facial",
      "bridal",
      "other",
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image id",
      });
    }

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image type",
      });
    }

    const updatedImage = await Image.findByIdAndUpdate(
      id,
      { type },
      { new: true }
    );

    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image type updated successfully",
      data: updatedImage,
    });
  } catch (err) {
    console.error("Update image type error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update image type",
    });
  }
});

/**
 * PATCH pin / unpin image
 */
router.patch("/:id/pin", authorizeEmail, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image id",
      });
    }

    if (typeof isPinned !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "isPinned must be a boolean",
      });
    }

    const updateData = isPinned
      ? { isPinned: true, pinnedAt: new Date() }
      : { isPinned: false, pinnedAt: null };

    const updatedImage = await Image.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    res.status(200).json({
      success: true,
      message: isPinned ? "Image pinned successfully" : "Image unpinned successfully",
      data: updatedImage,
    });
  } catch (err) {
    console.error("Pin image error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update pin status",
    });
  }
});

/**
 * POST add image to favorites
 */
router.post("/:id/favorite", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image id",
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: "Image not found",
      });
    }

    try {
      const favorite = await Favorite.create({
        userId: userEmail,
        imageId: id,
      });

      res.status(201).json({
        success: true,
        message: "Image added to favourites",
        data: {
          imageId: id,
        },
      });
    } catch (mongoError) {
      if (mongoError.code === 11000) {
        return res.status(409).json({
          success: false,
          error: "Image already in favourites",
        });
      }
      throw mongoError;
    }
  } catch (err) {
    console.error("Add favorite error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add favourite",
    });
  }
});

/**
 * DELETE remove image from favorites
 */
router.delete("/:id/favorite", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image id",
      });
    }

    const result = await Favorite.findOneAndDelete({
      userId: userEmail,
      imageId: id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Favourite not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image removed from favourites",
      data: {
        imageId: id,
      },
    });
  } catch (err) {
    console.error("Remove favorite error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to remove favourite",
    });
  }
});

export default router;