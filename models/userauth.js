const mongoose=require("mongoose");
const { MongoClient, ObjectId } = require('mongodb');

const Schema = mongoose.Schema;

const userAuth = new Schema({

  name:{
    type:String,
    required:true
    },
    email:{
      type:String,
      required:true
    },
    password:{
      type:String,
      required:true
    },
  ispremiumuser:{
    type:Boolean,
    default:false
  },
  totalexpenses:{
    type:Number
  }
  
});

module.exports = mongoose.model('UserAuth', userAuth);


