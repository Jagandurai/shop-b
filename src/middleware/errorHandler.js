export function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err.message);

  // Don't send if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Include stack trace only in development
  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}