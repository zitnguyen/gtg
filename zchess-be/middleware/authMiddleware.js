const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * JWT auth (same responsibilities as zlss): Bearer token, attach `req.user`,
 * explicit missing-user handling. Kept compatible with existing zchess-be routes.
 */
exports.protect = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    /* Task: Elo khởi điểm 100 cho tài khoản cũ — DucManh-BlueOC */
    if (!Number.isFinite(user.elo) || user.elo < 100) {
      await User.findByIdAndUpdate(user._id, { elo: 100 });
      user.elo = 100;
    }
    req.user = user;
    const now = Date.now();
    const lastSeenMs = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    if (!user.isOnline || now - lastSeenMs > 60 * 1000) {
      await User.findByIdAndUpdate(user._id, {
        isOnline: true,
        lastSeenAt: new Date(now),
      });
      req.user.isOnline = true;
      req.user.lastSeenAt = new Date(now);
    }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Not authorized, token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

exports.optionalProtect = async (req, _res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) return next();

  try {
    if (!process.env.JWT_SECRET) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user) {
      if (!Number.isFinite(user.elo) || user.elo < 100) {
        await User.findByIdAndUpdate(user._id, { elo: 100 });
        user.elo = 100;
      }
      req.user = user;
    }
  } catch {
    // Optional auth should never block public endpoints.
  }
  return next();
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const normalizedAllowedRoles = roles.map((role) =>
      String(role || "").trim().toLowerCase(),
    );
    const currentRole = String(req.user.role || "").trim().toLowerCase();
    if (!normalizedAllowedRoles.includes(currentRole)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
