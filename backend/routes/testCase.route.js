import express from 'express';
import { createTestCase, deleteTestCase, getTestCasesByProblem, updateTestCase, createMultipleTestCases } from '../controllers/testCase.controller.js';

const router = express.Router({mergeParams:true});

router.route('/admin/problems/:problemId/testcases/bulk').post(createMultipleTestCases);
router.route('/admin/problems/:problemId/testcases').post(createTestCase).get(getTestCasesByProblem);
router.route('/admin/testCases/:id').patch(updateTestCase).delete(deleteTestCase);

export default router;