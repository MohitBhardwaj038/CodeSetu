import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        problemId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Problem",
            required:true,
        },  
        language:{
            type:String,
            required:true,
        },
        code:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            enum:["Pending","Accepted","Wrong Answer","Runtime Error","Time Limit Exceeded"],
            default:"Pending",
        },
        executionTimeMs:{
            type:Number,
        },
        memoryUsedKb:{
            type:Number,
        },
        failedTestCase:{
            input:String,
            expectedOutput:String,
            actualOutput:String,
        }

    },
    {
        timestamps:true,
    }
);

export const Submission = mongoose.model("Submission",submissionSchema);
