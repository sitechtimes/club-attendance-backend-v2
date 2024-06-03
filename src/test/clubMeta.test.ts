import request from "supertest";
import { app } from ".././app";

const uuid = "113380945040354412648"
const adminUuid = "116015436799734947995"
const year = "Test"

//get all club meta
request(app)
	.get(`/getAllClubMeta/${adminUuid}/${year}`)
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.get(`/getAllClubMeta/${adminUuid}/0000-0000`) // has no year
	.expect(404)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// get club meeting
request(app)
	.post("/addClubMeeting")
	.send({
		"uuid": `${uuid}`, "year": `${year}`, "clubName": "Anime Club", "nextMeeting": "Test Date Place Holder"
	})
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.post("/addClubMeeting")
	.send({ "uuid": `${uuid}`, "clubName": "Anime Club" })
	.expect(400)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// delete club meeting
request(app)
	.post("/deleteClubMeeting")
	.send({ "uuid": `${uuid}`, "year": `${year}`, "clubName": "Anime Club" })
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.post("/deleteClubMeeting")
	.send({ "uuid": `${uuid}`, "clubName": "Anime Club" })
	.expect(400)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});
