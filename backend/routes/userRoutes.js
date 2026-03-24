const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getProfile, getAllUsers, deleteUser } = require("../controllers/userController");

// ── GET /api/user/profile ─────────────────────
// Any authenticated user (user or admin)
router.get("/profile", protect, getProfile);

// ── GET /api/user/all-users ───────────────────
// Admin only — get all verified users
router.get("/all-users", protect, authorize("admin"), getAllUsers);

// ── DELETE /api/user/:id ──────────────────────
// Admin only — delete a user by ID
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
