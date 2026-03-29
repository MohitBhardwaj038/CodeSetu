import express from 'express';
import { createProblem, deleteProblem, getAllProblems, getProblemBySlug, updateProblem } from '../controllers/problem.controller.js';
const router = express.Router();


// public routes for users
router.route('/problems').get(getAllProblems);
router.route('/problems/:slug').get(getProblemBySlug);

// admin routes for problems 
router.route('/admin/problems').post(createProblem);
router.route('/admin/problems/:slug').patch(updateProblem);
router.route('/admin/problems/:slug').delete(deleteProblem);

export default router;