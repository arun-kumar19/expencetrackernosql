const express = require('express');
const router = express.Router();
const homeController=require('../controllers/home');
const userAuthController=require('../controllers/userauth');

router.get('/', userAuthController.getSignInPage);
router.post('/', userAuthController.getSignIn);
router.get('/signup', userAuthController.getSignUp);
router.post('/signup', userAuthController.postSignUp);
router.get('/profile', homeController.getProfile);
router.post('/addexpence', homeController.getAddExpence);
router.get('/profile/userexpences', homeController.getSingleUserExpences);
router.get('/profile/userstatus', homeController.getUserStatus);
router.get('/profile/urllist', homeController.Authenticate,homeController.getUrlList);
router.get('/profile/userexpences/:id', homeController.getUserExpence);
router.get('/profile/userexpences', homeController.getSingleUserExpences);
router.get('/profile/items',homeController.getItems);
router.get('/export/:token', homeController.downloadExcel);
router.get('/profile/buypremium', homeController.getPremiumPayment);
router.post('/profile/updatetransactionstatus', homeController.getUpdateTransactionStatus);
router.get('/profile/leaderboard', homeController.getLeaderBoard);
router.get('/profile/monthlysummaryshow', homeController.getMonthlyReport);
router.get('/profile/yearlysummary', homeController.getYearlyReport);
router.get('/profile/download', homeController.Authenticate,homeController.getDownload);
router.get('/forgetpassword', homeController.getForgetPasswordUser);
router.get('/password/forgetpassword/:emailid', homeController.getForgetPassword);
router.get('/password/resetpassword/:forgotpasswordrequestid', homeController.getChangePassword);
router.put('/changepassword/:userid', homeController.getChangePasswordUser);

//router.get('/login', homeController.getSuccess);

module.exports=router;