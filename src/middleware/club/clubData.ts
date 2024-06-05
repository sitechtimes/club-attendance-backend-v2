import { Request, Response } from "express";
import { service, serviceAccountAuth } from "../../app";
import { clubData } from "../../interface/interface";
import { getSelectedClub } from "./clubMeta";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
	findMeta_ParentFolder,
	getMetaSheet,
} from "../Folder_Meta_Utils/FindMeta_ParentFolder";
import { createClubFolders } from "../setup/createClub";
import { v4 as uuidv4 } from "uuid";

/**
 * Retrieves club data based on the provided club name and year.
 * @param req - The request object containing the club name and year.
 * @param res - The response object used to send the club data or error message.
 */
export const getClubData = async (req: Request, res: Response) => {
	try {
		const { clubName, year } = req.params;

		if (!clubName || !year) {
			res.status(400).json("Missing required parameters!");
		}

		const club: clubData | false = (await getSelectedClub(
			year,
			clubName,
			"object"
		)) as clubData;

		if (!club) {
			res.status(404).json("Club not found!");
		} else {
			const qrCodeLink = await service.files.get({ fileId: club["QR Code"], fields: "webViewLink" });
			const clubData = {
				clubName: club["Club Name"],
				clubAdivsor: club["Club Advisor"],
				clubAdvisorEmail: club["Advisor Email"],
				clubPresident: club["Club President"],
				clubPresidentEmail: club["President Email"],
				nextMeeting: club["Next Meeting"],
				room: club["Room"],
				qrCodeLink: `https://drive.google.com/uc?id=${club["QR Code"]}`,
				qrcodeWeb: qrCodeLink.data.webViewLink,
				thumbnailLink: club["Club Attendance Photo"],
			};
			res.status(200).json(clubData);
		}
	} catch (error) {
		res.status(400).json(error);
	}
};

export const getAllClubData = async (req: Request, res: Response) => {
	try {
		const { year } = req.params;

		if (!year) {
			return res.status(400).json("Missing required parameters!");
		}

		// Find the parent folder ID of the metadata sheet for the specified year
		const metaSheetParentId = await findMeta_ParentFolder(year);

		if (!metaSheetParentId) {
			return res.status(404).json("Folder not found!");
		}

		// Retrieve the metadata sheet using the parent folder ID
		const metaSheet = await getMetaSheet(
			metaSheetParentId["Meta Sheet ID"],
			null
		);

		if (!metaSheet) {
			return res.status(404).json(false);
		}

		const metaSheetRows = await metaSheet.getRows();

		const allClubData = metaSheetRows.map((row: any) => {
			const club = row.toObject();
			const clubData = {
				clubName: club["Club Name"],
				clubAdivsor: club["Club Advisor"],
				clubAdvisorEmail: club["Advisor Email"],
				clubPresident: club["Club President"],
				clubPresidentEmail: club["President Email"],
				nextMeeting: club["Next Meeting"],
				room: club["Room"],
				thumbnailLink: club["Club Attendance Photo"],
			};
			return clubData;
		});

		res.status(200).json(allClubData);
	} catch (error) {
		res.status(400).json(error);
	}
};

/**
 * Adds club data to a Google Spreadsheet.
 * @param req - The request object containing the club data in the request body.
 * @param res - The response object used to send the response back to the client.
 * @returns A JSON response indicating the success or error that occurred.
 */
export const addClubData = async (req: Request, res: Response) => {
	try {
		const {
			year,
			clubName,
			clubAdvisor,
			advisorEmail,
			clubPresident,
			presidentEmail,
			room,
		} = req.body;

		if (
			!year ||
			!clubName ||
			!clubAdvisor ||
			!advisorEmail ||
			!clubPresident ||
			!presidentEmail ||
			!room
		) {
			return res.status(400).json("Missing required parameters!");
		}

		// Find the parent folder ID of the metadata sheet for the specified year
		const metaSheetParentId = await findMeta_ParentFolder(year);

		if (!metaSheetParentId) {
			console.log("Folder not found!");
			return res.status(404).json("Folder not found!");
		}

		// Retrieve the metadata sheet using the parent folder ID
		const metaSheet = await getMetaSheet(
			metaSheetParentId["Meta Sheet ID"] as string,
			null
		);

		if (!metaSheet) {
			console.log("Meta Sheet not found!");
			return res.status(404).json("Meta Sheet not found!");
		}

		// Create the required club folders using the parent folder ID and club name
		const createClub = await createClubFolders(
			metaSheetParentId["Folder Id"] as string,
			clubName
		);

		// Add a new row to the metadata sheet with the club data and other relevant information
		await metaSheet.addRow({
			"Club Name": clubName,
			"Advisor Email": advisorEmail,
			"Club Advisor": clubAdvisor,
			"President Email": presidentEmail,
			"Club President(s)": clubPresident,
			"Next Meeting": "No Meeting Scheduled",
			Room: room,
			"QR Code": createClub.qrCodeId,
			"Club Folder ID": createClub.clubFolderId,
			"Club Spreadsheet": createClub.clubSheetId,
			"Club Photo Folder ID": createClub.clubPhotoFolderId,
			"Club Code": uuidv4(),
		});

		res.status(200).json(`${clubName} has been added!`);
	} catch (error) {
		res.status(400).json(error);
	}
};

/**
 * Deletes a club's data from a Google Spreadsheet.
 * @param req - The request object containing the year and club name in the request body.
 * @param res - The response object.
 * @returns The deleted club folder object, or a 404 response if the folder is not found, or false if the club is not found in the metadata sheet.
 */
export const deleteClubData = async (req: Request, res: Response) => {
	try {
		const { year, clubName } = req.body;

		if (!year || !clubName) {
			return res.status(400).json("Missing required parameters!");
		}

		// Retrieve the metadata sheet ID for the given year
		const metaSheetId = await findMeta_ParentFolder(year);

		if (!metaSheetId) {
			return res.status(404).json("Folder not found!");
		}

		// Retrieve the metadata sheet for the specified club
		const metaSheet = await getMetaSheet(
			metaSheetId["Meta Sheet ID"],
			clubName
		);

		if (!metaSheet) {
			return res.json(false);
		}

		const metaObject = metaSheet.toObject();

		// Delete the club's folder from Google Drive
		const deleteClubFolder = await service.files.delete({
			fileId: metaObject["Club Folder ID"],
		});

		// Delete the corresponding row from the metadata sheet
		await metaSheet.delete();

		res.status(200).json(deleteClubFolder);
	} catch (error) {
		res.json(error);
	}
};

/**
 * Retrieves the members of a club from a Google Spreadsheet based on the provided year and club name.
 * @param req - The request object containing the year and club name as parameters.
 * @param res - The response object used to send the club members data.
 */
export const getClubMembers = async (req: Request, res: Response) => {
	try {
		const { clubName, year } = req.params;

		if (!year || !clubName) {
			return res.status(400).json("Missing required parameters!");
		}

		// Find the metadata sheet ID for the specified year
		const metaSheetId = await findMeta_ParentFolder(year);

		if (!metaSheetId) {
			return res.status(404).json("Folder not found!");
		}

		// Retrieve the metadata sheet for the specified club
		const metaSheet = await getMetaSheet(
			metaSheetId["Meta Sheet ID"],
			clubName
		);

		if (!metaSheet) {
			return res.status(404).json(false);
		}

		// Create a new GoogleSpreadsheet object using the club spreadsheet ID from the metadata sheet
		const clubSpreadSheet = new GoogleSpreadsheet(
			metaSheet.get("Club Spreadsheet") as string,
			serviceAccountAuth
		);

		await clubSpreadSheet.loadInfo();

		// Get the first sheet of the club spreadsheet
		const allClubMemberSheet = clubSpreadSheet.sheetsByIndex[0];

		// Retrieve all rows from the sheet
		const allClubMemberRows = await allClubMemberSheet.getRows();

		// Convert each row to an object and store them in an array
		const allClubMembers = allClubMemberRows.map((row: any) => row.toObject());

		res.status(200).json(allClubMembers);
	} catch (error) {
		res.json(error);
	}
};

/**
 * Removes a student from a club by deleting their row in a Google Spreadsheet.
 * @param req - The request object containing the year, club name, and member ID.
 * @param res - The response object to send the result of the deletion.
 * @returns A response indicating whether the deletion was successful or not.
 */
export const removeStudentFromClub = async (req: Request, res: Response) => {
	try {
		const { year, clubName, studentId } = req.body;

		if (!year || !clubName || !studentId) {
			return res.status(400).json("Missing required parameters!");
		}
		// Find the metadata sheet ID for the specified year
		const metaSheetId = await findMeta_ParentFolder(year);

		if (!metaSheetId) {
			return res.status(404).json("Folder not found!");
		}

		// Retrieve the metadata sheet for the specified club
		const metaSheet = await getMetaSheet(
			metaSheetId["Meta Sheet ID"],
			clubName
		);

		if (!metaSheet) {
			return res.status(404).json(false);
		}

		// Create a new GoogleSpreadsheet object using the club spreadsheet ID from the metadata sheet
		const clubSpreadSheet = new GoogleSpreadsheet(
			metaSheet.get("Club Spreadsheet") as string,
			serviceAccountAuth
		);

		await clubSpreadSheet.loadInfo();

		// Get the first sheet of the club spreadsheet
		const allClubMemberSheet = clubSpreadSheet.sheetsByIndex[0];

		// Retrieve all rows from the sheet
		const allClubMemberRows = await allClubMemberSheet.getRows();

		// Find the row index corresponding to the memberId
		const rowNum = allClubMemberRows.findIndex(
			(row) => row.get("UID") === studentId
		);

		if (rowNum === -1) {
			return res.json("Member not found!");
		}

		// Delete the row
		await allClubMemberRows[rowNum].delete();

		res.status(200).json("Member has been deleted");
	} catch (error) {
		return res.json(error);
	}
};
