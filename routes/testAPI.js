var express = require('express');
const QR = require("qrcode")
var router = express.Router();
let {PythonShell} = require('python-shell')
var nodemailer = require('nodemailer');
var hash = require('object-hash');
const { Connection, Request } = require("tedious");

//clickSend
var api = require("../node_modules/clicksend/api.js");
var smsApi = new api.SMSApi("chris@schabu.com", "1636805E-ACBB-447D-E342-592C0644F877");
var smsMessage = new api.SmsMessage();

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
    console.log("Connection Successful12!")
  }
});
let send_email;
//https://front-end-schabu.azurewebsites.net/candidate
router.get('/', function(req, res, next) {
    if(req.query.email !== ""){
        let hash_email = hash(req.query.email)
        send_email = "https://back-end-schabu.azurewebsites.net/expire?code="+hash_email;
        let t1 = req.query.email;
        const request = new Request(
          //insert into demo_candidate (candidate_firstname, email_id, hash_code, createdAt) values ('123', '124', '567sdgreg', SYSDATETIME());
          `insert into demo_candidate (candidate_firstname, email_id, hash_code, createdAt, job_id) Values ('`+req.query.firstname+`', '`+req.query.email+`', '`+hash_email+`', SYSDATETIME(), '` + req.query.job_id+`');`,
          (err, rowCount) => {
            if (err) {
              console.error(err.message);
            } else {
              console.log(`${rowCount} row(s) returned`);
              if(rowCount > 0) res.send("Success");
              else{
                console.log("Not inserted")
              }
            }
          }
        )
      
        connection.execSql(request);
      
        //or we can add this QR code as a HashMap then set a time for 2 hrs to delete that hash map;
        console.log("Done")
    }

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'pranav292cyber@gmail.com',
          pass: 'Pranav76+'
        }
      });
     
      console.log(send_email)
      var mailOptions = {
        from: 'pranav292cyber@gmail.com',
        to: req.query.email,
        subject: 'Sending Email using Node.js',
        html: "<h1>Welcome to Schabu</h1><br/><p>Please click on the link below to continue with the interview process</p><br/><a href="+send_email+" target='__blank'>"+send_email+"</a>",
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      
     smsMessage.source = "sdk";
    smsMessage.to = req.query.phone;
    smsMessage.body = `Welcome to Schabu \n please click on the link below to continue with the interview process \n ${send_email}`;  

    var smsCollection = new api.SmsMessageCollection();
    smsCollection.messages = [smsMessage];

    smsApi.smsSendPost(smsCollection).then(function(response) {
        console.log(response.body);
      }).catch(function(err){
        console.error(err.body);
      });


    // pyhon code
    // const options = {
    //     mode: 'text',
    //     pythonOptions: ['-u'],
    //     scriptPath: 'C:/Users/Pranav Patel/Documents/schabu/back_end/python',
    //     pythonPath: 'C:/Users/Pranav Patel/AppData/Local/Programs/Python/Python37/python.exe',
    //     args: [req.query.firstname]
    //   };
    
    
    // var test = new PythonShell('test.py', options)
    
    // test.on('message', function(message){
    //     console.log("hi")
    //     res.send(message)
    // })

});

module.exports = router;