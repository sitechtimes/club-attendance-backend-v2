import request from "supertest";
import { app } from ".././app";
import path = require("path");

let fileId = "";
// upload image
request(app)
  .post("/uploadImage")
  .attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .field("uuid", "113380945040354412648")
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
  .field("uuid", "116015436799734947995")
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .expect(200, "Image has been approved and has been moved to the new folder")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

request(app)
  .patch("/approveImage")
  .attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
  .field("uuid", "116015436799734947995")
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .expect(200, "Image has been approved and has been moved to the new folder")
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });
