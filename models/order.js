const mongoose=require("mongoose");
const Schema=mongoose.Schema;

//it creates a connection pool

const orderSchema=new Schema({
orderid:{
type:String,
required:true
},
amount:{
  type:Number,
  required:true
},
currency:{
  type:String,
  required:true
},
status:{
    type:String,
    required:true
  },
  payment_id:{
    type:String,
  required:true
}

});
  
module.exports=mongoose.model('order',orderSchema);


