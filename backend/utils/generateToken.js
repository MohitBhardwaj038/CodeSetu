import jwt from "jsonwebtoken";
import env from "./env.js";
/**
 * Generates a signed JWT for the given user ID
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  console.log(`🔑 [JWT] Generating token for user: ${userId}`);
  const token = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || "7d",
  });
  console.log(`✅ [JWT] Token generated successfully`);
  return token;
};


export default generateToken;