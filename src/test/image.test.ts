import request from "supertest";
import { app, service } from ".././app";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { upload } from "../multer";

dotenv.config();

let fileId = "";
const adminId = "116015436799734947995";
const presidentId = "113380945040354412648"
const year = "Test"



// create an image so that unapproved images can be deleted and test could be completed
async function uploadTestImage() {
	try {
		const imagePath = path.join(__dirname, "../../3d+rapid+prototyping.jpeg")
		const media = {
			mimeType: "image/jpeg",
			body: fs.createReadStream(imagePath),
		};

		const file = await service.files.create({
			requestBody: {
				name: "TestImage", parents: [process.env.CLUB_IMAGE_FOLDER_ID as string]
			},
			media: media,
		});

		console.log("File Id:", file.data.id);
		return file.data.id;
	} catch (error) {
		console.log(error);
	}
}

// upload image
request(app)
	.post(`/uploadImage`)
	.attach("image", path.resolve(__dirname, "../../3d+rapid+prototyping.jpeg"))
	.field("year", `${year}`)
	.field("clubName", "Anime Club") // any club should work
	.field("uuid", `${presidentId}`) // this president is a member of Anime and Art club so use only those club to test
	.expect(200)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.post("/uploadImage")
	.field("uuid", `${presidentId}`)
	.field("clubName", "Anime Club")
	.expect(400)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// approve image
const approveImage = async () => {
	request(app)
		.patch("/approveImage")
		.send({ "fileId": `${await uploadTestImage()}`, "year": `${year}`, "clubName": "Anime Club", "uuid": `${adminId}` })
		.expect(200)
}

approveImage();

request(app)
	.patch("/approveImage")
	.send({ "fileId": "NoImageFoundTest", "year": `${year}`, "clubName": "Anime Club", "uuid": `${adminId}` })
	.expect(404)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

request(app)
	.patch("/approveImage")
	.send({ "uuid": `${adminId}` })
	.expect(400)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

// get unapproved images
request(app)
	.get(`/getUnapprovedImages/${adminId}`)
	.expect(200 || 204)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});

const unapproverequest = async () => {
	request(app)
		.delete("/unapproveImage")
		.send({ "uuid": `${adminId}`, "imageId": `${await uploadTestImage()}` })
		.expect(200)

}
unapproverequest();

request(app)
	.delete("/unapproveImage")
	.send({ "uuid": `${adminId}` })
	.expect(400)
	.end(function(err) {
		if (err) {
			console.log(err);
		}
	});
