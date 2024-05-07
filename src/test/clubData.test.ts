import request from "supertest";
import { app } from ".././app";

// getClubData
request(app).get("/getClubData/:clubName/:year")
	.field("clubName", "Anime Club")
	.field("year", "2024-2025")
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app).get("/getClubData/:clubName/:year")
	.field("clubName", "ClubDoesNotExist")
	.field("year", "2024-2025")
	.expect(404, "Club not found!")
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// getAllClubData
request(app).get("/getAllClubData/:year/:uuid")
	.field("year", "2024-2025")
	.expect(200)
	.end(function(err) {
		console.log(err);
	})

request(app).get("/getAllClubData/:year/:uuid")
	.field("year", "0000-0000")
	.expect(404, "Folder not found!")
	.end(function(err) {
		console.log(err);
	})

request(app)
	.post("/addClub")
	.field("year", "2024-2025")
	.field("clubName", "Anime Club")
	.field("clubAdvisor", "clubAdvisor")
	.field("clubAdvisorEmail", "clubAdvisorEmail")
	.field("clubPresident", "clubPresident")
	.field("clubPresidentEmail", "clubPresidentEmail")
	.field("room", "room")
	.expect(200, "Anime Club hass been added!")
	.end(function(err) {
		console.log(err);
	});

request(app)
	.post("/addClub")
	.field("year", "0000-0000") // Wrong year for the parent folder thing
	.field("clubName", "Anime Club")
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
	.field("year", "2024-2025")				
