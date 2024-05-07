import request from "supertest";
import { app } from ".././app";
import path = require("path");

// upload image
request(app)
	.post("/uploadImage")
	.attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
	.field("year", "2024-2025")
	.field("clubName", "Anime Club")
	.field("uuid", "113380945040354412648")
	.expect(200)
	.expect({ message: "File uploaded successfully!" })
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app).post("/uploadImage")
	.expect(400)
	.expect("Missing required parameters")
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});
// Get Unapproved images
// need to pass uuid in before running test
request(app)
	.get("/getUnapprovedImages/:uuid")
	.expect(200 || 204)
	.expect(
		function(res) {
			Array.isArray(res.body);
		} || "No Images to be Approved"
	);

// approve image
request(app)
	.patch("/approveImage")
	.field("year", "2024-2025")
	.field("clubName", "Anime Club")
	.expect(200)
	.expect("Image has been approved and has been moved to the new folder")
	.end((err) => {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.patch("/approveImage")
	.expect(400)
	.expect("Missing required parameters")
	.end((err) => {
		console.log(err);
	});

request(app)
	.patch("/approveImage")
	.field("year", "0000-0000")
	.field("clubName", "Anime Club")
	.expect(404)
	.expect("Folder not found!")
	.end((err) => {
		console.log(err);
	});

request(app)
	.patch("/approveImage")
	.field("year", "2024-2025")
	.field("clubName", "ClubDoesNotExist")
	.expect(404)
	.expect("Meta Not Found!")
	.end((err) => {
		console.error(err);
	});

// Image should have already be approved their should be no other image with these fields
request(app)
	.patch("/approveImage")
	.field("year", "2024-2025")
	.field("clubName", "Anime Club")
	.expect(404)
	.expect("No images found!")
	.end((err) => {
		console.error(err);
	});
// probably need to create the image before unapproving it
request(app)
	.patch("/unapproveImage")
	.field("imageId", "id")
	.expect(200, "Image has been unapproved and has been deleted from the folder")
	.end((err) => {
		console.error(err);
	});

request(app)
	.patch("/unapproveImage")
	.expect(400, "Missing required parameters")
	.end((err) => {
		console.error(err);
	});
