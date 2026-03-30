import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema(
    {
        input: {
            type: String,
            required: true,
            trim: true,
        },
        output: {
            type: String,
            required: true,
            trim: true,
        },
        explanation: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const supportedLanguageSchema = new mongoose.Schema(
    {
        languageId: {
            type: Number,
            required: true,
        },
        languageName: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
    {
        languageId: {
            type: Number,
            required: true,
        },
        language: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

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
    order:{
        type:Number,
        default:0,
    },
    description:{
        type:String,
        required:true,
    },
    difficulty:{
        type:String,
        enum:["Easy","Medium","Hard"],
        required:true,
    },
    topicTags:[{
        type:String,
        trim:true,
    }],
    companyTags:[{
        type:String,
        trim:true,
    }],
    constraints:[{
        type:String,
        trim:true,
    }],
    hints:{
        type:[String],
        default:[],
        validate:{
            validator:function(value){
                return value.length <= 3;
            },
            message:"A problem can have at most 3 hints",
        },
    },
    editorial:{
        type:String,
        default:"",
    },
    likes:{
        type:Number,
        default:0,
        min:0,
    },
    dislikes:{
        type:Number,
        default:0,
        min:0,
    },
    totalSubmissions:{
        type:Number,
        default:0,
        min:0,
    },
    totalAccepted:{
        type:Number,
        default:0,
        min:0,
    },
    acceptanceRate:{
        type:Number,
        default:0,
        min:0,
        max:100,
    },
    examples:{
        type:[exampleSchema],
        default:[],
        validate:{
            validator:function(value){
                return value.length <= 3;
            },
            message:"A problem can have at most 3 examples",
        },
    },
    supportedLanguages:{
        type:[supportedLanguageSchema],
        default:[
            { languageId: 63, languageName: "JavaScript (Node.js 12.14.0)" },
            { languageId: 62, languageName: "Java (OpenJDK 13.0.1)" },
            { languageId: 54, languageName: "C++ (GCC 9.2.0)" },
            { languageId: 71, languageName: "Python (3.8.1)" },
        ],
    },
    starterCode:{
        type:[starterCodeSchema],
        default:[],
    },
    testCases:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"TestCase",
    }]
},{timestamps:true});

problemSchema.pre("save", function (next) {
    if (this.totalSubmissions > 0) {
        this.acceptanceRate = Number(
            ((this.totalAccepted / this.totalSubmissions) * 100).toFixed(2)
        );
    } else {
        this.acceptanceRate = 0;
    }
    next();
});


export const Problem = mongoose.model("Problem",problemSchema);
