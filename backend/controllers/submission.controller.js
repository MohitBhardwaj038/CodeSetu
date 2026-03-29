import axios from "axios";
import { Submission } from "../models/submission.model.js";
import ApiError from "../utils/apiError.js";
import { TestCase } from "../models/testCase.model.js";
import env from "../utils/env.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseInput(input) {
  if (!input.includes("=")) return { declarations: "", variables: [] };

  const parts = input.match(/(\w+\s*=\s*\[[^\]]*\]|\w+\s*=\s*[^,]+)/g);

  const variables = [];
  const declarations = parts
    .map((part) => {
      const [key, value] = part.split("=").map((x) => x.trim());
      variables.push(key);
      return `const ${key} = ${value};`;
    })
    .join("\n");

  return { declarations, variables };
}

function getFunctionName(code) {
  const match =
    code.match(/function\s+(\w+)\s*\(/) ||
    code.match(/var\s+(\w+)\s*=\s*function/) ||
    code.match(/const\s+(\w+)\s*=\s*\(/); 

  return match ? match[1] : null;
}

const generateWrappedCode = (code, input) => {
  const functionName = getFunctionName(code);

  if (!functionName) {
    console.error("Function name not found");
    return code;
  }

  const { declarations, variables } = parseInput(input);

  const wrappedCode = `
${code}

${declarations}

const result = ${functionName}(${variables.join(", ")});
console.log(JSON.stringify(result));
`;

  console.log("Wrapped Code:\n", wrappedCode);
  return wrappedCode;
};


const runCode = async (req,res,next) => {
  try {
    const {problemId} = req.params;
    const {code, languageId } = req.body;
    if (!code || !languageId) {
      return next(new ApiError("Missing required fields", 400));
    }

    const testCases = await TestCase.findOne({problemId, isHidden: false});
    if (testCases.length === 0) {
      return next(new ApiError("No visible test cases found for this problem",404));
    }
    const testCase = testCases[0];
    const source_code = 
    parseInt(languageId, 10) === 63
    ? generateWrappedCode(code, testCase.input)
    : code;

    const response = await axios.post(
      `${env.JUDGE0_API_URL}?base64_encoded=false`,
      {
        language_id: parseInt(languageId, 10), // FORCE THIS TO BE A NUMBER
      source_code,  
      }
    );
    const result = response.data;

    return res.status(200).json(
      {
        status: "success",
        output: result.stdout?.trim() || result.stderr || result.compile_output || "No output",
        time: result.time ? parseFloat(result.time) * 1000 : null,
        memory: result.memory || null,
      }
    )
  } catch (error) {
    console.error("JUDGE0 ERROR DATA:", error.response?.data || error.message);
    next(error);
  }
}
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
        const source_code =
          parseInt(languageId, 10) === 63
            ? String(generateWrappedCode(code, tc.input))
            : String(code);
        return {
          language_id: parseInt(languageId, 10), // FORCE THIS TO BE A NUMBER
          source_code,
          stdin: tc.input ? String(tc.input) : "",
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
