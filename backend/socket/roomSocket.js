import { Room } from "../models/room.model.js";

// Active timers: roomCode → intervalId
const activeTimers = new Map();

/**
 * Build leaderboard from room participants.
 * Handles both populated (userId is an object) and unpopulated (userId is an ObjectId).
 */
function buildLeaderboard(room) {
  return room.participants
    .map((p) => {
      const isPopulated = p.userId && typeof p.userId === "object" && p.userId.name;
      return {
        userId: isPopulated ? String(p.userId._id) : String(p.userId),
        name: isPopulated ? p.userId.name : null,
        email: isPopulated ? p.userId.email : null,
        score: p.score || 0,
        solvedProblems: p.solvedProblems ? p.solvedProblems.length : 0,
        lastSolvedAt:
          p.solvedProblems && p.solvedProblems.length > 0
            ? Math.max(...p.solvedProblems.map((s) => new Date(s.solvedAt).getTime()))
            : null,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.lastSolvedAt && b.lastSolvedAt)
        return a.lastSolvedAt - b.lastSolvedAt;
      return 0;
    });
}

/**
 * Start countdown timer for a room
 */
function startRoomTimer(io, room) {
  const roomCode = room.roomCode;
  const endTime = new Date(room.startedAt).getTime() + room.durationMinutes * 60 * 1000;

  // Clear any existing timer
  if (activeTimers.has(roomCode)) {
    clearInterval(activeTimers.get(roomCode));
  }

  const interval = setInterval(async () => {
    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    const remainingSecs = Math.ceil(remainingMs / 1000);

    // Broadcast tick
    io.to(roomCode).emit("timer-tick", { remainingSecs, remainingMs });

    if (remainingSecs <= 0) {
      clearInterval(interval);
      activeTimers.delete(roomCode);

      try {
        const finishedRoom = await Room.findOneAndUpdate(
          { roomCode },
          { status: "finished", endedAt: new Date() },
          { new: true }
        ).populate("participants.userId", "name email");

        if (finishedRoom) {
          const leaderboard = enrichLeaderboard(
            finishedRoom,
            buildLeaderboard(finishedRoom)
          );
          io.to(roomCode).emit("room-ended", { leaderboard });
        }
      } catch (err) {
        console.error(`❌ [Socket] Error ending room ${roomCode}:`, err.message);
      }
    }
  }, 1000);

  activeTimers.set(roomCode, interval);
}

/**
 * Register all Socket.IO room event handlers
 */
export function registerRoomSocket(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 [Socket] Client connected: ${socket.id}`);

    // ── Join room namespace ─────────────────────────
    socket.on("join-room", async ({ roomCode, userId }) => {
      try {
        socket.join(roomCode);
        console.log(`👤 [Socket] User ${userId} joined room ${roomCode}`);

        const room = await Room.findOne({ roomCode })
          .populate("participants.userId", "name email")
          .populate(
            "problems",
            "title difficulty slug _id starterCode description examples constraints"
          );

        if (!room) {
          socket.emit("room-error", { message: "Room not found" });
          return;
        }

        const leaderboard = enrichLeaderboard(room, buildLeaderboard(room));

        // Send current room state to the newly joined user
        socket.emit("room-state", {
          room: {
            roomCode: room.roomCode,
            name: room.name,
            status: room.status,
            durationMinutes: room.durationMinutes,
            startedAt: room.startedAt,
            problems: room.problems,
            participants: room.participants,
          },
          leaderboard,
        });

        // Notify others
        socket.to(roomCode).emit("participant-joined", {
          userId,
          participantCount: room.participants.length,
        });

        // If room is already active, resume timer info
        if (room.status === "active" && room.startedAt) {
          const endTime =
            new Date(room.startedAt).getTime() + room.durationMinutes * 60 * 1000;
          const remainingMs = Math.max(0, endTime - Date.now());
          socket.emit("timer-tick", {
            remainingSecs: Math.ceil(remainingMs / 1000),
            remainingMs,
          });
        }
      } catch (err) {
        console.error(`❌ [Socket] join-room error:`, err.message);
        socket.emit("room-error", { message: err.message });
      }
    });

    // ── Leave room ──────────────────────────────────
    socket.on("leave-room", ({ roomCode, userId }) => {
      socket.leave(roomCode);
      console.log(`👋 [Socket] User ${userId} left room ${roomCode}`);
      socket.to(roomCode).emit("participant-left", { userId });
    });

    // ── Start room (called by creator via REST, but also socket) ──
    socket.on("start-room", async ({ roomCode, userId }) => {
      try {
        const room = await Room.findOne({ roomCode })
          .populate("participants.userId", "name email")
          .populate(
            "problems",
            "title difficulty slug _id starterCode description examples constraints"
          );

        if (!room) {
          socket.emit("room-error", { message: "Room not found" });
          return;
        }

        if (String(room.createdBy) !== String(userId)) {
          socket.emit("room-error", { message: "Only the room creator can start the room" });
          return;
        }

        if (room.status !== "waiting") {
          socket.emit("room-error", { message: "Room already started or finished" });
          return;
        }

        room.status = "active";
        room.startedAt = new Date();
        await room.save();

        io.to(roomCode).emit("room-started", {
          startedAt: room.startedAt,
          durationMinutes: room.durationMinutes,
          problems: room.problems,
        });

        startRoomTimer(io, room);
        console.log(`🚀 [Socket] Room ${roomCode} started`);
      } catch (err) {
        console.error(`❌ [Socket] start-room error:`, err.message);
        socket.emit("room-error", { message: err.message });
      }
    });

    // ── Broadcast leaderboard update (called internally) ──
    socket.on("request-leaderboard", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode }).populate(
          "participants.userId",
          "name email"
        );
        if (room) {
          io.to(roomCode).emit("leaderboard-update", {
            leaderboard: enrichLeaderboard(room, buildLeaderboard(room)),
          });
        }
      } catch (err) {
        console.error(`❌ [Socket] request-leaderboard error:`, err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 [Socket] Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Attach user display info for leaderboard UI
 */
function enrichLeaderboard(room, leaderboard) {
  return leaderboard.map((entry) => {
    const participant = room.participants.find(
      (p) => String(p.userId?._id || p.userId) === String(entry.userId)
    );
    const populated = participant?.userId;
    const name =
      entry.name ||
      (populated && typeof populated === "object" ? populated.name : null);
    return {
      ...entry,
      name,
      user: populated && typeof populated === "object"
        ? { name: populated.name, email: populated.email }
        : name
          ? { name }
          : null,
    };
  });
}

export { buildLeaderboard, enrichLeaderboard, startRoomTimer };
