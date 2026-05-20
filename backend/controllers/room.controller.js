import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { Room } from "../models/room.model.js";
import { Problem } from "../models/problem.model.js";
import ApiError from "../utils/apiError.js";
import { buildLeaderboard, enrichLeaderboard, startRoomTimer } from "../socket/roomSocket.js";

// Generate a unique 6-char uppercase room code
function generateRoomCode() {
  return nanoid(6).toUpperCase();
}

// ─── Pick random questions from DB pool ───────────────
async function pickRandomProblems(config) {
  const { easy = 1, medium = 1, hard = 1 } = config;
  const results = [];

  const pick = async (difficulty, count) => {
    if (count <= 0) return;
    const problems = await Problem.aggregate([
      { $match: { difficulty } },
      { $sample: { size: count } },
      { $project: { _id: 1 } },
    ]);
    problems.forEach((p) => results.push(p._id));
  };

  await pick("Easy", easy);
  await pick("Medium", medium);
  await pick("Hard", hard);

  return results;
}

// ─────────────────────────────────────────────────────
// POST /api/rooms  — Create a new battle room
// ─────────────────────────────────────────────────────
export const createRoom = async (req, res, next) => {
  try {
    const {
      name,
      isPrivate = false,
      password,
      durationMinutes = 30,
      questionConfig = { easy: 1, medium: 1, hard: 1 },
    } = req.body;

    if (!name) return next(new ApiError("Room name is required", 400));

    // Hash password if private
    let hashedPassword = null;
    if (isPrivate) {
      if (!password) return next(new ApiError("Password required for private rooms", 400));
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Pick random problems
    const problemIds = await pickRandomProblems(questionConfig);
    if (problemIds.length === 0) {
      return next(new ApiError("No problems found in database. Please seed first.", 400));
    }

    // Unique room code
    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.findOne({ roomCode });
    }

    const room = await Room.create({
      roomCode,
      name,
      createdBy: req.user._id,
      isPrivate,
      password: hashedPassword,
      durationMinutes,
      questionConfig,
      problems: problemIds,
      participants: [{ userId: req.user._id }],
    });

    const populated = await room.populate([
      { path: "problems", select: "title difficulty slug _id starterCode" },
      { path: "createdBy", select: "name email" },
    ]);

    console.log(`✅ [Room] Created room ${roomCode} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: { room: populated },
    });
  } catch (err) {
    console.error("❌ [Room] createRoom error:", err.message);
    next(err);
  }
};

// ─────────────────────────────────────────────────────
// POST /api/rooms/:code/join  — Join a room
// ─────────────────────────────────────────────────────
export const joinRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { password } = req.body;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) return next(new ApiError("Room not found", 404));

    if (room.status === "finished")
      return next(new ApiError("This battle has already ended", 400));

    // Validate password for private rooms
    if (room.isPrivate) {
      if (!password) return next(new ApiError("Password is required to join this room", 400));
      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) return next(new ApiError("Incorrect room password", 401));
    }

    // Check if already a participant
    const alreadyJoined = room.participants.some(
      (p) => String(p.userId) === String(userId)
    );

    if (!alreadyJoined) {
      room.participants.push({ userId });
      await room.save();
    }

    const populated = await room.populate([
      { path: "problems", select: "title difficulty slug _id starterCode" },
      { path: "createdBy", select: "name email" },
      { path: "participants.userId", select: "name email" },
    ]);

    console.log(`✅ [Room] User ${req.user.email} joined room ${code}`);

    res.status(200).json({
      success: true,
      data: { room: populated },
    });
  } catch (err) {
    console.error("❌ [Room] joinRoom error:", err.message);
    next(err);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/rooms/:code  — Get room info
// ─────────────────────────────────────────────────────
export const getRoom = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code.toUpperCase() })
      .populate("problems", "title difficulty slug _id starterCode description examples constraints hints topicTags")
      .populate("createdBy", "name email")
      .populate("participants.userId", "name email");

    if (!room) return next(new ApiError("Room not found", 404));

    res.status(200).json({
      success: true,
      data: { room },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/rooms  — List public waiting/active rooms
// ─────────────────────────────────────────────────────
export const listPublicRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({
      isPrivate: false,
      status: { $in: ["waiting", "active"] },
    })
      .populate("createdBy", "name")
      .select("roomCode name status durationMinutes questionConfig participants createdAt createdBy")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: { rooms },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────
// POST /api/rooms/:code/start  — Start room (creator only)
// ─────────────────────────────────────────────────────
export const startRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { io } = req; // attached via middleware

    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) return next(new ApiError("Room not found", 404));

    if (String(room.createdBy) !== String(req.user._id)) {
      return next(new ApiError("Only the room creator can start the room", 403));
    }

    if (room.status !== "waiting") {
      return next(new ApiError("Room has already started or finished", 400));
    }

    room.status = "active";
    room.startedAt = new Date();
    await room.save();

    const populated = await room.populate(
      "problems",
      "title difficulty slug _id starterCode description examples constraints"
    );

    // Emit socket event
    if (io) {
      io.to(room.roomCode).emit("room-started", {
        startedAt: room.startedAt,
        durationMinutes: room.durationMinutes,
        problems: populated.problems,
      });
      startRoomTimer(io, room);
    }

    console.log(`🚀 [Room] Room ${code} started by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: { room: populated },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────
// GET /api/rooms/:code/leaderboard  — Get leaderboard
// ─────────────────────────────────────────────────────
export const getLeaderboard = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code.toUpperCase() }).populate(
      "participants.userId",
      "name email"
    );

    if (!room) return next(new ApiError("Room not found", 404));

    const leaderboard = enrichLeaderboard(room, buildLeaderboard(room));

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        roomStatus: room.status,
        roomCode: room.roomCode,
      },
    });
  } catch (err) {
    next(err);
  }
};
