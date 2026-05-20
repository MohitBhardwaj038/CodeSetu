import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { battleSubmit, getBattleSubmissions } from "../controllers/battleSubmission.controller.js";

const router = express.Router({ mergeParams: true });

// Inject io instance from app
router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

router.post("/:code/problems/:problemId/submit", protect, battleSubmit);
router.get("/:code/problems/:problemId/submissions", protect, getBattleSubmissions);

export default router;
