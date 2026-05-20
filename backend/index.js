import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import env, { validateEnv } from './utils/env.js';
import { checkJudge0Health } from './utils/judge0Client.js';
import { connectDB } from './config/db.js';
import { registerRoomSocket, startRoomTimer } from './socket/roomSocket.js';
import { Room } from './models/room.model.js';

const allowedOrigins = env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible from controllers via req.app.get('io')
app.set('io', io);

// Register all Socket.IO handlers
registerRoomSocket(io);

async function resumeActiveRoomTimers() {
  const activeRooms = await Room.find({
    status: 'active',
    startedAt: { $ne: null },
  });

  for (const room of activeRooms) {
    const endTime =
      new Date(room.startedAt).getTime() + room.durationMinutes * 60 * 1000;

    if (endTime <= Date.now()) {
      await Room.findOneAndUpdate(
        { roomCode: room.roomCode },
        { status: 'finished', endedAt: new Date() }
      );
      console.log(`⏱️  [Room] Auto-finished expired room ${room.roomCode}`);
    } else {
      startRoomTimer(io, room);
      console.log(`⏱️  [Room] Resumed timer for ${room.roomCode}`);
    }
  }
}

validateEnv();

connectDB()
  .then(async () => {
    await resumeActiveRoomTimers();

    try {
      const judgeOk = await checkJudge0Health();
      console.log(
        judgeOk
          ? `✅ Judge0 reachable at ${env.JUDGE0_API_URL}`
          : `⚠️  Judge0 health check failed`
      );
    } catch (err) {
      console.warn(`⚠️  Judge0 not reachable: ${err.message}`);
      console.warn(`   Set JUDGE0_API_URL or start: docker compose up -d`);
    }

    server.listen(env.PORT, () => {
      console.log(`🚀 Server is running on port ${env.PORT}`);
      console.log(`🔌 Socket.IO ready`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to the database. Server not started.', err);
  });
