import nodemailer from "nodemailer";
import env from "./env.js";

// Create reusable Gmail transporter using App Password
const createTransporter = () => {
  console.log(`📧 [Mailer] Initializing Gmail transporter for: ${env.GMAIL_USER}`);
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_PASS,
    },
  });
};

/**
 * Sends an OTP email to the specified address
 * @param {string} to - Recipient email address
 * @param {string} otp - The plain-text OTP to send
 * @param {string} purpose - 'register' or 'login'
 */
const sendOtpEmail = async (to, otp, purpose) => {
  const transporter = createTransporter();

  const subject =
    purpose === "register"
      ? "🔐 Verify Your Email – OTP for Registration"
      : "🔑 Your Login OTP";

  const actionLabel =
    purpose === "register" ? "complete your registration" : "log in to your account";

  const mailOptions = {
    from: `"Auth App" <${env.GMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #555;">Use the OTP below to ${actionLabel}:</p>
        <div style="text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #4A90E2; padding: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">
          This OTP is valid for <strong>${env.OTP_EXPIRY_MINUTES || 10} minutes</strong>. Do NOT share it with anyone.
        </p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #bbb; font-size: 11px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  console.log(`📤 [Mailer] Sending ${purpose} OTP email to: ${to}`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ [Mailer] Email sent! Message ID: ${info.messageId}`);
  return info;
};

export default sendOtpEmail;