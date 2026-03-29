import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getProfile, getAllUsers, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

router.route('/profile').get(protect, getProfile);
router.route('/all-users').get(protect, authorize('admin'), getAllUsers);
router.route('/:id').delete(protect, authorize('admin'), deleteUser);

export default router;
