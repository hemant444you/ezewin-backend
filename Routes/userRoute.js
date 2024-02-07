const express = require("express");
const router = express.Router();

const userController = require('../Controllers/UserController');
const AdminController = require('../Controllers/Admin/AdminController');

router.get("/", userController.index);
router.get("/dashboard", userController.index);
router.get("/profile", userController.profile);
router.post("/update-profile", userController.update_profile);
router.get("/upcoming-contest", userController.upcoming_contests);
router.get("/contest-details/:id", userController.contest_details);
router.get("/my-contest", userController.my_contests);
router.post("/join-contest", userController.join_contest);
router.post("/add-balance", userController.add_balance);
router.post("/save-answer", userController.save_answer);
router.post("/create-razorpay-order", userController.create_razorpay_order);
router.post("/verify-razorpay-signature", userController.verify_razorpay_signature);
router.get("/transaction", userController.transaction);


router.post('/logout',AdminController.logout);



module.exports = router;
