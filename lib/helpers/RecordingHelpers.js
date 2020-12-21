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
    console.log("Connection Successful for voicesense!");
  }
});
const helpers = {
  getUrlsForInterview: async (interview_id) => {
    const result = new Promise((resolve, reject) => {
      const request = new Request(
        `select answer_audio,answer_text,question_id from [dbo].[demo_answer] WHERE interview_id='${interview_id}';`,
        (err, row, rows) => {
          if (err) {
            reject({ status: 500 });
            console.log(err);
          }
        }
      );
      let _rows = [];

      request.on("row", (columns) => {
        // Converting the response row to a JSON formatted object: [property]: value
        let item = {};
        columns.forEach((col) => {
          item[col.metadata.colName] = col.value;
        });
        _rows.push(item);
      });

      request.on("doneInProc", (rowCount, more, rows) => {
        resolve(_rows);
      });
      connection.execSql(request);
    });
    return await result;
  },
};
module.exports = helpers;
