import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Problem } from "../models/problem.model.js";
import { TestCase } from "../models/testCase.model.js";
import { Submission } from "../models/submission.model.js";

const DEFAULT_HINTS = [
  "Try a straightforward approach first.",
  "Look for a data structure or pattern to optimize time complexity.",
];

function normalizeStringArray(value, maxLength = Infinity) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item == null ? "" : String(item).trim()))
    .filter(Boolean)
    .slice(0, maxLength);
}

function normalizeHints(value) {
  const hints = normalizeStringArray(value, 2);
  if (hints.length === 0) return [...DEFAULT_HINTS];
  if (hints.length === 1) return [hints[0], DEFAULT_HINTS[1]];
  return hints;
}

function normalizeExamples(examples, fallbackExamples) {
  const source = Array.isArray(examples) && examples.length > 0 ? examples : fallbackExamples;
  if (!Array.isArray(source)) return [];

  return source
    .map((example) => {
      const input = String(example.input ?? "").trim();
      const output = String(example.output ?? example.expectedOutput ?? "").trim();
      const explanation = String(example.explanation ?? "").trim();
      if (!input || !output) return null;
      return {
        input,
        output,
        explanation,
      };
    })
    .filter(Boolean)
    .slice(0, 2);
}

function getFallbackExamplesFromVisibleTestCases(visibleTestCases) {
  return visibleTestCases.slice(0, 2).map((tc) => ({
    input: String(tc.input ?? "").trim(),
    output: String(tc.expectedOutput ?? "").trim(),
    explanation: String(tc.explanation ?? "").trim(),
  }));
}

async function migrateProblems() {
  await connectDB();

  const submissionStats = await Submission.aggregate([
    {
      $group: {
        _id: "$problemId",
        totalSubmissions: { $sum: 1 },
        totalAccepted: {
          $sum: {
            $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statsMap = new Map(
    submissionStats.map((entry) => [
      String(entry._id),
      {
        totalSubmissions: Number(entry.totalSubmissions) || 0,
        totalAccepted: Number(entry.totalAccepted) || 0,
      },
    ])
  );

  const problems = await Problem.find({});
  let updatedCount = 0;

  for (const problem of problems) {
    const problemId = String(problem._id);
    const stats = statsMap.get(problemId) || { totalSubmissions: 0, totalAccepted: 0 };

    const visibleTestCases = await TestCase.find({
      problemId: problem._id,
      isHidden: false,
    })
      .sort({ createdAt: 1 })
      .limit(2)
      .select("input expectedOutput explanation")
      .lean();

    const fallbackExamples = getFallbackExamplesFromVisibleTestCases(visibleTestCases);

    const nextTopicTags = normalizeStringArray(problem.topicTags);
    const nextConstraints = normalizeStringArray(problem.constraints);
    const nextHints = normalizeHints(problem.hints);
    const nextExamples = normalizeExamples(problem.examples, fallbackExamples);
    const nextTotalSubmissions = stats.totalSubmissions;
    const nextTotalAccepted = stats.totalAccepted;
    const nextAcceptanceRate =
      nextTotalSubmissions > 0
        ? Number(((nextTotalAccepted / nextTotalSubmissions) * 100).toFixed(2))
        : 0;

    const hasChanges =
      JSON.stringify(problem.topicTags || []) !== JSON.stringify(nextTopicTags) ||
      JSON.stringify(problem.constraints || []) !== JSON.stringify(nextConstraints) ||
      JSON.stringify(problem.hints || []) !== JSON.stringify(nextHints) ||
      JSON.stringify(problem.examples || []) !== JSON.stringify(nextExamples) ||
      Number(problem.totalSubmissions || 0) !== nextTotalSubmissions ||
      Number(problem.totalAccepted || 0) !== nextTotalAccepted ||
      Number(problem.acceptanceRate || 0) !== nextAcceptanceRate;

    if (!hasChanges) continue;

    problem.topicTags = nextTopicTags;
    problem.constraints = nextConstraints;
    problem.hints = nextHints;
    problem.examples = nextExamples;
    problem.totalSubmissions = nextTotalSubmissions;
    problem.totalAccepted = nextTotalAccepted;
    problem.acceptanceRate = nextAcceptanceRate;

    await problem.save();
    updatedCount += 1;
  }

  console.log(`Migration complete. Updated ${updatedCount} of ${problems.length} problems.`);
}

migrateProblems()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
