import express from 'express';
import { body } from 'express-validator';
import { registerRequest, verifyRegisterOtp, login } from '../controllers/auth.controller.js';

const router = express.Router();

router.route('/register').post(
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']).withMessage("Role must be 'user' or 'admin'"),
  ],
  registerRequest
);

router.route('/register/verify').post(
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits').isNumeric().withMessage('OTP must be numeric'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  verifyRegisterOtp
);

router.route('/login').post(
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

export default router;
