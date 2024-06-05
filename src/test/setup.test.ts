import request from "supertest"
import { app } from "../app"
import path from "path"

// create clubs from a csv
request(app).post("/createClubTemplate")
	.attach("csv", path.resolve(__dirname, "../../ClubDataTestSheet.csv"))
	.field("test", true)
	.field("uuid", "116015436799734947995")
	.expect(200).then(() => {
		console.log("done")
	})

// create clubs from sheets id which is set in the .envs 
request(app).post("/createClubTemplate")
	.field("uuid", "116015436799734947995")
	.expect(200)

request(app).post("/createClubTemplate")
	.expect(400)
