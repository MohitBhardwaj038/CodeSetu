import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

import problemRoutes from './routes/problem.route.js';
import testCaseRoutes from './routes/testCase.route.js';
import submissionRoutes from './routes/submission.route.js';
import userRoutes from './routes/user.route.js'; 
import authRoutes from './routes/auth.route.js';

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api',problemRoutes);
app.use('/api',testCaseRoutes);
app.use('/api',submissionRoutes);
app.use('/api/user',userRoutes);
app.use('/api/auth',authRoutes);

// Global error handler — MUST be last middleware
app.use(errorHandler);

export default app;