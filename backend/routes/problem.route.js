import express from 'express';
import { createProblem, deleteProblem, getAllProblems, getProblemBySlug, updateProblem, getAllTags, getAllCompanyTags } from '../controllers/problem.controller.js';
const router = express.Router();

// Public routes — tag lists for filter dropdowns (must come BEFORE :slug routes)
router.route('/problems/tags').get(getAllTags);
router.route('/problems/company-tags').get(getAllCompanyTags);

// Public routes — problem listing and detail
router.route('/problems').get(getAllProblems);
router.route('/problems/:slug').get(getProblemBySlug);

// Admin routes for problems 
router.route('/admin/problems').post(createProblem);
router.route('/admin/problems/:slug').patch(updateProblem);
router.route('/admin/problems/:slug').delete(deleteProblem);

export default router;