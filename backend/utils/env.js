import dotenv from 'dotenv';

dotenv.config();

export default {
    PORT:process.env.PORT,
    MONGODB_URI:process.env.MONGODB_URI,
    DB_NAME:process.env.DB_NAME,
    JUDGE0_API_URL:process.env.JUDGE0_API_URL,
    JWT_SECRET:process.env.JWT_SECRET,
    JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN,
    CLIENT_ORIGIN:process.env.CLIENT_ORIGIN,
    GMAIL_USER:process.env.GMAIL_USER,
    GMAIL_PASS:process.env.GMAIL_PASS,
    OTP_EXPIRY_MINUTES:process.env.OTP_EXPIRY_MINUTES || 10,
}



