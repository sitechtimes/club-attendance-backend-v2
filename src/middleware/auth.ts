import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { serviceAccountAuth } from "../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { findMeta_ParentFolder } from "./Folder_Meta_Utils/FindMeta_ParentFolder";

export const ssoAuth = async (req: Request, res: Response) => {
	try {
		// console.log(req.body.code, "code")

		//formdata that we make from the body from front end
		let URLSearchParamsObj = new URLSearchParams();
		URLSearchParamsObj.append("redirect_uri", "http://localhost:5173");
		URLSearchParamsObj.append("code", `${req.body.code}`);
		URLSearchParamsObj.append("grant_type", "authorization_code");

		//sends a post request to ssoAuth backend to get the code
		const response = await fetch("http://localhost:8000/o/token/", {
			method: "POST",
			headers: {
				// Verify that this Authorization header is correct or this will fail	 
				Authorization: `Basic Q2FTUDRKOEo4bml2VENEVHFlTTgwQkRKeVJJY3BKRmprbzJmNmpHNzpFbE53TGpzWk1sQzRSM2t4YVRiTDhySlBqd0QwR3VTbkZDVWFBVGZKNlo4RGpsQkU3RTNaYm5ibmNQaFM3eVh6dlBuNUd4Vm55c0ljbnZyUkJDT1FOYzJNQU43MHpnUG40SEJnaElVZXBDYW8wdWdUUVJ4S3VNQ0tRcWFUYWRsQg==`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: URLSearchParamsObj,
		}).then(async (res) => {
			const responseBody = await res.json();
			return responseBody.access_token;
		});

		//console.log(response);
		// response object
		// {
		//   access_token: 'KVwgX1ckF5py4A9MY833bjPIvzSRCC',
		//   expires_in: 36000,
		//   token_type: 'Bearer',
		//   scope: 'read write',
		//   refresh_token: 'rouVed3PAeSKTVKp68cnVS13QkMVh2'
		// }
		// interface userDataObjInterface {
		//   email: String,
		//   first_name: String,
		//   last_name: String
		// }

		const userData = await fetch("http://localhost:8000/users/get_user", {
			//get request to ssoAuth backend to actually get the email, firstname, and lastname
			method: "GET",
			headers: {
				Authorization: `Bearer ${response}`,
			},
		}).then(async (user) => {
			//console.log(user);
			return await user.json();
		});

		// res object
		// {
		//   email: "edwinzhou259@gmail.com",
		//   first_name: "",
		//   last_name: ""
		// }

		// check for user or create new user
		const user = new GoogleSpreadsheet(
			process.env.USER_DATA_SPREADSHEET_ID as string,
			serviceAccountAuth
		);

		await user.loadInfo();

		const userDataSheet = user.sheetsByIndex[0];
		const userDataSheetRow = await userDataSheet.getRows();

		// probably can use some other method to search faster
		const selectedUser = userDataSheetRow.find(
			(row) => row.get("Email") === userData.email
		);

		if (selectedUser === undefined) {
			const name = `${response.first_name} ${response.last_name}`;
			const date = new Date().getFullYear();
			const year = `${date}-${date + 1}`;
			// load the club data only if user doens't exists so it don't make this application slow for existing users
			const folderDataObj = await findMeta_ParentFolder(year);


			const clubDataSheetId = folderDataObj["Club Data Id"];

			const ClubData = new GoogleSpreadsheet(
				clubDataSheetId as string,
				serviceAccountAuth
			);

			await ClubData.loadInfo();

			const clubDataSheet = ClubData.sheetsByIndex[0];
			const clubDataSheetRows = await clubDataSheet.getRows();

			let presidentOf: any = clubDataSheetRows
				.filter((row) => row.toObject()["Club President(s)"].includes(name))
				.map((row) => row.toObject()["Club Name"]);

			const clubDataobj = { "PresidentOf": presidentOf, "MemberOf": [] }

			const uuid = uuidv4();

			await userDataSheet.addRow({
				UID: uuid,
				"First Name": userData.first_name,
				"Last Name": userData.last_name,
				Email: userData.email,
				"Client Authority": "user",
				"Club Data": JSON.stringify(clubDataobj),
				"Present Location": "null",
			});

			res.cookie(
				"user_data",
				{
					uid: `${uuid}`,
					firstName: userData.first_name,
					lastName: userData.last_name,
					email: userData.email,
					role: "user",
					isAuthenticated: true,
					ClubData: ";alsdjf",
				},
				{ maxAge: 900000 }
			);
			res.json("cookie is set")
		} else {
			res.cookie(
				"user_data",
				{
					uid: selectedUser.get("UID"),
					"First Name": userData.first_name,
					"Last Name": userData.last_name,
					Email: userData.email,
					"Client Authority": selectedUser.get("Client Authority"),
					"Club Data": JSON.parse(selectedUser?.get("Club Data")),
				},
				{ maxAge: 900000 }
			);
			res.json("a;lsdkjf;laskdjf")
		}
	} catch (error) {
		res.json(error);
	}
};

