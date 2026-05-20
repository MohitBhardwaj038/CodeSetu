import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME || 'code-setu',
  JUDGE0_API_URL:
    process.env.JUDGE0_API_URL ||
    'https://ce.judge0.com/submissions/batch',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASS: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES || 10,
};

export function validateEnv() {
  const missing = [];
  if (!config.MONGODB_URI) missing.push('MONGODB_URI');
  if (!config.JWT_SECRET) missing.push('JWT_SECRET');
  if (!config.GMAIL_USER) missing.push('GMAIL_USER');
  if (!config.GMAIL_PASS) missing.push('GMAIL_PASS or GMAIL_APP_PASSWORD');

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables in backend/.env:\n   ${missing.join('\n   ')}`
    );
    console.error('   Copy backend/.env.example to backend/.env and fill in values.');
    process.exit(1);
  }
}

export default config;



