import express from 'express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

import problemRoutes from './routes/problem.route.js';
import testCaseRoutes from './routes/testCase.route.js';
import submissionRoutes from './routes/submission.route.js';
app.use('/api',problemRoutes);
app.use('/api',testCaseRoutes);
app.use('/api',submissionRoutes);
export default app;