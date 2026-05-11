import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import galleryRoutes from "./routes/gallery.routes.js";
import emailRoutes from "./routes/email.router.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// ✅ Compression middleware
app.use(compression());

// ✅ CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-email"],
    credentials: true,
  })
);

// ✅ Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ Health check endpoint
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ✅ Gallery API routes
app.use("/api/gallery", galleryRoutes);

// ✅ Email API routes
app.use("/api/email", emailRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// ✅ Global error handler
app.use(errorHandler);

export default app;