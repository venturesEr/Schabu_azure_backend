const { BlobServiceClient } = require("@azure/storage-blob");
const storage = require("@azure/storage-blob");
const fs = require("fs");
const { Request } = require("tedious");
const connection = require("../config/dbconnect");
const connStr =
  "DefaultEndpointsProtocol=https;AccountName=schabublob;AccountKey=Gs6wLBsd5YLOvBvgrDMM2GqNaUnNsIOI+NqZ1wq7kmvwhNelI2m2xDbFCgcffuxD5ELtyudgG0LvQ8LbtFP4zw==;EndpointSuffix=core.windows.net";
const cred =
  "Gs6wLBsd5YLOvBvgrDMM2GqNaUnNsIOI+NqZ1wq7kmvwhNelI2m2xDbFCgcffuxD5ELtyudgG0LvQ8LbtFP4zw==";
const access_key = new storage.StorageSharedKeyCredential("schabublob", cred);
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);

const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
const containerName = "candidate-audio-wave-file";

const AzureController = {
  uploadFile: async (filepath, interview_id) => {
    const result = new Promise(async (resolve, reject) => {
      const containerClient = blobServiceClient.getContainerClient(
        containerName
      );

      const content = fs.createReadStream(filepath);
      const blobName = interview_id + "-" + new Date().getTime() + ".wav";
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      try {
        const up = await blockBlobClient.uploadStream(
          content,
          uploadOptions.bufferSize,
          uploadOptions.maxBuffers,
          { blobHTTPHeaders: { blobContentType: "audio/wav" } }
        );
        resolve({ msg: up, name: blobName, containerName });
      } catch (err) {
        reject({ error: err });
      }
    });
    return await result;
  },

  getSasTokens: (rows) => {
    // Create a SAS token that expires in an hour
    // Set start time to five minutes ago to avoid clock skew.
    let blobs = rows.map((r) => r.answer_audio);
    var startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 5);
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 60);
    const client = blobServiceClient.getContainerClient(containerName);
    let tokens = [];
    rows = rows.map((row) => {
      const blobClient = client.getBlobClient(row.answer_audio);
      const blobSAS = storage
        .generateBlobSASQueryParameters(
          {
            containerName,
            blobName: row.answer_audio,
            permissions: storage.BlobSASPermissions.parse("r"),
            startsOn: startDate,
            expiresOn: expiryDate,
          },
          access_key
        )
        .toString();
      const sasUrl = blobClient.url + "?" + blobSAS;
      row.url = sasUrl;
      return row;
    });
    return rows;
  },
};
module.exports = AzureController;
