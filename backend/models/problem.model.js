import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
    },
    slug:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
        required:true,
    },
    difficulty:{
        type:String,
        emun:["Easy","Medium","Hard"],
        required:true,
    },
    starterCode:[{
        language:{type:String, required:true},
        code:{type:String, required:true},
    }],
    testCases:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"TestCase",
    }]
},{timestamps:true});


export const Problem = mongoose.model("Problem",problemSchema);


