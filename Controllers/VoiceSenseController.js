const fs = require("fs");
const rp = require("request-promise");
const { Connection, Request } = require("tedious");
const axios = require("axios");
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
  getResults: async (id) => {
    const result = new Promise((resolve, reject) => {
      const url = `https://test.voicesense.com/api/externalservices2/predictor/${id}/personality-attribute`;

      var options = {
        method: "GET",
        uri: url,
        headers: {
          Authorization: "Basic c2NoYWJ1QHZvaWNlc2Vuc2UuY29tOkpXVGpzNDRyIQ==",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };
      rp(options)
        .then((res) => {
          let data = JSON.parse(res);
          let scores = data.channels[0].scores;
          let sum = 0;
          let count = 0;
          for (let prop in scores) {
            sum += scores[prop] / data.definition[prop].max;
            count++;
          }
          let avg = sum / count;
          resolve(Math.floor(avg * 100));
        })
        .catch((err) => {
          resolve(0);
        });
    });
    return await result;
  },
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
    const score = await helper.getResults(voice_sense_id);
    const request = new Request(
      `UPDATE [dbo].demo_candidate_interview SET voicesense_id='${voice_sense_id}',voicesense_score='${score}' WHERE interview_id='${interview_id}';`,
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
  makeRequest_serverless: async (urls, filename) => {
    const result = new Promise(async (resolve, reject) => {
      try {
        const voice_id = await axios.post(
          "https://uploadwavfile.azurewebsites.net/api/HttpTrigger1?code=j5DSk5BDF20yPy3ytaO0FxuvRZr6kJaIq0HsbpJ/mcRBqqvVn60vaA==",
          { body: { urls: urls, filename: filename } }
        );
        resolve(voice_id.id);
      } catch (error) {
        reject(error);
        console.log(error);
      }
    });
    return await result;
  },
};
module.exports = Controller;
