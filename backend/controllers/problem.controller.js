import mongoose from "mongoose";
import { Problem } from "../models/problem.model.js";
import { Submission } from "../models/submission.model.js";
import ApiError from "../utils/apiError.js";

const getUserStateFromSubmissions = (submissions) => {
    if (!submissions || submissions.length === 0) {
        return {
            attempted: false,
            submittedSuccessfully: false,
            lastSubmissionStatus: null,
        };
    }

    return {
        attempted: true,
        submittedSuccessfully: submissions.some((sub) => sub.status === "Accepted"),
        lastSubmissionStatus: submissions[0].status,
    };
};

// ─────────────────────────────────────────────
// GET /api/problems
// List all problems with optional filtering & sorting
// Query params: page, limit, userId, difficulty, tag, search, sortBy
// ─────────────────────────────────────────────
const getAllProblems = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page,10) || 1;
        const limit = parseInt(req.query.limit,10) || 20;
        const skip = (page-1) *limit;
        const { userId, difficulty, tag, search, sortBy } = req.query;

        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return next(new ApiError("Invalid userId", 400));
        }

        // Build filter
        const filter = {};
        if (difficulty) {
            filter.difficulty = difficulty; // "Easy", "Medium", "Hard"
        }
        if (tag) {
            filter.topicTags = { $in: [tag] };
        }
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        // Build sort
        let sortOption = { order: 1, createdAt: -1 }; // default
        if (sortBy === "difficulty") {
            // Easy < Medium < Hard
            sortOption = { difficulty: 1, order: 1 };
        } else if (sortBy === "acceptance") {
            sortOption = { acceptanceRate: -1 };
        } else if (sortBy === "title") {
            sortOption = { title: 1 };
        } else if (sortBy === "recent") {
            sortOption = { createdAt: -1 };
        }

        const total = await Problem.countDocuments(filter);

        const problems = await Problem.find(filter)
        .select('title slug order difficulty topicTags companyTags totalSubmissions totalAccepted acceptanceRate likes dislikes')
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

        let userSubmissionMap = new Map();
        if (userId && problems.length > 0) {
            const problemIds = problems.map((problem) => problem._id);
            const userSubmissions = await Submission.find({
                userId,
                problemId: { $in: problemIds },
            })
            .select('problemId status createdAt')
            .sort({ createdAt: -1 });

            for (const submission of userSubmissions) {
                const problemKey = submission.problemId.toString();
                if (!userSubmissionMap.has(problemKey)) {
                    userSubmissionMap.set(problemKey, []);
                }
                userSubmissionMap.get(problemKey).push(submission);
            }
        }

        const formattedProblems = problems.map((problem) => {
            const plainProblem = problem.toObject();
            if (userId) {
                const submissions = userSubmissionMap.get(problem._id.toString()) || [];
                plainProblem.userProblemState = getUserStateFromSubmissions(submissions);
            }
            return plainProblem;
        });

        res.status(200).json({
            status:"success",
            results:formattedProblems.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data:{problems: formattedProblems},
        });
    } catch (error) {
        next(error);
    }
}

// ─────────────────────────────────────────────
// GET /api/problems/:slug
// Full problem detail for code editor page
// Returns everything the frontend needs in one call
// ─────────────────────────────────────────────
const getProblemBySlug = async (req, res,next) => {
    try{
        const {slug} = req.params;
        const { userId } = req.query;

        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return next(new ApiError("Invalid userId", 400));
        }

        const problem = await Problem.findOne({slug})
        .populate({
            path: 'testCases',
            match:{isHidden:false},
            select: '-_id input expectedOutput explanation',
            options: { limit: 3 }
        })
        if (!problem){
            return next(new ApiError("Problem not found",404));
        }

        // If no explicit examples are set, derive from visible test cases
        if (!problem.examples || problem.examples.length === 0) {
            problem.examples = (problem.testCases || []).slice(0, 3).map((tc) => ({
                input: tc.input,
                output: tc.expectedOutput,
                explanation: tc.explanation || "",
            }));
        }

        // Limit visible test cases to 3
        if (problem.testCases && problem.testCases.length > 3) {
            problem.testCases = problem.testCases.slice(0, 3);
        }

        const problemData = problem.toObject();

        // Add user-specific state
        if (userId) {
            const userSubmissions = await Submission.find({
                userId,
                problemId: problem._id,
            })
            .select('status createdAt')
            .sort({ createdAt: -1 });

            problemData.userProblemState = getUserStateFromSubmissions(userSubmissions);
        }

        res.status(200).json({
            status:'success',
            data:{problem: problemData},
        })
    }
    catch(error) {
        next(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/admin/problems
// Create a new problem — accepts all fields
// ─────────────────────────────────────────────
const createProblem = async (req, res,next) => {
    try{
        if (!req.body.slug && req.body.title){
            req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        }
        const existingProblem = await Problem.findOne({slug:req.body.slug});
        if (existingProblem){
            return next(new ApiError("Problem with this slug already exists",400));
        }
        const {
            title,
            slug,
            order,
            description,
            difficulty,
            topicTags,
            companyTags,
            constraints,
            hints,
            editorial,
            examples,
            starterCode,
            supportedLanguages,
        } = req.body;
        const newProblem = await Problem.create({
            title,
            slug,
            order,
            description,
            difficulty,
            topicTags,
            companyTags,
            constraints,
            hints,
            editorial,
            examples,
            starterCode,
            supportedLanguages,
        });
        res.status(201).json({
            status:'success',
            data:{problem:newProblem},
        });
    }
    catch(error){
        next(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/problems/:slug
// Update an existing problem — accepts any field
// ─────────────────────────────────────────────
const updateProblem = async (req,res,next) =>{
    try {
        const {slug} = req.params;

        if (req.body.totalSubmissions !== undefined || req.body.totalAccepted !== undefined) {
            const existingProblem = await Problem.findOne({ slug });
            if (!existingProblem) {
                return next(new ApiError("Problem not found",404));
            }

            const totalSubmissions =
                req.body.totalSubmissions !== undefined
                    ? Number(req.body.totalSubmissions)
                    : existingProblem.totalSubmissions;
            const totalAccepted =
                req.body.totalAccepted !== undefined
                    ? Number(req.body.totalAccepted)
                    : existingProblem.totalAccepted;

            req.body.acceptanceRate =
                totalSubmissions > 0
                    ? Number(((totalAccepted / totalSubmissions) * 100).toFixed(2))
                    : 0;
        }

        const updatedProblem = await Problem.findOneAndUpdate(
            {slug},
            req.body,
            {new:true,runValidators:true}
        );
        if (!updatedProblem){
            return next(new ApiError("Problem not found",404));
        }
        res.status(200).json({
            status:'success',
            data:{problem:updatedProblem},
        })
    } catch (error) {
        next(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/problems/:slug
// ─────────────────────────────────────────────
const deleteProblem = async (req,res,next) => {
    try {
        const {slug} = req.params;
        const deletedProblem = await Problem.findOneAndDelete({slug});
        if (!deletedProblem){
            return next(new ApiError("Problem not found",404));
        }
        res.status(204).json({
            status:'success',
            data:null,
        });
    } catch (error) {
        next(error);
    }
}

// ─────────────────────────────────────────────
// GET /api/problems/tags
// Returns all unique topic tags for frontend filter dropdowns
// ─────────────────────────────────────────────
const getAllTags = async (req, res, next) => {
    try {
        const tags = await Problem.distinct("topicTags");
        res.status(200).json({
            status: "success",
            data: { tags },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────
// GET /api/problems/company-tags
// Returns all unique company tags for frontend filter dropdowns
// ─────────────────────────────────────────────
const getAllCompanyTags = async (req, res, next) => {
    try {
        const companyTags = await Problem.distinct("companyTags");
        res.status(200).json({
            status: "success",
            data: { companyTags },
        });
    } catch (error) {
        next(error);
    }
};

export {getAllProblems,getProblemBySlug,createProblem,updateProblem,deleteProblem,getAllTags,getAllCompanyTags};