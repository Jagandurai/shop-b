import express from "express";
import AllowedUser from "../models/AllowedUser.js";

const router = express.Router();

const normalizeEmail = (email = "") => email.trim().toLowerCase();

/**
 * GET /api/auth/me
 * Validate current session and return authenticated user info
 * This endpoint validates the email provided in headers and returns user info
 */
router.get("/me", async (req, res) => {
  try {
    const rawEmail = req.headers["x-user-email"];
    const email = normalizeEmail(rawEmail);

    if (!email) {
      return res.status(401).json({
        success: false,
        error: "No session found",
      });
    }

    // Check if user is in allowed users list (admin check)
    const user = await AllowedUser.findOne({
      email,
      isActive: true,
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        email,
        isAdmin: user ? user.role === "admin" : false,
        role: user ? user.role : null,
      },
    });
  } catch (err) {
    console.error("Auth session validation error:", err);
    res.status(500).json({
      success: false,
      error: "Session validation failed",
    });
  }
});

export default router;
