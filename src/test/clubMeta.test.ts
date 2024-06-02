import request from "supertest";
import { app } from ".././app";

const id = "116015436799734947995"
const year = "Test"

//get all club meta
request(app)
	.get(`/getAllClubMeta/${id}/${year}`)
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.get(`/getAllClubMeta/${id}`) // has no year
	.expect(400, "Missing required parameters!")
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// get club meeting
request(app)
	.post("/addClubMeeting")
	.field("year", "2024-2025")
	.field("clubName", "Anime Club")
	.field("nextMeeting", "Test Date Place Holder")
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.post("/addClubMeeting")
	.expect(400, "Missing required parameters!")
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// delete club meeting
request(app)
	.post("/deleteClubMeeting")
	.field("year", "2024-2025")
	.field("clubName", "Anime Club")
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.post("/deleteClubMeeting")
	.expect(400, "Missing required parameters!")
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});
