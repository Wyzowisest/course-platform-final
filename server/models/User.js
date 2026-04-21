import mongoose from "mongoose";
export default mongoose.model("User", new mongoose.Schema({
 name:String,
 email:{type:String,unique:true},
 studentId:{type:String,unique:true,sparse:true},
 password:String,
 role:{type:String,enum:["student","lecturer","admin"],default:"student"}
},{timestamps:true}));
