const fs = require("fs");
const rp = require("request-promise");
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

const helper = {
  //Saves the data provided by voicesense to the database
};

const Controller = {
  //Uploads audiofile to voicesense and attempts to get results
  uploadVoiceSense: async (path) => {
    //For update is an object containing interview_id,question_id which acts as a PK for the demo.answer table
    const result = new Promise(async (resolve, reject) => {
      const fileReader = fs.createReadStream(path);
      let bodyReader = {
        fileName: "filename.wav",
        createdDateTime: "2020-12-01T14:12:50",
        channels: [
          {
            channelType: "Mono",
            agentId: null,
            customerId: null,
            referenceId: "customer",
          },
        ],
      };

      var options = {
        method: "POST",
        uri: "https://test.voicesense.com/api/externalservices2/upload",
        formData: {
          body: JSON.stringify(bodyReader),
          file: {
            value: fileReader,
            options: {
              filename: "Chiran0.wav",
              contentType: "audio/wav",
            },
          },
        },
        headers: {
          Authorization: "Basic c2NoYWJ1QHZvaWNlc2Vuc2UuY29tOkpXVGpzNDRyIQ==",
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      };
      try {
        const voicesenseResult = await rp(options);
        resolve(voicesenseResult);
      } catch (error) {
        reject(error);
      }
    });
    return await result;
  },
  saveReference: async (interview_id, question_id, voice_sense_id) => {
    const request = new Request(
      `UPDATE [dbo].demo_answer SET voicesense_id='${voice_sense_id}' where question_id='${question_id}' AND interview_id='${interview_id}';`,
      (err, response) => {
        if (err) {
          console.log(err);
        } else {
          console.log(response);
        }
      }
    );
    connection.execSql(request);
  },
};
module.exports = Controller;
