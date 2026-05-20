import { Room } from "../models/room.model.js";
import { BattleSubmission } from "../models/battleSubmission.model.js";
import { TestCase } from "../models/testCase.model.js";
import ApiError from "../utils/apiError.js";
import { buildSubmissionCode } from "../utils/codeWrapper.js";
import { buildLeaderboard, enrichLeaderboard } from "../socket/roomSocket.js";
import { submitBatch, pollBatchResults } from "../utils/judge0Client.js";

// ─────────────────────────────────────────────────────
// POST /api/rooms/:code/problems/:problemId/submit
// ─────────────────────────────────────────────────────
export const battleSubmit = async (req, res, next) => {
  try {
    const { code, problemId } = req.params;
    const { languageId, userCode } = req.body;
    const userId = req.user._id;
    const { io } = req;

    if (!userCode || !languageId) {
      return next(new ApiError("Missing code or languageId", 400));
    }

    const room = await Room.findOne({ roomCode: code.toUpperCase() }).populate(
      "participants.userId",
      "name email"
    );
    if (!room) return next(new ApiError("Room not found", 404));
    if (room.status !== "active") {
      return next(new ApiError("Room is not active", 400));
    }

    const participant = room.participants.find(
      (p) => String(p.userId._id || p.userId) === String(userId)
    );
    if (!participant) {
      return next(new ApiError("You are not a participant of this room", 403));
    }

    const alreadySolved = participant.solvedProblems.some(
      (s) => String(s.problemId) === String(problemId)
    );
    if (alreadySolved) {
      return res.status(200).json({
        success: true,
        message: "Already solved",
        status: "Accepted",
      });
    }

    const problemInRoom = room.problems.some(
      (p) => String(p) === String(problemId)
    );
    if (!problemInRoom) {
      return next(new ApiError("Problem not part of this room", 400));
    }

    const testCases = await TestCase.find({ problemId });
    if (testCases.length === 0) {
      return next(new ApiError("No test cases found for this problem", 404));
    }

    const submissions = testCases.map((tc) => {
      const { sourceCode, usesStdin } = buildSubmissionCode(
        userCode,
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

    const tokens = await submitBatch(submissions);
    const finalResults = await pollBatchResults(tokens);

    let finalStatus = "Accepted";
    let failedTestCase = null;
    let maxTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < finalResults.length; i++) {
      const result = finalResults[i];
      const tc = testCases[i];
      maxTime = Math.max(maxTime, parseFloat(result.time || 0) * 1000);
      maxMemory = Math.max(maxMemory, result.memory || 0);

      if (result.status.id !== 3) {
        finalStatus = result.status.description;
        failedTestCase = {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput:
            result.stdout?.trim() ||
            result.stderr ||
            result.compile_output ||
            "",
        };
        break;
      }
    }

    const timeTakenMs = room.startedAt
      ? Date.now() - new Date(room.startedAt).getTime()
      : 0;

    const battleSub = await BattleSubmission.create({
      roomId: room._id,
      userId,
      problemId,
      code: userCode,
      languageId: parseInt(languageId, 10),
      status: finalStatus,
      executionTimeMs: maxTime,
      memoryUsedKb: maxMemory,
      timeTakenMs,
      failedTestCase: failedTestCase || undefined,
    });

    if (finalStatus === "Accepted") {
      await Room.updateOne(
        { _id: room._id, "participants.userId": userId },
        {
          $inc: { "participants.$.score": 1 },
          $push: {
            "participants.$.solvedProblems": {
              problemId,
              solvedAt: new Date(),
              timeTakenMs,
            },
          },
        }
      );

      const updatedRoom = await Room.findById(room._id).populate(
        "participants.userId",
        "name email"
      );

      const leaderboard = enrichLeaderboard(
        updatedRoom,
        buildLeaderboard(updatedRoom)
      );

      if (io) {
        io.to(room.roomCode).emit("leaderboard-update", { leaderboard });
        io.to(room.roomCode).emit("submission-result", {
          userId: String(userId),
          problemId: String(problemId),
          status: finalStatus,
          leaderboard,
        });
      }
    }

    res.status(200).json({
      success: true,
      status: finalStatus,
      data: {
        submission: battleSub,
        failedTestCase: finalStatus !== "Accepted" ? failedTestCase : null,
        executionTimeMs: maxTime,
        memoryUsedKb: maxMemory,
      },
    });
  } catch (err) {
    console.error("❌ [BattleSubmit] Error:", err.response?.data || err.message);
    next(err);
  }
};

export const getBattleSubmissions = async (req, res, next) => {
  try {
    const { code, problemId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) return next(new ApiError("Room not found", 404));

    const submissions = await BattleSubmission.find({
      roomId: room._id,
      userId,
      problemId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { submissions } });
  } catch (err) {
    next(err);
  }
};
