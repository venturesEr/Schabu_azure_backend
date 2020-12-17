var express = require('express');
var router = express.Router();


const { Connection, Request } = require("tedious");

const config = {
    authentication: {
      options: {
        userName: "sqladmin", // update me
        password: "SuperSecret!" // update me
      },
      type: "default"
    },
    server: "schabusql.database.windows.net", // update me
    options: {
      database: "schabudb", //update me
      encrypt: true
    }
  };


const connection = new Connection(config);

var result; 

connection.on("connect", err => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connection Successful!")
  }
});


router.get('/', function(req, res, next){
  let filter_parm = req.query.name;
    const request = new Request(
      `SELECT (question_text) FROM [dbo].[Questionnaire] Inner Join [dbo].[Job_Questionnaire] on [dbo].[Questionnaire].question_id = [dbo].[Job_Questionnaire].question_id inner join [dbo].[demo_candidate] on [dbo].[demo_candidate].job_id = [dbo].[Job_Questionnaire].job_id where [dbo].[Job_Questionnaire].job_id = [dbo].[demo_candidate].job_id and [dbo].[demo_candidate].candidate_firstname = '`+filter_parm+`' for JSON path;;`,
        //`SELECT (question_text) FROM [dbo].[Questionnaire] Inner Join [dbo].[Job_Questionnaire] on [dbo].[Questionnaire].question_id  = [dbo].[Job_Questionnaire].question_id where [dbo].[Job_Questionnaire].job_id = '1' `,
        (err, row, rows) => {
          if (err) {
            console.error(err.message);
          }
        }
    )

    request.on("row", columns => {
        let h1 = columns[0].value;
        h1 = JSON.parse(h1)
        for(let i = 0; i < h1.length; ++i){
            h1[i] = {...h1[i], recURL: "", recCounter: 3, recBlob: ""}
        }
        res.send(h1)
    })
    
    connection.execSql(request);

    
})


module.exports = router;
//https://front-end-schabu.azurewebsites.net/invalidurllink