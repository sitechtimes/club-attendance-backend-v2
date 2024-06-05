import request from "supertest";
import { app } from ".././app";

const year = "Test"

request(app)
	.patch("/updateAttendance")
	.send({ "year": `${year}`, "clubName": "Art Club", "uuid": "113380945040354412648" })
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.patch("/updateAttendance")
	.send({ "year": `${year}`, "clubName": "Art Club", "uuid": "12345678990" })
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
