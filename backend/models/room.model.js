import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    solvedProblems: [
      {
        problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
        solvedAt: { type: Date },
        timeTakenMs: { type: Number },
      },
    ],
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "finished"],
      default: "waiting",
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 180,
      default: 30,
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    participants: [participantSchema],
    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    questionConfig: {
      easy: { type: Number, default: 1, min: 0, max: 5 },
      medium: { type: Number, default: 1, min: 0, max: 5 },
      hard: { type: Number, default: 1, min: 0, max: 5 },
    },
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
