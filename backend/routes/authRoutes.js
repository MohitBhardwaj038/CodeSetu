const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  registerRequest,
  verifyRegisterOtp,
  login,
} = require("../controllers/authController");

// ── POST /api/auth/register ──────────────────
// Step 1: Send OTP to email for registration
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    body("role").optional().isIn(["user", "admin"]).withMessage("Role must be 'user' or 'admin'"),
  ],
  registerRequest
);

// ── POST /api/auth/register/verify ───────────
// Step 2: Verify OTP → set password → account activated
router.post(
  "/register/verify",
  [
    body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits").isNumeric().withMessage("OTP must be numeric"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  verifyRegisterOtp
);

// ── POST /api/auth/login ─────────────────────
// Login with email + password → returns JWT
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

module.exports = router;
