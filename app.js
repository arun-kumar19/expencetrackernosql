const express=require('express');
const bodyParser = require('body-parser');
const fs=require("fs");
const sequelize=require('./util/database');
const User=require('./models/userauth');
const userexpence=require('./models/expence');
const order=require('./models/order');
const forgotpasswordrequests=require('./models/forgotpasswordrequests');
const app=express();
const mongoose=require('mongoose');
//const helmet=require("helmet");
const compression=require("compression");//compress the response bodies
const morgan=require("morgan");//produce logs
app.use(compression());
require('dotenv').config();//loads environment variables from a .env file into process.env.
//app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));//It is used to parse incoming request bodies in a URL-encoded format.
app.use(bodyParser.json());// used to parse incoming request bodies in JSON format.
//app.set('view engine', 'html');
app.set('views', 'views');//// Set the 'views' directory for the application
const path=require("path")
app.use('/public', express.static('public'));
const homeRoute = require('./routes/home');
const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})
app.use(morgan('combined',{stream:accessLogStream}))
//userexpence.belongsTo(user);
//user.hasMany(order);
//order.belongsTo(user);
//user.hasMany(forgotpasswordrequests);
//forgotpasswordrequests.belongsTo(user);
app.use((req, res, next) => {
    User.findById('6658a55da585102c3f84f4e0')
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
  });
app.use(homeRoute);

mongoose
  .connect(
    'mongodb+srv://arunklt21:LdFpyStWzYwKNLxA@cluster0.xcibj01.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'    
  )
  .then(result => {
   // console.log('connected:',result);
    User.findOne().then(user => {
      if (!user) {
        const user=new User({
          name:'arun',
          email:'arun@gmail.com',
          password:"12345",
          mobileno:'88004538938',
          ispremiumuser:false,
          totalexpenses:0
        });
        user.save();
      }
    });
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });