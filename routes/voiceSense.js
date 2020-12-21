const UserController = require("../Controllers/UserController");
const VoiceSenseController = require("../Controllers/VoiceSenseController");
const RecordingsController = require("../Controllers/RecordingsController");
var express = require("express");
var router = express.Router();

router.get("/getInterviews", UserController.getAllInterviews);
router.get("/getInterviews/:id", UserController.getInterviewsById);
router.get("/getRecordings/:id", RecordingsController.getRecordings);

module.exports = router;
