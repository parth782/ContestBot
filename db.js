const mongoose=require("mongoose");
require("dotenv").config();
const connectDB=()=>{
    mongoose.connect(process.env.MONGO_URI,{
       useNewUrlParser:true,
         useUnifiedTopology:true,
    }).then(()=>{
        console.log("MongoDB Connected Successfully");
    }).catch((err)=>{
        console.log(err);
    })
}
module.exports=connectDB;