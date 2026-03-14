const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Otp = require("../models/Otp");
const generateOtp = require("../utils/generateOtp");
const sendOtpEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Send OTP to email for registration
// @access  Public
// ─────────────────────────────────────────────
const registerRequest = async (req, res, next) => {
  try {
    console.log(`\n📥 [Register Request] Incoming:`, req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`⚠️  [Register Request] Validation failed:`, errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, role } = req.body;

    // Validate role
    const assignedRole = role === "admin" ? "admin" : "user";

    // Check if email is already registered and verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      console.warn(`⚠️  [Register Request] Email already registered: ${email}`);
      return res.status(409).json({
        success: false,
        message: "Email is already registered. Please login.",
      });
    }

    // Remove stale unverified user + old OTPs
    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ email });
      console.log(`🗑️  [Register Request] Removed stale unverified user: ${email}`);
    }
    await Otp.deleteMany({ email, purpose: "register" });
    console.log(`🗑️  [Register Request] Cleared old OTPs for: ${email}`);

    // Generate, hash and save OTP
    const plainOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(plainOtp, 10);

    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000
    );

    await Otp.create({ email, otp: hashedOtp, purpose: "register", expiresAt });
    console.log(`💾 [Register Request] OTP saved. Expires at: ${expiresAt}`);

    // Create a temporary unverified user to hold name + role
    await User.create({
      name,
      email,
      password: await bcrypt.hash("temp_placeholder", 10),
      role: assignedRole,
      isVerified: false,
    });
    console.log(`💾 [Register Request] Temp user created: ${email} | Role: ${assignedRole}`);

    // Send OTP via Gmail
    await sendOtpEmail(email, plainOtp, "register");

    console.log(`✅ [Register Request] OTP sent to: ${email}`);
    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Verify within ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    });
  } catch (error) {
    console.error(`❌ [Register Request] Error:`, error.message);
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register/verify
// @desc    Verify OTP and complete registration
// @access  Public
// ─────────────────────────────────────────────
const verifyRegisterOtp = async (req, res, next) => {
  try {
    console.log(`\n📥 [Verify Register OTP] Incoming:`, { ...req.body, otp: "******" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`⚠️  [Verify Register OTP] Validation failed:`, errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp, password } = req.body;

    // Fetch OTP record
    const otpRecord = await Otp.findOne({ email, purpose: "register" });
    if (!otpRecord) {
      console.warn(`⚠️  [Verify Register OTP] No OTP found for: ${email}`);
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new one.",
      });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      console.warn(`⏰ [Verify Register OTP] OTP expired for: ${email}`);
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      console.warn(`❌ [Verify Register OTP] Invalid OTP for: ${email}`);
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    console.log(`✅ [Verify Register OTP] OTP matched for: ${email}`);

    // Set real hashed password and mark verified
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword, isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Registration session expired. Please start over.",
      });
    }

    // Clean up OTP
    await Otp.deleteMany({ email, purpose: "register" });
    console.log(`🗑️  [Verify Register OTP] OTP cleaned up for: ${email}`);
    console.log(`🎉 [Verify Register OTP] User registered: ${email} | Role: ${user.role}`);

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now login.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(`❌ [Verify Register OTP] Error:`, error.message);
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email + password → returns JWT
// @access  Public
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    console.log(`\n📥 [Login] Incoming request for email:`, req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`⚠️  [Login] Validation failed:`, errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`⚠️  [Login] User not found: ${email}`);
      return res.status(404).json({
        success: false,
        message: "No account found with this email. Please register first.",
      });
    }

    // Must be verified
    if (!user.isVerified) {
      console.warn(`⚠️  [Login] Unverified user: ${email}`);
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please complete registration with OTP first.",
      });
    }

    // Compare password
    console.log(`🔍 [Login] Comparing password for: ${email}`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`❌ [Login] Invalid password for: ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Generate JWT
    const token = generateToken(user._id);

    console.log(`🎉 [Login] Successful login: ${email} | Role: ${user.role}`);
    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(`❌ [Login] Error:`, error.message);
    next(error);
  }
};

module.exports = { registerRequest, verifyRegisterOtp, login };
