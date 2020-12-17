// still needs an Asyc call to store all the recoding in the background while persone is giving a new
// answers.!

var express = require("express");
var multer = require("multer");
var app = express();
let { PythonShell } = require("python-shell");
var path = require("path");
const fs = require("fs");
const VoiceSenseController = require("../Controllers/VoiceSenseController");
app.use(express.static("public")); // for serving the HTML file

var upload = multer({ dest: __dirname + "/public/uploads/" });
var type = upload.single("upl");
var router = express.Router();

const { Connection, Request } = require("tedious");
const { dirname } = require("path");

const config = {
  authentication: {
    options: {
      userName: "sqladmin", // update me
      password: "SuperSecret!", // update me
    },
    type: "default",
  },
  server: "schabusql.database.windows.net", // update me
  options: {
    database: "schabudb", //update me
    encrypt: true,
  },
};

const connection = new Connection(config);

connection.on("connect", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connection Successful for recording!");
  }
});

router.post("/", type, async function (req, res, next) {
  let h1 =
    __dirname + "/public/mp3/" + req.body.id + req.body.question + ".mp3";
  let pythonPass = req.body.id + req.body.question;
  let pythonpass = __dirname + "/public/wav/" + pythonPass + ".wav";
  let base_dir = __dirname + "/public";
  let question_id = Number(req.body.question) + 1;
  let interview_id = req.body.interview_id; // This is a temporary fix. They datatype of interview id must be changed
  fs.rename(
    __dirname + "/public/uploads/" + req.file.filename,
    h1,
    function (err) {
      if (err) console.log("ERROR: " + err);
    }
  );

  const scriptPath1 = __dirname + "/../python";

  const options = {
    mode: "text",
    pythonOptions: ["-u"],
    scriptPath: scriptPath1,
    pythonPath: "D:/home/python364x64/python.exe", //D:\home\python364x64\python.exe, C:/Users/Pranav Patel/AppData/Local/Programs/Python/Python37/python.exe
    args: [h1, base_dir],
  };

  // this will make an Async call to store the data into the database so the server is ready to receieve any other
  // in coming data

  // a better way to solve this is to use Worker//
  rowCount = make_async_call(
    options,
    connection,
    question_id,
    pythonPass,
    pythonpass,
    interview_id
  );

  if (rowCount > 0 && req.body.submit == "true")
    res.send("Your recrding is saved into the database");
});

async function make_async_call(
  options,
  connection,
  question_id,
  pythonPass,
  path,
  interview_id
) {
  const ret = await save_into_database(
    options,
    connection,
    question_id,
    pythonPass,
    path,
    interview_id
  );

  return ret;
}

async function save_into_database(
  options,
  connection,
  question_id,
  pythonPass,
  path,
  interview_id
) {
  var test = new PythonShell("speechtotextschabu.py", options);
  test.on("message", function (message) {
    const request = new Request(
      // `insert into [dbo].[demo_answer] (answer_id, question_id, interview_id, answer_text, answer_audio) Values ('`+question_id+`', '` +question_id+`', '`+1+`', '`+ message+`','` + pythonPass + `');`
      `insert into [dbo].[demo_answer] (answer_id, question_id, interview_id, answer_text, answer_audio) Values ('` +
        question_id +
        `', '` +
        question_id +
        `', '` +
        interview_id +
        `', '` +
        message +
        `','` +
        pythonPass +
        `');`,
      (err, rowCount) => {
        if (err) {
          console.error(err.message);
        } else {
          return rowCount;
        }
      }
    );
    connection.execSql(request);
    test.end(async () => {
      try {
        let voicesenseResult = await VoiceSenseController.uploadVoiceSense(
          path
        );

        voicesenseResult = JSON.parse(voicesenseResult);
        voicesenseResult = voicesenseResult.id;
        const update = await VoiceSenseController.saveReference(
          interview_id,
          question_id,
          voicesenseResult
        );
      } catch (error) {
        //Do nothing when file is too short to get a voice sense score
      }
    });
  });
}

module.exports = router;