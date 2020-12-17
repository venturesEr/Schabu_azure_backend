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
        `select candidate_firstname, DATEDIFF(hour, createdAt, SYSDATETIME()) AS DateDiff from [dbo].[demo_candidate] where hash_code = '`+code+`' for JSON path;`,
        (err, rowCount) => {
          if (err) {
            console.error(err.message);
          }else{
               if(rowCount == 0) res.redirect("http://demo-schabu.azurewebsites.net/invalidlink");
          }
        }
      )

      request.on("row", columns => {
        let h1 = JSON.parse(columns[0].value)
         if(h1[0].DateDiff < 48){ //this will tell the validation is for 2 hours
             res.redirect("http://demo-schabu.azurewebsites.net/welcome?name="+h1[0].candidate_firstname)
         }else{
             res.redirect("http://demo-schabu.azurewebsites.net/invalidlink")
         }
      });
    
      connection.execSql(request);
    
})

router.get('/getJobs', function(req, res){
  console.log("hii")
})

module.exports = router;
//https://front-end-schabu.azurewebsites.net/invalidurllink