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
	.expect(404, "Club not found!")
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// getAllClubData
request(app)
	.get(`/getAllClubData/${year}/${uuid}`)
	.field("year", "2024-2025")
	.expect(200)
	.end(function(err) {
		console.log(err);
	})

// passing in an invalid year 	
request(app)
	.get("/getAllClubData/0000-0000/${uuid}")
	.expect(404, "Folder not found!")
	.end(function(err) {
		console.log(err);
	})

request(app)
	.post("/addClub")
	.field("year", `${year}`)
	.field("clubName", "AddNewClub")
	.field("clubAdvisor", "clubAdvisor")
	.field("clubAdvisorEmail", "clubAdvisorEmail")
	.field("clubPresident", "clubPresident")
	.field("clubPresidentEmail", "clubPresidentEmail")
	.field("room", "room")
	.expect(200)
	.end(function(err) {
		console.log(err);
	});

request(app)
	.post("/addClub")
	.field("year", "0000-0000") // Wrong year for the parent folder thing
	.field("clubName", "AddNewClub")
	.field("clubAdvisor", "clubAdvisor")
	.field("clubAdvisorEmail", "clubAdvisorEmail")
	.field("clubPresident", "clubPresident")
	.field("clubPresidentEmail", "clubPresidentEmail")
	.field("room", "room")
	.expect(404, "Folder not found!")
	.end(function(err) {
		console.log(err);
	});

request(app)
	.delete("/deleteClub")
	.field("year", `${year}`)
	.field("clubName", "AddNewClub")
	.expect(200, "Anime Club has been deleted!")
	.end(function(err) {
		console.log(err);
	});

request(app)
	.delete("/deleteClub")
	.expect(400, "Missing required parameters!")
	.end(function(err) {
		console.log(err);
	});

request(app)
	.get(`/getClubMembers/${clubName}/${year}/${uuid}`)
	.expect(200)
	.end(function(err) {
		console.log(err);
	});

request(app).get("/getClubMembers")
	.expect(400, "Missing required parameters!")
	.end(function(err) {
		console.log(err);
	});

// this can use both admin and club president ids
request(app)
	.delete("/removeStudentFromClub")
	.field("clubName", `${clubName}`)
	.field("year", `${year}`)
	.field("uuid", `${uuid}`)
	.expect(200, "Member has been deleted")
	.end(function(err) {
		console.log(err);
	})

request(app)
	.delete("/removeStudentFromClub")
	.expect(400, "Missing required parameters!")
	.end(function(err) {
		console.log(err);
	})	
