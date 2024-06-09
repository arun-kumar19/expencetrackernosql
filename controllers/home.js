require('dotenv').config();
const ObjectId=require("mongodb");
const mongoose=require("mongoose");
const path = require('path');
const Order=require('../models/order');
const User=require('../models/userauth');
const Userexpence=require('../models/expence');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const Razorpay=require('razorpay')
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
const userDownloads=require('../models/userdownloads');
console.log('razorpayKey_id=',process.env.razorpayKey_id);
const razorpay=new Razorpay({
  key_id:process.env.razorpayKey_id,
  key_secret:process.env.razorpayKey_secret,
});

var allData;
var uniqueDates;

const getUniqueDates = async (id) => {
  try {
    const uniqueDates = await Userexpence.aggregate([
      {
        $match: {
         userid: id
        }
      },
      {
        $group: {
          _id: "$date" // Group by the 'date' field to get distinct dates
        }
      },
      {
        $sort: {
          _id: 1 // Sort the dates in ascending order
        }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the result
          date: "$_id" // Rename the _id field to 'date'
        }
      }
    ]);
    console.log('Unique dates:', uniqueDates);
    return uniqueDates;
  } catch (err) {
    console.log('Error fetching unique dates:', err);
    throw err;
  }
};



exports.getProfile=async(req,res)=>{
  const filePath = path.join(__dirname, '../views', 'profile.html');
//console.log('path=',filePath);
  res.sendFile(filePath);
  
}

exports.getAddExpence=async (req,res)=>{
  const{date,expencetype,money,description,category,name}=req.body;
  const token=req.header('Authorization');
  const id=jwt.verify(token,secretKey);
  console.log('User id:',id);

  const session = await mongoose.startSession();
  session.startTransaction();

  try{
  const fetchuser=await User.findById(id);
  console.log('fetchuser:',fetchuser);
  if(!fetchuser)
    {
 return   res.status(500).json({MESSAGE:'failed',data:'na'})
    }
  const date1=moment(date).format('YYYY-MM-DD');
  console.log('date1=',date1);
  console.log('id2:',id);
 const userexpence=new Userexpence(
  {
    date:date1,
    type:expencetype,
    amount:money,
    description:description,
    category:category,
    userid:id.toString(),
    name:name
  });
  await userexpence.save({ session });
      
  let current_expenses=Number(fetchuser.totalexpenses)+Number(money);
      console.log('current_expences=',current_expenses);
      fetchuser.totalexpenses=current_expenses;
      await fetchuser.save({ session });

      await session.commitTransaction();
    session.endSession();
    const allExpenses=await Userexpence.find({userid:id})
    console.log('all:',allExpenses);
     return res.status(200).json({MESSAGE:'success',data:allExpenses});
  
  }catch (err) {
  console.log('Error:', err);
  if (session) {
    session.endSession();
    return   res.status(500).json({MESSAGE:'failed',data:'na'})
  }
}
}

exports.getSingleUserExpences=async (req,res)=>{
  console.log('getSingleUserExpences');
  const token=req.header('Authorization');
  console.log('token getSingleUserExpences=',token);
  const perPageData=req.header('perPageData');
  console.log('perPageData=',perPageData);
  
  const id=jwt.verify(token,secretKey);

  const fetchUserExpenses=await Userexpence.find({
    userid:id
  },
['date','type','amount','description','category'],
{
  skip:0,
  sort:{
    date:1
  }
});
  console.log('fetchUserExpenses:',fetchUserExpenses);
  if(!fetchUserExpenses){
  return  res.status(406).json({'MESSAGE':'NOT ACCEPTABLE'});
  }
//creates new array
 const expencseJSON=fetchUserExpenses.map((expence)=>expence.toJSON());
 allData=expencseJSON;
 
 // Usage example

uniqueDates=await getUniqueDates(id).then(dates => {
   //console.log(dates);
   return dates;
 }).catch(err => {
   console.error(err);
 });
 console.log('uniqueDates11:',uniqueDates);
 const uniqueDateArr=[]
 uniqueDates.forEach(element=>{
  const date=new Date(element.date);
  uniqueDateArr.push(date.toISOString().split('T')[0]);
 })
 console.log('uniqueDateArr:',uniqueDateArr);
uniqueDates=uniqueDateArr;
/*const uniquedateStringify=JSON.stringify(uniqueDates);
console.log('uniquedateStringify:',uniquedateStringify);
const slicedString=uniquedateStringify.slice(0,uniquedateStringify.length);
console.log('slicedString:',slicedString);
const updatedStr=slicedString.substring(1,slicedString.length-1);
console.log('updatedStr:',updatedStr);
//console.log('updatedStr=',updatedStr);
const arr=updatedStr.split(",")
console.log('arr:',arr);
const datearr=[];

for(let i=0;i<arr.length;i++){

  //console.log(arr[i]);
  datearr.push(arr[i].substring(8,arr[i].length-2));

}
// console.log('result=',datearr);
 const uniqueDate2=datearr; 
 console.log('uniqueDate2=',uniqueDate2);*/
 const currentPage=1;
 const perPage = perPageData; // Number of items per page
 console.log('perPage:',perPage);
 const startIndex = (currentPage - 1) * perPage;
 const endIndex = startIndex + perPage;

 const initalDataToShow = allData.slice(startIndex, endIndex);
 const allPages=Math.ceil(allData.length / perPage)>0?Math.ceil(allData.length / perPage):1;
console.log('allPages:',allPages);
      res.status(201).json(
        {'userdata':initalDataToShow,
        'uniqueDate':uniqueDateArr,
        currentPage,
        previousPage:currentPage-1,
        perPage,
        totalItems:allData.length,
        totalPages: allPages,
        nextPage:Number(currentPage)+1,
      });
}

exports.getUserStatus=async (req,res)=>{
  const token=req.header('Authorization');
  //console.log('add expence token=',token);
  const id=jwt.verify(token,secretKey); 
  try{
  const userstatus=await User.findById(id);
  console.log('userstatus=',userstatus);

  //console.log('checkuser=',userstatus,' userlength=',userstatus.length);
  if(!userstatus){
  return res.status(404).json({'status':0})//user does notexists
  }
    res.status(201).json(userstatus);//user exists
  }catch(err){
    console.log('soemthing went wrong =',err);
  }
}

exports.Authenticate=async (req,res,next)=>{
  const token=req.header('Authorization');
  console.log('token=',token);
  const userid=jwt.verify(token,secretKey);
console.log('userid=',userid);
const userstaus=await User.findById(userid);
//console.log('userstatus=',userstaus);
console.log('Authenticate fun userstatus=',userstaus.ispremiumuser);
try{
if(!userstaus.ispremiumuser){
  res.status(401).send({status:'401'});
}
if(userstaus.ispremiumuser){
  next();
}
}
catch(error){
  console.log('something went wrong=',error);
}
  
}


exports.getUrlList=async(req,res)=>{
  
  const token=req.header('Authorization');
  console.log('token=',token);
  const userid=jwt.verify(token,secretKey);
  console.log('userid=',userid);
  const data=await userDownloads.find({userid:userid},
  ['date','userdownloads'],
  {
    skip:0,
    sort:{
      date:1
    }
  });
console.log('fetched url list:',data);
  const jsonString=JSON.stringify(data);
  const json_array=JSON.parse(jsonString)
  console.log('json_array=',json_array.length);
  console.log('json_array=',json_array);

  const slicedString=jsonString.substring(json_array,jsonString.length-1)
  console.log('slicedString=',slicedString);
  const arr=slicedString.split(",");
  console.log('arr=',arr[0]);
  res.status(200).json({urldata:json_array,success:true});
}



exports.getUserExpence=async (req,res)=>{
  console.log('getUserExpence');
  const userid=req.params.id;

  const fetchuser=await Userexpence.find({where:{
    userdatumId:userid
  }});
  //console.log('result=',fetchuser);
  if(!fetchuser){
  return  res.status(406).json({'MESSAGE':'NOT ACCEPTABLE'});//server cannot produce a response matching the list of acceptable values defined in the request's headers. 
  }
      res.status(201).json(fetchuser);
}

exports.getItems=(req,res)=>{
  console.log('getItem function logged');
  const perPageData=req.header('perPageData');
  console.log('perPageData-',perPageData);
  const currentPage=Number(req.query.page);
  console.log('current page num=',currentPage);
 const perPage = Number(perPageData); // Number of items per page
 const startIndex = (currentPage - 1) * perPage;
 const endIndex = startIndex + perPage;
console.log('startIndex=',startIndex,' and endIndex=',endIndex);
 const data = allData.slice(startIndex, endIndex);
console.log('data=',JSON.stringify(data));
console.log('uniqueDates:',uniqueDates);
      res.status(201).json(
        {'userdata':data,
        'uniqueDate':uniqueDates,
        currentPage,
        previousPage:currentPage-1,
        perPage,
        totalItems:allData.length,
        totalPages: Math.ceil(allData.length / perPage),
        nextPage:Number(currentPage)+1,
      });
}

exports.downloadExcel=async(request, response, next)=>{
  const token=request.params.token;
  console.log('token=',token);
const userid=jwt.verify(token,secretKey);
console.log('userid:',userid);
const userstatus=await User.find({_id:new mongoose.Types.ObjectId(userid)});
console.log('userstatus:',userstatus);
console.log('userstatus=',userstatus[0].ispremiumuser);
if(userstatus[0].ispremiumuser){
//console.log('userid=',userid);
Userexpence.find({
  userid:userid
}).then(data=>{
    console.log('data=',data);
      var mysql_data = JSON.parse(JSON.stringify(data));
     
      //convert JSON to CSV Data

      var file_header = ['A', 'B', 'C', 'D','E','F','G','H'];

      var json_data = new data_exporter({file_header});
      if(data.length>0){
      var csv_data = json_data.parse(mysql_data);
    }
    else{
      var csv_data = json_data.parse({'A':'na','B':'na','C':'na','D':'na','E':'na','F':'na','G':'na','H':'na'});
    }
      console.log('csv_data=',csv_data);
      response.setHeader("Content-Type", "text/csv");

      response.setHeader("Content-Disposition", "attachment; filename=sample_data.csv");

      response.status(200).end(csv_data);

  }).catch(error=>{
    console.log('there is some error=',error);
  })
}
else{
  response.status(401).send("Unauthorized");
}
}

exports.getPremiumPayment=async (req,res)=>{
  console.log('getPremiumPayment called');
try{
  const token=req.header('Authorization');
  console.log('token=',token);
  const id=jwt.verify(token,secretKey);
  console.log('user id=',id);

  const fetchuser=await User.findById(id);
console.log('getPremiumPayment fetch User:',fetchuser);
  const orderAmount = 1500; // Amount in paisa (1000 paisa = ₹10)
const currency = 'INR';

const orderOptions = {
  amount: orderAmount,
  currency: currency,
};

  try{
  razorpay.orders.create(orderOptions, async(err, order) => {
    if (err) {
      console.error('Error creating order:', err);
      throw new Error(JSON.stringify(err));
    }
    console.log('Order:', order);
    try{
  const newOrder=new Order({orderid:order.id,amount:order.amount,currency:order.currency,status:'pending',payment_id:'na'});
      const savedOrder=await newOrder.save();
  if(savedOrder){
      console.log('something went wrong=',savedOrder);
      console.log('order status:',savedOrder);
     return res.status(201).json({order,key_id:razorpay.key_id});
    }
  }     
  catch(err){
      console.log('something went wrong11=',err);
    };
    
  });
  }catch(error){
  console.log('error4-',error);
  res.status(403).json({message:'something went wrong',error:error});
}
} catch(error){
  console.log('error4-',error);
  res.status(403).json({message:'something went wrong',error:error});
}

}

exports.getUpdateTransactionStatus=async(req,res)=>{
  console.log('received request from server');
  const token=req.header('Authorization');
  console.log('token=',token);
  console.log('request=',req);
  const {order_id,payment_id,order_status}=req.body;
  const id=jwt.verify(token,secretKey); 
  console.log('transaction order status=',order_status);
  try{
  let userorder=await Order.findOne({
    orderid:order_id
  })
  console.log('userorder123=',userorder);
  if (!userorder) {
    console.log('Order not found');
    return res.status(404).json({ MESSAGE: 'Order not found' });
  }
  
  if(order_status===0){
    console.log('transaction failed');
    userorder.status='failed';  
    await userorder.save();
    return res.json({'MESSAGE':'failed'});
  }
  console.log('transaction success');
  const getuser=await User.findById(id);
  console.log('getuser:',getuser);
  if (!getuser) {
    console.log('User not found');
    return res.status(404).json({ MESSAGE: 'User not found' });
  }
  getuser.ispremiumuser=true;
  const userUpdatedStatus=await getuser.save();
  
  console.log('userUpdatedStatus:',userUpdatedStatus);
  console.log('fetched order=',userorder);
  userorder.status='COMPLETED'
  userorder.payment_id=payment_id
  const updatedUserOrder=await userorder.save();
  console.log('updatedUserOrder:',updatedUserOrder);
  res.status(201).json({'MESSAGE':'OK'});
}catch(error){
  console.log('error during updating record=',error);
}
}


exports.getLeaderBoard=async (req,res)=>{
  
  try{
    const groupbyuser = await Userexpence.aggregate([
      {
        $group: {
          _id: {
            name: "$name",
            userid: "$userid",
            type: "$type"
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: {
            name: "$_id.name",
            userid: "$_id.userid"
          },
          income: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", 1] }, "$totalAmount", 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", 2] }, "$totalAmount", 0]
            }
          }
        }
      },
      {
        $project: {
          name: "$_id.name",
          userid: "$_id.userid",
          netTotal: { $subtract: ["$income", "$expense"] },
          income: 1,
          expense: 1
        }
      }
    ]);

  console.log('checkuser=',groupbyuser,' userlength=',groupbyuser.length);
  if(!groupbyuser){
  return res.status(404).json({'status':0})//user exists
  }

    res.status(201).json(groupbyuser);//user created
  }catch(err){
    console.log('soemthing went wrong =',err);
  }
}

exports.getMonthlyReport=async(req,res)=>{
console.log('getMonthlyReport');
  const token=req.header('Authorization');
  const userid=jwt.verify(token,secretKey);
console.log('userid=',userid);
let result;
try{
    result = await Userexpence.aggregate([
      {
        $match: { userid: userid }
      },
      {
        $addFields: {
        year: { $year: "$date" },
        monthNum: { $month: "$date" },
        monthName: { $month: "$date" }
      
    },
  },
    {
      $group: {
        _id: {
          year: "$year",
          monthNum: "$monthNum",
          monthName: "$monthName"
        },
        income: {
          $sum: {
            $cond: [
              { $eq: ["$type", 1] },
              "$amount",
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [
              { $eq: ["$type", 2] },
              "$amount",
              0
            ]
          }
        }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.monthNum": 1
      }
    }

    ])
  }catch (error) {
    console.error('Error fetching user expenses:', error);
  }
console.log('Aggregation result:', result);
res.status(200).send({"STATUS":"OK","DATA":result});
}

exports.getYearlyReport=async(req,res)=>{
console.log('getYearlyReport');
  const token=req.header('Authorization');
  const userid=jwt.verify(token,secretKey);
console.log('userid=',userid);
let result;
try{
  result=await Userexpence.aggregate([
    {
      $match:{ userid: userid }
    },
    {
      $addFields: {
        year: { $year: "$date" }
      }
    },
    {
      $group: {
        _id: "$year",
        income: {
          $sum: {
            $cond: [
              { $eq: ["$type", 1] },
              "$amount",
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [
              { $eq: ["$type", 2] },
              "$amount",
              0
            ]
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ])
  console.log('result:',result);
}catch(error){
  console.log(error);
}
console.log('Aggregation result yearly:', result);
res.status(200).send({"STATUS":"OK","DATA":result});

}

exports.getDownload=async(req,res)=>{

  const token=req.header('Authorization');
  console.log('token=',token);
  const userid=jwt.verify(token,secretKey);
console.log('userid=',userid);
  
 const data=await Userexpence.find({
  userid:userid
 })
 console.log('data download');
 const stringifyExpences=JSON.stringify(data);
 //console.log('stringifydata=',stringifyExpences);

var ISTTime = new Date();

console.log('date=',ISTTime);
const day=ISTTime.getDate();
console.log('day=',day);
const monthShort = ISTTime.toLocaleString('default', { month: 'short' });
const year=ISTTime.getFullYear();
const hours=ISTTime.getHours();
const minute=ISTTime.getMinutes();
const second=ISTTime.getSeconds();
const formatName=day+monthShort+year+"_"+hours+"_"+minute+"_"+second;
const filename="expences"+formatName+".txt";
try{
const fileUrl=await S3Services.uplaodtoS3(stringifyExpences,filename);
 console.log('fileURL=',fileUrl);
 await Userdownload.create({userid,downloadurl:fileUrl}).then(()=>{
   // console.log('response=',response);
    res.status(200).json({fileUrl, "success":"true"});
 }).catch(err=>{
  console.log('something went wrong=',err);
 })
 
}
catch(error){
  console.log('error=',error);
  res.status(500).json({success:'false',err:error});
}
}


exports.getForgetPasswordUser=async (req,res)=>{

  const filePath = path.join(__dirname, '../views', 'forgetpassword.html');
  res.sendFile(filePath);
  
}

exports.getForgetPassword=async (req,res)=>{
  let status;
  const emailid=req.params.emailid;
  console.log('email=',emailid);
  const uuid=uuidv4(); //'9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  console.log("uuid=",uuid);
  const userdata=await User.find({
    email:emailid
  });
console.log('userdata',userdata);
  if(userdata.length<1){
    console.log('no such email found in db');
    res.status(500).json({status:0});

  }
  else{
  const userid=userdata[0].id;
  console.log('userid=',userid,' and email id =',userdata[0].email);

  
  status=await ForgotPasswordRequests.create({uuid:uuid,isactive:true,userid:userid});

  if(!status){
    console.log('something went wrong in forgotpasswordrequests=',status);
  }
  else{
let tranEmailApi=new Sib.TransactionalEmailsApi();

const sender={
        email:'network@letstrack.in',
        
}

const receivers=[
  {
    email:emailid
  },
]

tranEmailApi.sendTransacEmail({
  sender,
  to:receivers,
  subject:"Forget Password",
  "htmlContent": `
  <!DOCTYPE html><html><body><h1>Generate New Password</h1>
  <p><a href="http://127.0.0.1:3000/password/resetpassword/{{params.id}}">Change Password</a></p></body></html>`,
  params: {
    id:uuid,  
  },

}).then(function(data) {
  console.log('API called successfully. Returned data: ' + data);
  res.status(200).json({status:1});
}).catch(function(error) {
  console.error('GETTING ERROR=',error);
  res.status(500).json({status:0});
});
}
  }
}

exports.getChangePassword=async (req,res)=>{

  const forgotpasswordrequestid=req.params.forgotpasswordrequestid;

  const getStatus=await ForgotPasswordRequests.find({
    uuid:forgotpasswordrequestid
  })

  console.log('getStatus=',getStatus[0].isactive);
  if(getStatus[0].isactive){

  const filePath = path.join(__dirname, '../views', 'changepassword.html');
  res.sendFile(filePath);
}
else
{
  res.status(404).send("link expired");
}
}

exports.getChangePasswordUser=async (req,res)=>{
  const saltRounds = 10;
  const newpassword=req.body.updatedpassword;
  const forgotpasswordrequestid=req.params.userid;

  console.log('newpassword:',newpassword,' forgotpasswordrequestid:',forgotpasswordrequestid);

  const getRequest=await ForgotPasswordRequests.find({
    uuid:forgotpasswordrequestid}
    );
    console.log('getRequest=',getRequest);
  const userid=getRequest[0].userid;
  const getUser=await User.findById({_id: new mongoose.Types.ObjectId(userid)});
  const emailid=getUser.email;
  const getForgetPasswordRequest=await ForgotPasswordRequests.find({
    uuid:forgotpasswordrequestid
  })
  //console.log('userid of user:',userid, ' emailid=',emailid, ' and getForgetPasswordRequest=',getForgetPasswordRequest[0].isactive);
  //console.log('getUser Data:',getUser);
  bcrypt.hash(newpassword,saltRounds,async(err,hash)=>{
    if(err){
    console.error('Error hashing password',err);
    }
  else{
    //console.log('hash password=',hash);
    getUser.password=hash;
      await getUser.save();
      getForgetPasswordRequest[0].isactive=false;
      await getForgetPasswordRequest[0].save();
      //console.log("getForgetPasswordRequest=",getForgetPasswordRequest);
    
    console.log('password updated succesfully')
  
    //email for update password
      
    var apiInstance = new Sib.TransactionalEmailsApi();
  
    const receivers=[
      {
         "email":emailid
      }
    ];
    const sender={ 
        "email":"arunklt21@gmail.com", 
        "name":"Arun Kumar"
      };
    
    
    apiInstance.sendTransacEmail({
      sender,
      to:receivers,
      subject:"Password Changed Successfully",
      "htmlContent": `
      <!DOCTYPE html><html><body><h1>Login Now from given link</h1>
      <p><a href="http://127.0.0.1:3000/">Login Now</a></p></body></html>`
  
    }).then(function(data) {
      console.log('API called successfully. Returned data: ' + data);
    }).catch(function(error) {
      console.error('GETTING ERROR=',error);
      res.status(500).send('Error sending email.');
    });

    res.status(200).json({ispasswordchanged:1});
  }
})
}


/*exports.getMonthlyReport=async(request, response, next)=>{
  const token=request.params.token;
  console.log('token=',token);
const userid=jwt.verify(token,secretKey);
const userstatus=await user.findByPk(userid);
//console.log('userstatus=',userstatus.ispremiumuser);
if(userstatus.ispremiumuser){
//console.log('userid=',userid);
userexpence.findAll({ where :{
  userdatumId:userid
}}).then(data=>{
    //console.log('data=',data);
      var mysql_data = JSON.parse(JSON.stringify(data));
     
      //convert JSON to CSV Data

      var file_header = ['A', 'B', 'C', 'D','E','F','G','H','I'];

      var json_data = new data_exporter({file_header});
      if(data.length>0){
      var csv_data = json_data.parse(mysql_data);
    }
    else{
      var csv_data = json_data.parse({'A':'na','B':'na','C':'na','D':'na','E':'na','F':'na','G':'na','H':'na','I':'na',});
    }
      //console.log('csv_data=',csv_data);
      response.setHeader("Content-Type", "text/csv");

      response.setHeader("Content-Disposition", "attachment; filename=sample_data.csv");

      response.status(200).end(csv_data);

  }).catch(error=>{
    console.log('there is some error=',error);
  })
}
else{
  response.status(401).send("Unauthorized");
}
}

//console.log('type=',result);
const stringifyResult=JSON.stringify(result);
const monthlySummary=JSON.parse(stringifyResult);
console.log('type of monthlySummary=',typeof monthlySummary, '    monthlySummary=',monthlySummary.length);
console.log('data=',monthlySummary[0].YEAR);
res.status(200).send({"STATUS":"OK","DATA":monthlySummary});

}catch(error){
  console.log('something went wrong=',error);
}
}

*/
