import request from "supertest";
import { app, service } from ".././app";
import path = require("path");
import fs from "fs";
import { upload } from "../multer";

let fileId = "";
let unapproveImageId = "";
const adminId = "116015436799734947995";

// upload image
request(app)
  .post(`/uploadImage`)
  .attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .field("uuid", "113380945040354412648") // this president is a member of Anime and Art club so use only those club to test
  .expect(200)
  .expect({ message: "File uploaded successfully!", fileId: !null })
  .end(function (err, res) {
    if (res) {
      console.log(res.body);
      fileId = res.body.fileId;
    }
    if (err) {
      console.log(err);
    }
  });

request(app)
  .post("/uploadImage")
  .expect(400)
  .expect("Missing required parameters")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });
//
// approve image

request(app)
  .patch("/approveImage")
  .field("fileId", fileId)
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .field("uuid", `${adminId}`)
  .expect(200, "Image has been approved and has been moved to the new folder")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

request(app)
  .patch("/approveImage")
  .field("fileId", "NoImageFoundTest")
  .field("uuid", `${adminId}`)
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .expect(404, "No images found!")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

request(app)
  .patch("/approveImage")
  .expect(400, "Missing required parameters!")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

// get unapproved images
request(app)
  .get("/getUnapprovedImages/:uuid")
  .expect(200 || 204)
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

// create an image so that unapproved images can be deleted and test could be completed
async function uploadTestImage() {
  try {
    const requestBody = {
      name: "photo.jpg",
      fields: "id",
    };
    const media = {
      mimeType: "image/jpeg",
      body: fs.createReadStream("files/photo.jpg"),
    };

    const file = await service.files.create({
      requestBody,
      media: media,
    });

    console.log("File Id:", file.data.id);
    unapproveImageId = file.data.id;
  } catch (error) {
    console.log(error);
  }
}

uploadTestImage();

request(app)
  .delete("/unapproveImage")
  .field("uuid", `${adminId}`)
  .field("imageId", unapproveImageId) // need to pass in an actual file id
  .expect(200, "Image has been unapproved and has been deleted from the folder")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

request(app)
  .delete("/unapproveImage")
  .expect(400, "Missing required parameters!")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });
