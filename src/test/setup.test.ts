import request from "supertest"
import { app } from "../app"
import path = require("path")

// create clubs from a csv
// going to need a parameter to allow for creaeting test club data
request(app).post("/createClubTemplate")
	.attach("csv", path.resolve(__dirname, "../../test.csv"))
	.field("uuid", "116015436799734947995")
	.expect(200)

// create clubs from sheets id which is set in the .envs 
request(app).post("/createClubTemplate")
	.field("uuid", "116015436799734947995")
	.expect(200)

request(app).post("/createClubTemplate")
	.expect(400)
