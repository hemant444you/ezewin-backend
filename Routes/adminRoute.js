
const express = require("express");
const router = express.Router();

const User = require("../Models/userModel.js");

const { verifyToken } = require("../utlis/generateToken.js");

const AdminController = require('../Controllers/Admin/AdminController');
const QuestionController = require('../Controllers/Admin/QuestionController');
const ContestController = require('../Controllers/Admin/ContestController');
const SettingController = require('../Controllers/Admin/SettingController');
const NotificationController = require('../Controllers/Admin/NotificationController');

router.get('/dashboard',AdminController.dashboard);
router.get('/profile',AdminController.profile);
router.post('/update-profile',AdminController.update_profile);
router.get('/user',AdminController.user);
router.get('/user-details/:id',AdminController.user_details);
router.post('/store-user',AdminController.store);
router.post('/update-user',AdminController.update);
router.post('/delete-user',AdminController.delete)
router.get('/transaction',AdminController.transaction);
router.get('/payment',AdminController.payment);
router.get('/newslater',AdminController.newslater);
router.post('/delete-newslater',AdminController.delete_newslater);

router.get('/notifications',NotificationController.index);
router.post('/store-notification',NotificationController.store);
router.post('/delete-notification',NotificationController.delete);

router.get('/question',QuestionController.index);
router.get('/question-details/:id',QuestionController.show);
router.post('/store-question',QuestionController.store);
router.post('/update-question',QuestionController.update);
router.post('/delete-question',QuestionController.delete);

router.get('/contest',ContestController.index);
router.get('/contest-details/:id',ContestController.show);
router.post('/store-contest',ContestController.store);
router.post('/update-contest',ContestController.update);
router.post('/delete-contest',ContestController.delete);
router.post('/contest-update-status',ContestController.update_status);

router.post('/store-winning',ContestController.store_winning);
router.post('/delete-winning',ContestController.delete_winning);

router.get('/setting',SettingController.index);
router.post('/store-setting',SettingController.store);
router.get('/about-us',SettingController.about_us);
router.post('/update-about-us',SettingController.update_about_us);
router.get('/privacy-policy',SettingController.privacy_policy);
router.post('/update-privacy-policy',SettingController.update_privacy_policy);
router.get('/terms-conditions',SettingController.terms_conditions);
router.post('/update-terms-conditions',SettingController.update_terms_conditions);

router.post('/logout',AdminController.logout);

module.exports = router;
