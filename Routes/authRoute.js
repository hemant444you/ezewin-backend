const express = require("express");
const router = express.Router();

const frontendController = require('../Controllers/FrontendController');

router.get("/login", frontendController.login);
router.post("/post-login", frontendController.post_login);
router.get("/forget-password", frontendController.forget_password);
router.post("/forget-password", frontendController.post_forget_password);
router.get("/reset-password", frontendController.reset_password);
router.post("/reset-password", frontendController.post_reset_password);
module.exports = router;