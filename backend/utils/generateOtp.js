const crypto = require("crypto");

/**
 * Generates a secure 6-digit numeric OTP
 * @returns {string} 6-digit OTP as string
 */
const generateOtp = () => {
  // crypto.randomInt(min, max) is cryptographically secure — max is exclusive
  const otp = crypto.randomInt(100000, 999999).toString();
  console.log(`🔐 [OTP Generator] New OTP generated (masked): ******`);
  return otp;
};

module.exports = generateOtp;
