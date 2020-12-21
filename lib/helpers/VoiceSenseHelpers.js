const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const rp = require("request-promise");
const path = require("path");
const combineFiles = async (arr, filename) => {
  const result = new Promise(async (resolve, reject) => {
    const stream = fs.createWriteStream(
      `${__dirname}\\..\\..\\routes\\public\\uploads\\${filename}`
    );
    arr = arr.map((a) => a.url);
    arr
      .reduce((prev, curr) => prev.input(curr), ffmpeg())
      .mergeToFile(`${__dirname}\\..\\..\\routes\\public\\uploads\\${filename}`)
      // .output(stream)
      // .format("wav")
      .on("error", function (err, stdout, stderr) {
        console.log(stderr);
      })
      .on("end", async (err, stdout, stderr) => {
        try {
          resolve(`${__dirname}\\..\\..\\routes\\public\\uploads\\${filename}`);
          console.log(err);
        } catch (error) {
          reject(error);
          console.log(error);
        }
      });
  });
  return await result;
};
const uploadVoiceSense = async (filename) => {
  //For update is an object containing interview_id,question_id which acts as a PK for the demo.answer table
  const result = new Promise(async (resolve, reject) => {
    try {
      const fileReader = fs.createReadStream(filename);
      let bodyReader = {
        fileName: filename,
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
              filename,
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

      const voicesenseResult = await rp(options);
      resolve(voicesenseResult);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
  return await result;
};
const helperFunctions = {
  helper: async function (urls, filename) {
    const result = new Promise(async (resolve, reject) => {
      try {
        const combineFilePath = await combineFiles(urls, filename);
        const voiceResults = JSON.parse(
          await uploadVoiceSense(combineFilePath)
        );
        fs.unlink(combineFilePath, (err) =>
          console.log(err ? err : "Combined deleted")
        );
        resolve({ status: 200, data: { id: voiceResults.id } });
      } catch (error) {
        reject({ status: 500, error: "File error" });
        console.log(error);
      }
    });
    return await result;
  },
};
module.exports = helperFunctions;
