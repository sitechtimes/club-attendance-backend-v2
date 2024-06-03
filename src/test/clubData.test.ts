import request from "supertest";
import { app } from ".././app";

const clubName = "Anime Club";
const year = "Test";
const uuid = "116015436799734947995";

// getClubData
request(app)
	.get(`/getClubData/${clubName}/${year}`)
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.get(`/getClubData/NonExistingClub/${year}`)
	.expect(404)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// getAllClubData
request(app)
	.get(`/getAllClubData/${year}/${uuid}`)
	.expect(200)
	.end(function(err) {
		console.log(err);
	})

// passing in an invalid year 	
request(app)
	.get(`/getAllClubData/0000-0000/${uuid}`)
	.expect(404)
	.end(function(err) {
		console.log(err);
	})

request(app)
	.post("/addClub")
	.send({
		"uuid": `${uuid}`,
		"year": `${year}`,
		"clubName": "AddNewClub",
		"clubAdvisor": "clubAdvisor",
		"advisorEmail": "clubAdvisorEmail",
		"clubPresident": "clubPresident",
		"presidentEmail": "clubPresidentEmail",
		"room": "room",
	})
	.expect(200)
	.end(function(err) {
		console.log(err);
	});

request(app)
	.post("/addClub")
	.send({
		"uuid": `${uuid}`,
		"year": "0000-0000", // year doesn't exists 
		"clubName": "AddNewClub",
		"clubAdvisor": "clubAdvisor",
		"advisorEmail": "clubAdvisorEmail",
		"clubPresident": "clubPresident",
		"presidentEmail": "clubPresidentEmail",
		"room": "room",
	})
	.expect(404)
	.end(function(err) {
		console.log(err);
	})

request(app)
	.delete("/deleteClub")
	.send({ "uuid": `${uuid}`, "year": `${year}`, "clubName": "AddNewClub" })
	.expect(200)
	.end(function(err) {
		console.log(err);
	})

request(app)
	.delete("/deleteClub")
	.send({ "uuid": `${uuid}` })
	.expect(400)
	.end(function(err) {
		console.log(err);
	});

request(app)
	.get(`/getClubMembers/${clubName}/${year}/${uuid}`)
	.expect(200)
	.end(function(err) {
		console.log(err);
	});

request(app)
	.get(`/getClubMembers/NonExistingClub/${year}/${uuid}`)
	.expect(404)
	.end(function(err) {
		console.log(err);
	});

// this can use both admin and club president ids
request(app)
	.delete("/removeStudentFromClub")
	.send({ "uuid": `${uuid}`, "year": `${year}`, "clubName": `${clubName}`, "studentId": "116015436799734947995" })
	.expect(200)
	.end(function(err) {
		console.log(err);
	})

request(app)
	.delete("/removeStudentFromClub")
	.send({ "uuid": `${uuid}` })
	.expect(400)
	.end(function(err) {
		console.log(err);
	})	
