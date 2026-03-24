const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for the given user ID
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  console.log(`🔑 [JWT] Generating token for user: ${userId}`);
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  console.log(`✅ [JWT] Token generated successfully`);
  return token;
};

module.exports = generateToken;
