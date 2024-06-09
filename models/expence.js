const mongoose=require("mongoose");
const { MongoClient, ObjectId } = require('mongodb');

const Schema = mongoose.Schema;

const expenceSchema=new Schema({
date:{
  type:Date,
  required:true
},
type:{
  type:Number,
  required:true
},
amount:{
type:Number,
required:true
},
description:{
  type:String,
  required:true
},
category:{
  type:String,
  required:true
},
userid:{
  type:String,
  required:true
},
name:{
  type:String,
  required:true
}

});
module.exports = mongoose.model('Expence', expenceSchema);


