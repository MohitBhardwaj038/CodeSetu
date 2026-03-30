import { TestCase } from "../models/testCase.model.js";
import { Problem } from "../models/problem.model.js";
import ApiError from "../utils/apiError.js";

const createTestCase = async (req,res,next) => {
    try{
        const {problemId} = req.params;
        const {input,expectedOutput,isHidden,explanation} = req.body;
        const problem = await Problem.findById(problemId);
        if (!problem){
            return next(new ApiError("Problem not found",404));
        }
        const newTestCase = await TestCase.create(
            {
                problemId,
                input,
                expectedOutput,
                isHidden,
                explanation,
            }
        )
        problem.testCases.push(newTestCase._id);
        await problem.save();
        res.status(201).json({
            status:"success",
            data:{testCase:newTestCase},
        })
    }
    catch(error){
        next(error);
    }
}

const createMultipleTestCases = async (req,res,next) => {
    try {
        const {problemId} = req.params;
        const testCasesData = req.body;

        if (!Array.isArray(testCasesData) || testCasesData.length === 0) {
            return next(new ApiError("Invalid input: Expected an array of test cases",400));
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return next(new ApiError("Problem not found",404));
        }

        const testCasesToInsert = testCasesData.map(tc => ({
            ...tc,
            problemId,
        }))
        const insertedTestCases = await TestCase.insertMany(testCasesToInsert);
        const newTestCaseIds = insertedTestCases.map(tc => tc._id);
        problem.testCases.push(...newTestCaseIds);
        await problem.save();

        res.status(201).json({
            status:"success",
            results:insertedTestCases.length,
            data:{testCases:insertedTestCases},
        })

    } catch (error) {
        next(error);   
    }
}
const getTestCasesByProblem = async (req,res,next) => {
    try{
        const {problemId} = req.params;
        const testCases = await TestCase.find({problemId});
        res.status(200).json({
            status:"success",
            results:testCases.length,
            data:{testCases},
        })
    }
    catch(error){
        next(error);
    }
}

const updateTestCase = async (req,res,next) => {
    try{
        const {id} = req.params;
        const updatedTestCase = await TestCase.findByIdAndUpdate(id,req.body,{new:true,runValidators:true});
        if (!updatedTestCase){
            return next(new ApiError("Test case not found",404));
        }

        res.status(200).json({
            status:"success",
            data:{testCase:updatedTestCase},
        })
    }
    catch(error){
        next(error);
    }
}

const deleteTestCase = async (req,res,next) => {
    try{
        const {id} = req.params;
        const deletedTestCase = await TestCase.findByIdAndDelete(id);
        if (!deletedTestCase){
            return next(new ApiError("Test case not found",404));
        }

        await Problem.findByIdAndUpdate(deletedTestCase.problemId,{$pull:{testCases:id}});

        res.status(204).json({
            status:"success",
            data:null,
        });
    }
    catch (error) {
        next(error);
    }
}

export {createTestCase,getTestCasesByProblem,updateTestCase,deleteTestCase,createMultipleTestCases};