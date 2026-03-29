import express from 'express';
import { createSubmission, getSubmissionsByUser,run} from '../controllers/submission.controller.js';

const router = express.Router({mergeParams:true});

router.route('/problems/:problemId/submissions').post(createSubmission);
router.route('/problems/:problemId/run-code').get(run);
router.route('/problems/:problemId/submissions/:userId').get(getSubmissionsByUser);

export default router;