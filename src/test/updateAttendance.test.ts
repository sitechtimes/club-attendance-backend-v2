import request from "supertest";
import { app } from ".././app";

request(app)
  .patch("/updateAttendance")
  .field("year", "2024-2025")
  .field("clubName", "Art Club")
  .field("uuid", "113380945040354412648")
  .expect(200)
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

request(app)
  .patch("/updateAttendance")
  .field("year", "2024-2025")
  .field("clubName", "Art Club")
  .field("uuid", "12345678990") // this user should not exist
  .expect(404)
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });

request(app)
  .patch("/updateAttendance")
  .expect(400)
  .end(function (err, res) {
    if (err) {
      console.log(err);
    }
  });
