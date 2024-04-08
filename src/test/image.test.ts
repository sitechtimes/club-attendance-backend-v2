import request from "supertest";
import { app } from ".././app";
import path = require("path");

// i hate this

// auth

// admin

// image
request(app)
  .post("/uploadImage")
  .attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .field("uuid", "113380945040354412648")
  .expect({ message: "File uploaded successfully!" })
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });
request(app)
  .post("/uploadImage")
  .attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
  .field("year", "2024-2025")
  .field("clubName", "Anime Club")
  .field("uuid", "113380945040354412648")
  .expect({ message: "File uploaded successfully!" })
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });
