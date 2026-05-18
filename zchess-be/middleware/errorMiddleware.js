const AppError = require("../utils/AppError");

/**
 * Centralized error formatting (ported from zlss) so controllers can `throw`
 * or `next(err)` instead of repeating try/catch + status codes.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (!error.statusCode) {
    error.statusCode = 500;
  }

  if (!error.status) {
    error.status = "error";
  }

  if (err.name === "CastError") {
    error = new AppError("Invalid ID format", 400);
  }

  if (err.code === 11000) {
    error = new AppError("Duplicate field value entered", 400);
  }

  if (err.name === "ValidationError") {
    error = new AppError(
      Object.values(err.errors)
        .map((val) => val.message)
        .join(", "),
      400,
    );
  }

  if (err && err.code === "LIMIT_FILE_SIZE") {
    error = new AppError("File quá lớn so với giới hạn cho phép.", 413);
  }

  // Multer fileFilter rejection
  if (err && err.message && /định dạng file/i.test(err.message)) {
    error = new AppError(err.message, 400);
  }

  if (error.statusCode >= 500) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "unhandled_error",
        requestId: req?.id,
        method: req?.method,
        path: req?.originalUrl,
        userId: req?.user?._id ? String(req.user._id) : null,
        statusCode: error.statusCode,
        error: error.message,
        stack: err?.stack,
      }),
    );
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
    requestId: req?.id,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorMiddleware;
