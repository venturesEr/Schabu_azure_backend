const UserController = require("../Controllers/UserController");
const VoiceSenseController = require("../Controllers/VoiceSenseController");
var express = require("express");
var router = express.Router();

router.get("/getInterviews", UserController.getAllInterviews);
router.get("/getRecordings", UserController.getRecordings);

module.exports = router;