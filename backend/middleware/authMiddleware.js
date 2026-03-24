const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes — verifies JWT Bearer token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      console.warn(`🚫 [Auth Middleware] No token provided — access denied`);
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    console.log(`🔍 [Auth Middleware] Verifying JWT token...`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn(`🚫 [Auth Middleware] Token valid but user not found: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: "Not authorized. User not found.",
      });
    }

    console.log(`✅ [Auth Middleware] Authenticated user: ${user.email} | Role: ${user.role}`);
    req.user = user;
    next();
  } catch (error) {
    console.error(`❌ [Auth Middleware] Token verification error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * Usage: authorize("admin") or authorize("admin", "user")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.warn(
        `🚫 [Auth Middleware] Access denied for role "${req.user.role}". Required: [${roles.join(", ")}]`
      );
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is restricted to: ${roles.join(", ")}.`,
      });
    }
    console.log(`✅ [Auth Middleware] Role "${req.user.role}" authorized`);
    next();
  };
};

module.exports = { protect, authorize };
