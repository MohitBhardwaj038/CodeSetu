require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ─── Connect to MongoDB ───────────────────────
connectDB();

// ─── Security Middleware ──────────────────────
app.use(helmet()); // Sets secure HTTP headers
app.set("trust proxy", 1); // Trust first proxy (needed for rate-limit behind Render/Railway/Heroku)
console.log(`🔒 [Server] Helmet security headers enabled`);

// ─── CORS ─────────────────────────────────────
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
console.log(`🌐 [Server] CORS configured. Allowed origins: ${allowedOrigins}`);

// ─── Compression ──────────────────────────────
app.use(compression());

// ─── HTTP Request Logger ──────────────────────
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// ─── Body Parsers ─────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Global Rate Limiter ──────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
});
app.use(globalLimiter);
console.log(`🛡️  [Server] Global rate limiter: 100 req / 15 min`);

// ─── Auth Rate Limiter (stricter for auth routes) ─
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please try again after 15 minutes." },
});

// ─── Health Check ─────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 MERN OTP Auth API is up and running!",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "healthy", uptime: process.uptime() });
});

// ─── API Routes ───────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/user", userRoutes);
console.log(`🛣️  [Server] Routes mounted: /api/auth | /api/user`);

// ─── 404 Handler ─────────────────────────────
app.use((req, res) => {
  console.warn(`⚠️  [404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 ──────────────────────────────────────────────────`);
  console.log(`🚀  Server running on port: ${PORT}`);
  console.log(`🚀  Environment:            ${NODE_ENV}`);
  console.log(`🚀  Health check:           /health`);
  console.log(`🚀 ──────────────────────────────────────────────────\n`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST   /api/auth/register          → Send registration OTP`);
  console.log(`   POST   /api/auth/register/verify    → Verify OTP + activate account`);
  console.log(`   POST   /api/auth/login              → Login (email + password) → JWT`);
  console.log(`   ──────────────────────────────────────────────────`);
  console.log(`   GET    /api/user/profile            → Own profile   [User + Admin]`);
  console.log(`   GET    /api/user/all-users          → All users     [Admin only]`);
  console.log(`   DELETE /api/user/:id                → Delete user   [Admin only]`);
  console.log(`\n`);
});

// ─── Graceful Shutdown ────────────────────────
const shutdown = (signal) => {
  console.log(`\n⚠️  [Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log(`✅ [Server] HTTP server closed.`);
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM")); // Heroku / Railway / Render sends SIGTERM
process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C in terminal

// ─── Unhandled Promise Rejection Guard ────────
process.on("unhandledRejection", (err) => {
  console.error(`❌ [Server] Unhandled Promise Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// ─── Uncaught Exception Guard ─────────────────
process.on("uncaughtException", (err) => {
  console.error(`❌ [Server] Uncaught Exception: ${err.message}`);
  process.exit(1);
});
