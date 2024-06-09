const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const ForgotPasswordRequests=new Schema({

uuid:{
type:String,
required:true
},
isactive:{
  type:Boolean,
  required:true
},
userid:{
  type:String,
  required:true
}

});
  
module.exports=mongoose.model('ForgotPasswordRequests',ForgotPasswordRequests);
