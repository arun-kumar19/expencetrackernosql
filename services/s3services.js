const AWS=require('aws-sdk');
require('dotenv').config();

const uplaodtoS3=(data,filename)=>{

    const BUCKET_NAME=process.env.BUCKET_NAME
    const IAM_USER_ACCESS_KEY=process.env.IAM_USER_ACCESS_KEY
    const IM_USER_SECRET_KEY=process.env.IM_USER_SECRET_KEY
  
    let s3bucket=new AWS.S3({
      accessKeyId:IAM_USER_ACCESS_KEY,
      secretAccessKey:IM_USER_SECRET_KEY,
     // Bucket:BUCKET_NAME
    })
    
      const params={
        Bucket:BUCKET_NAME,
        Key:filename,
        Body:data,
        ACL:'public-read'
      }
  
      return new Promise((resolve,reject)=>{
        
      s3bucket.upload(params,(err,response)=>{
        if(err){
          console.log('something went wrong=',err);
          reject(err);
        }
        else{
          console.log('success=',response.Location);
        resolve(response.Location);
        }
        })
    
      })  
    
  }

  module.exports={
    uplaodtoS3
  }