const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true, // stored as bcrypt hash
  },
  purpose: {
    type: String,
    enum: ["register", "login"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // MongoDB TTL: auto-delete when expiresAt passes
  },
});

module.exports = mongoose.model("Otp", otpSchema);
