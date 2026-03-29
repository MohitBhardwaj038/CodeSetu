import express from 'express';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

import problemRoutes from './routes/problem.route.js';
import testCaseRoutes from './routes/testCase.route.js';
import submissionRoutes from './routes/submission.route.js';
import userRoutes from './routes/user.route.js'; 
import authRoutes from './routes/auth.route.js';


app.use('/api',problemRoutes);
app.use('/api',testCaseRoutes);
app.use('/api',submissionRoutes);
app.use('/api/user',userRoutes);
app.use('/api/auth',authRoutes);
export default app;