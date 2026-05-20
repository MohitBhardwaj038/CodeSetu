import mongoose from "mongoose";

const battleSubmissionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: { type: String, required: true },
    languageId: { type: Number, required: true },
    // No strict enum — Judge0 returns many variants (e.g. "Runtime Error (SIGSEGV)")
    status: {
      type: String,
      default: "Pending",
    },
    executionTimeMs: { type: Number, default: 0 },
    memoryUsedKb: { type: Number, default: 0 },
    timeTakenMs: { type: Number, default: 0 },
    failedTestCase: {
      input: String,
      expectedOutput: String,
      actualOutput: String,
    },
  },
  { timestamps: true }
);

export const BattleSubmission = mongoose.model(
  "BattleSubmission",
  battleSubmissionSchema
);
