// still needs an Asyc call to store all the recoding in the background while persone is giving a new
// answers.!

var express = require("express");
var multer = require("multer");
var app = express();
let { PythonShell } = require("python-shell");
const fs = require("fs");
const VoiceSenseController = require("../Controllers/VoiceSenseController");
const AzureController = require("../Controllers/AzureFunctions");
const RecordingsController = require("../Controllers/RecordingsController");
const RecordingsHelper = require("../lib/helpers/RecordingHelpers");
const VoiceHelper = require("../lib/helpers/VoiceSenseHelpers");
const pythonexecutable = require("../config/pythonexecutable");
app.use(express.static("public")); // for serving the HTML file

var upload = multer({ dest: __dirname + "/public/uploads/" });
var type = upload.single("upl");
var router = express.Router();

const { Connection, Request } = require("tedious");

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
let transcript = "";
router.post("/", type, async function (req, res, next) {
  let h1 =
    __dirname + "/public/mp3/" + req.body.id + req.body.question + ".mp3";
  let pythonPass = req.body.id + req.body.question;
  let pythonpass = __dirname + "/public/wav/" + pythonPass + ".wav";
  let base_dir = __dirname + "/public";
  let question_id = Number(req.body.question) + 1;
  let interview_id = req.body.interview_id;
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
    pythonPath: pythonexecutable.production, //D:\home\python364x64\python.exe, C:/Users/Pranav Patel/AppData/Local/Programs/Python/Python37/python.exe
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
    interview_id,
    h1
  );

  if (req.body.submit == "true")
    try {
      const blobNames = await RecordingsHelper.getUrlsForInterview(
        interview_id
      );
      const sasUrls = await AzureController.getSasTokens(blobNames);

      const voicesenseResult = await VoiceHelper.helper(
        sasUrls,
        `${Number(Date.now())}.wav`
      );
      if (voicesenseResult.data.id) {
        const update = await VoiceSenseController.saveReference(
          interview_id,
          question_id,
          voicesenseResult.data.id
        );
      }
    } catch (error) {
      console.log(error);
    }
  res.send("Your recording is saved into the database");
});

async function make_async_call(
  options,
  connection,
  question_id,
  pythonPass,
  path,
  interview_id,
  mp3Path
) {
  const ret = await save_into_database(
    options,
    connection,
    question_id,
    pythonPass,
    path,
    interview_id,
    mp3Path
  );

  return ret;
}

async function save_into_database(
  options,
  connection,
  question_id,
  pythonPass,
  path,
  interview_id,
  mp3Path
) {
  const result = new Promise((resolve, reject) => {
    var test = new PythonShell("speechtotextschabu.py", options);

    test.on("message", (message) => {
      transcript = message;
    });
    test.end(async () => {
      try {
        let azureResponse = await AzureController.uploadFile(
          path,
          interview_id
        );
        let blobReference = azureResponse.name;
        const saveRecording = await RecordingsController.saveRecordingInformation(
          question_id,
          interview_id,
          transcript,
          blobReference
        );
        // console.log(path);
        fs.unlink(path, (err) => console.log(err ? err : "Successful wav"));
        fs.unlink(mp3Path, (err) => console.log(err ? err : "Successful mp3"));
        resolve({ status: 200 });
      } catch (error) {
        reject({ status: 500 });
      }
    });
  });
}

module.exports = router;
