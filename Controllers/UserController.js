const { Connection, Request } = require("tedious");
const uuid = require("uuid");
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
  makeUserInterviewAssociation: async (req, res) => {
    const name = req.body.name;
    let candidate = await helper.getHashFromName(name);
    candidate = candidate.hash;
    const interview_id = req.body.interview_id;
    console.log(interview_id);
    const request = new Request(
      `insert into [dbo].[demo_candidate_interview] (candidate_hash,interview_id) Values ('${candidate}', '${interview_id}')`,
      (err, rowCount) => {
        if (err) {
          res.send(err);
          console.log(err);
        } else {
          res.send(`${rowCount} row(s) returned`);
        }
      }
    );
    connection.execSql(request);
  },
  getAllInterviews: async (req, res, next) => {
    const request = new Request(
      `SELECT * FROM demo_candidate_interview T1 JOIN demo_candidate T2 ON T1.candidate_hash=T2.hash_code  JOIN demo_answer T3 ON T1.interview_id=T3.interview_id;`,
      (err) => {
        if (err) {
          res.send(err);
        }
      }
    );
    let _rows = [];

    request.on("row", (columns) => {
      var _item = {};
      // Converting the response row to a JSON formatted object: [property]: value
      for (var name in columns) {
        _item[columns[name].metadata.colName] = columns[name].value;
      }
      _rows.push(_item);
    });
    request.on("doneInProc", (rowCount, more, rows) => {
      res.send(_rows);
    });
    connection.execSql(request);
  },
  getRecordings: (req, res, next) => {
    let filenames = req.body.files;
    res.send("recordings here");
  },
};
module.exports = Controller;
