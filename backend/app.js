import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import env from './utils/env.js';

const app = express();

// ── CORS ──────────────────────────────────────────────
const allowedOrigins = env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────
import problemRoutes from './routes/problem.route.js';
import testCaseRoutes from './routes/testCase.route.js';
import submissionRoutes from './routes/submission.route.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import roomRoutes from './routes/room.route.js';
import battleSubmissionRoutes from './routes/battleSubmission.route.js';

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', problemRoutes);
app.use('/api', testCaseRoutes);
app.use('/api', submissionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', battleSubmissionRoutes);

// Global error handler — MUST be last middleware
app.use(errorHandler);

export default app;