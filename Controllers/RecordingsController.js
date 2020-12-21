const { Connection, Request } = require("tedious");
const fs = require("fs");
const FormData = require("form-data");
const AzureController = require("./AzureFunctions");
const RecordingHelper = require("../lib/helpers/RecordingHelpers");
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
    console.log("Connection Successful for voicesense!");
  }
});
const helper = {
  getHashFromName: async (name) => {
    // This is temporary because the hash is required for sow1. Proper authenticationa and table design will fix the problem it is currently hacking
    //This imposes the constraint that for one name there is only one hash
    const result = new Promise(async (resolve, reject) => {
      const request = new Request(
        `select hash_code from [dbo].[demo_candidate] WHERE candidate_firstname LIKE ('${name}');`,
        (err, row, rows) => {
          if (err) {
            reject(err);
          }
        }
      );
      let _rows = [];

      request.on("row", (columns) => {
        var _item = {};
        // Converting the response row to a JSON formatted object: [property]: value
        for (var name in columns) {
          _item.hash = columns[name].value;
        }
        _rows.push(_item);
      });
      request.on("doneInProc", (rowCount, more, rows) => {
        resolve(_rows[0]);
      });
      connection.execSql(request);
    });
    return await result;
  },
};
const Controller = {
  getRecordings: async (req, res, next) => {
    let interview_id = req.params.id;
    try {
      const rows = await RecordingHelper.getUrlsForInterview(interview_id);
      const uris = AzureController.getSasTokens(rows);
      res.send(uris);
    } catch (error) {
      res.send({ status: 500 });
      console.log(error);
    }
  },
  saveRecordingInformation: async (
    question_id,
    interview_id,
    message,
    blobReference
  ) => {
    const result = new Promise(async (resolve, reject) => {
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
          blobReference +
          `');`,
        (err, rowCount) => {
          if (err) {
            reject(err.message);
          } else {
            resolve(rowCount);
          }
        }
      );
      connection.execSql(request);
    });
    return await result;
  },
};

module.exports = Controller;
