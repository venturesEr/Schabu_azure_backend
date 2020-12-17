const UserController = require("../Controllers/UserController");
var express = require("express");
var router = express.Router();

router.post("/interview", UserController.makeUserInterviewAssociation);

module.exports = router;
