const User = require("../models/User");

// ─────────────────────────────────────────────
// @route   GET /api/user/profile
// @desc    Get authenticated user's own profile
// @access  Private — any verified user (user + admin)
// ─────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    console.log(`\n📥 [Get Profile] Request from: ${req.user.email} | Role: ${req.user.role}`);

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    console.log(`✅ [Get Profile] Profile fetched for: ${user.email}`);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(`❌ [Get Profile] Error:`, error.message);
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/user/all-users
// @desc    Get all registered users
// @access  Private — Admin only
// ─────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    console.log(`\n📥 [Get All Users] Admin request from: ${req.user.email}`);

    const users = await User.find({ isVerified: true }).select("-password");
    console.log(`✅ [Get All Users] Found ${users.length} verified users`);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(`❌ [Get All Users] Error:`, error.message);
    next(error);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/user/:id
// @desc    Delete a user by ID
// @access  Private — Admin only
// ─────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    console.log(`\n📥 [Delete User] Admin: ${req.user.email} deleting user: ${req.params.id}`);

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      console.warn(`⚠️  [Delete User] User not found: ${req.params.id}`);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    console.log(`✅ [Delete User] Deleted user: ${user.email}`);
    res.status(200).json({
      success: true,
      message: `User ${user.email} deleted successfully.`,
    });
  } catch (error) {
    console.error(`❌ [Delete User] Error:`, error.message);
    next(error);
  }
};

module.exports = { getProfile, getAllUsers, deleteUser };
