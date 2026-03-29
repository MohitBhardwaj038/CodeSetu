import axios from "axios";
import { Submission } from "../models/submission.model.js";
import ApiError from "../utils/apiError.js";
import { TestCase } from "../models/testCase.model.js";
import env from "../utils/env.js";
import { buildSubmissionCode } from "../utils/codeWrapper.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runCode = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const { code, languageId } = req.body;
    if (!code || !languageId) {
      return next(new ApiError("Missing required fields", 400));
    }

    const testCases = await TestCase.find({ problemId, isHidden: false });
    if (!testCases || testCases.length === 0) {
      return next(
        new ApiError("No visible test cases found for this problem", 404)
      );
    }

    // 1. Create a batch submission for all visible test cases
    const submissionPayload = {
      submissions: testCases.map((tc) => {
        const { sourceCode, usesStdin } = buildSubmissionCode(
          code,
          tc.input,
          parseInt(languageId, 10)
        );
        return {
          language_id: parseInt(languageId, 10),
          source_code: sourceCode,
          stdin: usesStdin ? tc.input : undefined,
        };
      }),
    };

    // 2. Post the batch and get tokens
    const submissionResponse = await axios.post(
      `${env.JUDGE0_API_URL}?base64_encoded=false&wait=false`,
      submissionPayload
    );

    const tokens = submissionResponse.data.map((sub) => sub.token);
    if (!tokens || tokens.length === 0) {
      return next(new ApiError("Failed to get submission tokens from Judge0", 500));
    }

    const judge0BaseUrl = env.JUDGE0_API_URL.replace('/batch', '');
    let finalResults = [];

    // 3. Poll for each result individually
    for (const token of tokens) {
      while (true) {
        const resultResponse = await axios.get(`${judge0BaseUrl}/${token}?base64_encoded=false`);
        const statusId = resultResponse.data.status.id;

        if (statusId > 2) { // Statuses 1 (In Queue) and 2 (Processing) are pending
          finalResults.push(resultResponse.data);
          break;
        }
        await delay(250); // Wait before polling again
      }
    }

    // 4. Format and return the array of results
    const results = finalResults.map((result, index) => {
      const testCase = testCases[index];
      return {
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout?.trim() || result.stderr || result.compile_output || "No output",
        status: result.status.description,
        time: result.time ? parseFloat(result.time) * 1000 : null,
        memory: result.memory || null,
      };
    });

    return res.status(200).json({
      status: "success",
      results,
    });

  } catch (error) {
    console.error("JUDGE0 ERROR DATA:", error.response?.data || error.message);
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
    const visibleTestCases = testCases.filter((tc) => !tc.isHidden);
    if (testCases.length === 0) {
      return next(new ApiError("No test cases found for this problem", 404));
    }
    const submissionPayload = {
      submissions: testCases.map((tc) => {
        const { sourceCode, usesStdin } = buildSubmissionCode(
          code,
          tc.input,
          parseInt(languageId, 10)
        );
        return {
          language_id: parseInt(languageId, 10), // FORCE THIS TO BE A NUMBER
          source_code: String(sourceCode),
          stdin: usesStdin && tc.input ? String(tc.input) : "",
          expected_output: tc.expectedOutput ? String(tc.expectedOutput) : "",
        };
      }),
    };

    const postResponse = await axios.post(
      `${env.JUDGE0_API_URL}?base64_encoded=false`,
      submissionPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const tokens = postResponse.data.map((sub) => sub.token).join(",");

    let isProcessing = true;
    let finalResults = [];
    while (isProcessing) {
      await delay(1000);
      const getResponse = await axios.get(
        `${env.JUDGE0_API_URL}?tokens=${tokens}&base64_encoded=false`,
      );
      finalResults = getResponse.data.submissions;
      const stillRunning = finalResults.some((sub) => sub.status.id <= 2);
      if (!stillRunning) {
        isProcessing = false;
      }
    }

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
          actualOutput: result.stdout
            ? result.stdout.trim()
            : result.stderr || result.compile_output,
        };
        break;
      }
    }
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

    res.status(201).json({
      status: "success",
      data: { submission: newSubmission },
    });
  } catch (error) {
    console.error("JUDGE0 ERROR DATA:", error.response?.data || error.message);
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

export { createSubmission, getSubmissionsByUser,runCode as run };
