import { Submission } from "../models/submission.model.js";
import { Problem } from "../models/problem.model.js";
import ApiError from "../utils/apiError.js";
import { TestCase } from "../models/testCase.model.js";
import { buildSubmissionCode } from "../utils/codeWrapper.js";
import {
  submitBatch,
  pollBatchResults,
  pollSingleResults,
} from "../utils/judge0Client.js";

const buildUserProblemState = (submissionStatus) => ({
  attempted: true,
  submittedSuccessfully: submissionStatus === "Accepted",
  lastSubmissionStatus: submissionStatus,
});

function buildJudge0Submissions(testCases, code, languageId) {
  return testCases.map((tc) => {
    const { sourceCode, usesStdin } = buildSubmissionCode(
      code,
      tc.input,
      parseInt(languageId, 10)
    );
    return {
      language_id: parseInt(languageId, 10),
      source_code: String(sourceCode),
      stdin: usesStdin && tc.input ? String(tc.input) : "",
      expected_output: tc.expectedOutput ? String(tc.expectedOutput) : "",
    };
  });
}

function evaluateResults(finalResults, testCases) {
  let finalStatus = "Accepted";
  let maxTime = 0;
  let maxMemory = 0;
  let failedTestCase = null;

  for (let i = 0; i < finalResults.length; i++) {
    const result = finalResults[i];
    const testCase = testCases[i];
    maxTime = Math.max(maxTime, parseFloat(result.time || 0) * 1000);
    maxMemory = Math.max(maxMemory, result.memory || 0);

    if (result.status.id !== 3) {
      finalStatus = result.status.description;
      failedTestCase = {
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput:
          result.stdout?.trim() ||
          result.stderr ||
          result.compile_output ||
          "",
      };
      break;
    }
  }

  return { finalStatus, maxTime, maxMemory, failedTestCase };
}

const runCode = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const { code, languageId } = req.body;
    if (!code || !languageId) {
      return next(new ApiError("Missing required fields", 400));
    }

    const testCases = await TestCase.find({ problemId, isHidden: false });
    if (!testCases?.length) {
      return next(
        new ApiError("No visible test cases found for this problem", 404)
      );
    }

    const submissions = buildJudge0Submissions(testCases, code, languageId);
    const tokens = await submitBatch(submissions);
    const finalResults = await pollSingleResults(tokens);

    const results = finalResults.map((result, index) => {
      const testCase = testCases[index];
      return {
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput:
          result.stdout?.trim() ||
          result.stderr ||
          result.compile_output ||
          "No output",
        status: result.status.description,
        time: result.time ? parseFloat(result.time) * 1000 : null,
        memory: result.memory || null,
      };
    });

    const overallStatus =
      results.find((item) => item.status !== "Accepted")?.status || "Accepted";

    return res.status(200).json({
      status: "success",
      runStatus: overallStatus,
      results,
    });
  } catch (error) {
    console.error("JUDGE0 ERROR:", error.response?.data || error.message);
    next(error);
  }
};

const createSubmission = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const { code, languageId, userId } = req.body;
    if (!code || !languageId || !userId) {
      return next(new ApiError("Missing required fields", 400));
    }

    const testCases = await TestCase.find({ problemId });
    if (testCases.length === 0) {
      return next(new ApiError("No test cases found for this problem", 404));
    }

    const submissions = buildJudge0Submissions(testCases, code, languageId);
    const tokens = await submitBatch(submissions);
    const finalResults = await pollBatchResults(tokens);
    const { finalStatus, maxTime, maxMemory, failedTestCase } = evaluateResults(
      finalResults,
      testCases
    );

    const newSubmission = await Submission.create({
      userId,
      problemId,
      language: languageId,
      code,
      status: finalStatus,
      executionTimeMs: maxTime,
      memoryUsedKb: maxMemory,
      failedTestCase,
    });

    const problem = await Problem.findById(problemId);
    if (problem) {
      problem.totalSubmissions = (problem.totalSubmissions || 0) + 1;
      if (finalStatus === "Accepted") {
        problem.totalAccepted = (problem.totalAccepted || 0) + 1;
      }
      problem.acceptanceRate =
        problem.totalSubmissions > 0
          ? Number(
              ((problem.totalAccepted / problem.totalSubmissions) * 100).toFixed(2)
            )
          : 0;
      await problem.save();
    }

    res.status(201).json({
      status: "success",
      data: {
        submission: newSubmission,
        userProblemState: buildUserProblemState(finalStatus),
        failedTestCase: finalStatus !== "Accepted" ? failedTestCase : null,
        executionTimeMs: maxTime,
      },
    });
  } catch (error) {
    console.error("JUDGE0 ERROR:", error.response?.data || error.message);
    next(error);
  }
};

const getSubmissionsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const submissions = await Submission.find({ userId })
      .sort("-createdAt")
      .populate({
        path: "problemId",
        select: "title slug difficulty",
      })
      .select("-code -failedTestCase");

    res.status(200).json({
      status: "success",
      results: submissions.length,
      data: { submissions },
    });
  } catch (error) {
    next(error);
  }
};

const getLatestSubmissionByUserAndProblem = async (req, res, next) => {
  try {
    const { problemId, userId } = req.params;
    const submission = await Submission.findOne({ userId, problemId })
      .sort({ createdAt: -1 })
      .select("code language status createdAt executionTimeMs memoryUsedKb");

    res.status(200).json({
      status: "success",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createSubmission,
  getSubmissionsByUser,
  getLatestSubmissionByUserAndProblem,
  runCode as run,
};
