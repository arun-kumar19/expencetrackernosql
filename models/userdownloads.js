const Mongoose=require("mongoose");
const Schema=Mongoose.Schema;


const userDownloads=new Schema({
userid:{
    type:String,
    required:true
  },
downloadurl:{
  type:String,
  required:true
},
});
  
module.exports=Mongoose.model('userDownloads',userDownloads);


