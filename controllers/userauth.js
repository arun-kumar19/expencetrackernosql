require('dotenv').config();
const path = require('path');
const order=require('../models/order');
const User=require('../models/userauth');
const userexpence=require('../models/expence');
const Sequelize=require('sequelize');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const Razorpay=require('razorpay');
const sequelize = require('../util/database');
const secretKey = process.env.secretKey;
var Sib = require('sib-api-v3-sdk');
var defaultClient = Sib.ApiClient.instance;
// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.emailAPIKey;
const { v4: uuidv4 } = require('uuid');//Universally Unique Identifier key generator.
const ForgotPasswordRequests = require('../models/forgotpasswordrequests');
const moment=require("moment");//used for parsing, manipulating, and formatting dates and times
var data_exporter = require('json2csv').Parser;
const S3Services=require('../services/s3services');
const userdownload=require('../models/userdownloads');
console.log('razorpayKey_id=',process.env.razorpayKey_id);
const razorpay=new Razorpay({
  key_id:process.env.razorpayKey_id,
  key_secret:process.env.razorpayKey_secret,
});

exports.getSignUp=(req,res)=>{
    const filePath = path.join(__dirname, '../views', 'signup.html');
    res.sendFile(filePath);
  }
  
  exports.getSignInPage=(req,res)=>{
    const filePath = path.join(__dirname, '../views', 'login.html');  
    res.sendFile(filePath);
    
  }
  

  
exports.postSignUp=async (req,res)=>{
    const saltRounds = 10;
    const {name,email,password}=req.body;
    console.log('values=',name,'|',email,'|',password);
  
    const checkUser=await User.find({
      email:email
    }).exec();
  
   console.log('checkuser=',checkUser,' userlength=',checkUser.length);
    if(checkUser.length>0){
  
    return res.json({'status':0})//user exists
    }
  else{
    bcrypt.hash(password,saltRounds,(err,hash)=>{
      if(err)
      console.error('Error hashing password',err);
    else{
      //console.log('hash password=',hash);
    const newUser=new User({name:name,email:email,password:hash,ispremiumuser:false,totalexpenses:0})
      console.log('user created succesfully:',newUser);
      newUser.save();   
    return  res.status(201).json({'status':1});//user created
  }
  })
  }
  }
  
  exports.getSuccess=(req,res,next)=>{
  
    res.render('login',{
      status:1,
      path:'/login'
    });
  
  }
  
  function generateAccessToken(id){
    const token=jwt.sign(id,secretKey);
    console.log('token=',token);
    return token;
  }
  
  exports.getSignIn=async(req,res,next)=>{
    let username;
    const {email,password}=req.body;
    console.log('email1:',email,' and password1:',password);
    const checkuser=await User.find({email:email})
    console.log('checkuser=',checkuser);
    
    if(!checkuser){
      //console.log('error');
      return res.status(404).json({'status':2});//user not exist
    }
        console.log('checkuser=',checkuser[0].password);
        bcrypt.compare(password,checkuser[0].password,(err,result)=>{
          if(err){
            console.log('error=',err);
            res.status(401).json({'status':0});
          }
          else{
          if(result){
           console.log('hello=',result);
             username=checkuser[0].name;
             console.log('checkuser:',checkuser);
            res.status(201).json({'status':1,'userdata':checkuser[0],'token':generateAccessToken(checkuser[0]._id.toString())})
          }
          else{
            res.status(401).json({'status':0})
          }
        }
          })
    }