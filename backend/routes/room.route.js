import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRoom,
  joinRoom,
  getRoom,
  listPublicRooms,
  startRoom,
  getLeaderboard,
} from "../controllers/room.controller.js";

const router = express.Router();

// Inject io instance from app
router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

router.get("/", listPublicRooms);
router.post("/", protect, createRoom);
router.get("/:code", protect, getRoom);
router.post("/:code/join", protect, joinRoom);
router.post("/:code/start", protect, startRoom);
router.get("/:code/leaderboard", protect, getLeaderboard);

export default router;
