const { Timestamp } = require('bson');
const mongoose=require('mongoose');
const {Schema}=mongoose;
const ContestSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    start_time:{
        type:Date,
        required:true
    },
    end_time:{
        type:Date,
        required:true
    },
    
    link:{
        type:String,
        required:true
    },
    source:{
        type:String,
        required:true
    },
    id:{
        type:String,
        required:true
    },


},{timestamps:true});
module.exports=mongoose.model('Contest',ContestSchema);;