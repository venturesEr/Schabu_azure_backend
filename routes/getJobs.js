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

connection.on("connect", err => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connection Successful!")
  }
});


router.get('/', function(req, res, next){
    const code = req.query.code;
    
    const request = new Request(
      //SELECT (candidate_name) FROM [dbo].[Candidate] where candidate_name = 'Muhi Rasters';
        `SELECT job_id, job_role, job_type, job_name, job_description,company_name FROM [dbo].[Job] for JSON path;`,
        (err) => {
          if (err) {
            console.error(err.message);
          } 
        }
      )

      request.on("row", columns => {
          res.send(JSON.parse(columns[0].value))
      });
    
      connection.execSql(request);
    
})

router.get('/getJobs', function(req, res){
  console.log("hii")
})

module.exports = router;
//https://front-end-schabu.azurewebsites.net/invalidurllink