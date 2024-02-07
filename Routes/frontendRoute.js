const express = require("express");
const router = express.Router();

const frontendController = require('../Controllers/FrontendController');
const ApiController = require('../Controllers/ApiController');

router.get("/", frontendController.index);
router.get('/load-result/:id',frontendController.load_result);
router.get('/download-result/:id',frontendController.download_result);

module.exports = router;