import { Problem } from "../models/problem.model.js"
import { TestCase } from "../models/testCase.model.js";
import ApiError from "../utils/apiError.js";

const getAllProblems = async (req, res) => {
    try {
        const page = parseInt(req.query.page,10) || 1;
        const limit = parseInt(req.query.limit,10) || 20;
        const skip = (page-1) *limit;
        const problems = await Problem.find()
        .select('-testCases -starterCode')
        .skip(skip)
        .limit(limit);
        res.status(200).json({
            status:"success",
            results:problems.length,
            data:{problems},
        });
    } catch (error) {
        next(error);
    }
}

const getProblemBySlug = async (req, res,next) => {
    try{
        const {slug} = req.params;
        const problem = await Problem.findOne({slug})
        .populate({
            path: 'testCases',
            match:{isHidden:false},
            select: '-_id input expectedOutput explanation'
        })
        if (!problem){
            return next(new ApiError("Problem not found",404));
        }
        res.status(200).json({
            status:'success',
            data:{problem},
        })
    }
    catch(error) {
        next(error);
    }
}

const createProblem = async (req, res,next) => {
    try{
        if (!req.body.slug && req.body.title){
            req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        }
        const existingProblem = await Problem.findOne({slug:req.body.slug});
        if (existingProblem){
            return next(new ApiError("Problem with this slug already exists",400));
        }
        const {title,slug,description,difficulty,starterCode} = req.body;
        const newProblem = await Problem.create({
            title,
            slug,
            description,
            difficulty,
            starterCode,
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

const updateProblem = async (req,res,next) =>{
    try {
        const {slug} = req.params;
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

export {getAllProblems,getProblemBySlug,createProblem,updateProblem,deleteProblem};