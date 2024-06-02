import request from "supertest";
import { app } from ".././app";

const year = "Test"

request(app)
	.patch("/updateAttendance")
	.field("year", `${year}`)
	.field("clubName", "Art Club")
	.field("uuid", "113380945040354412648")
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.patch("/updateAttendance")
	.field("year", `${year}`)
	.field("clubName", "Art Club")
	.field("uuid", "12345678990") // this user should not exist
	.expect(404)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.patch("/updateAttendance")
	.expect(400)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});
