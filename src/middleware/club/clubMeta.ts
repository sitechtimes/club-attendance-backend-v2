import { Request, Response } from "express";
import {
	findMeta_ParentFolder,
	getMetaSheet,
} from "../Folder_Meta_Utils/FindMeta_ParentFolder";

/**
 * Retrieves information about a specific club for a given year from a Google Spreadsheet.
 * @param year - The year for which the club information is requested.
 * @param clubName - The name of the club for which the information is requested.
 * @param dataType - The type of data to be returned. It can be either "object" or "raw data".
 * @returns The selected club's information in the specified data type.
 */
export async function getSelectedClub(
	year: string,
	clubName: string,
	dataType: string
) {
	const MetaSheetId = await findMeta_ParentFolder(year);

	if (!MetaSheetId) {
		return false;
	}

	const findClub = await getMetaSheet(MetaSheetId["Meta Sheet ID"], clubName);

	if (!findClub) {
		return false;
	}

	// Return the selected club's information in the specified data type
	if (dataType === "object") {
		return findClub.toObject();
	} else if (dataType === "raw data") {
		return findClub;
	}
}

/**
 * Retrieves club data from a metadata sheet for a specified year.
 * @param req - The request object from Express.js.
 * @param res - The response object from Express.js.
 * @returns The club data as a JSON response.
 */
export const getAllClubMeta = async (req: Request, res: Response) => {
	try {
		const { year } = req.params;

		if (!year) {
			res.status(400).json("Missing required parameters");
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
			return res.json(false);
		}

		const metaSheetRows = await metaSheet.getRows();

		const allClubData = metaSheetRows.map((row: any) => row.toObject());

		res.status(200).json(allClubData);
	} catch (error) {
		res.json(error);
	}
};

/**
 * Adds the next meeting date for a specific club.
 * @param req - The Express request object containing the request body.
 * @param res - The Express response object used to send the response.
 * @param next - The Express next function used to pass control to the next middleware.
 */
export const addClubMeeting = async (req: Request, res: Response) => {
	try {
		const { year, clubName, nextMeeting } = req.body;

		if (!year || !clubName || !nextMeeting) {
			res.status(400).json("Missing required parameters!");
		}

		const selectedClub = await getSelectedClub(year, clubName, "raw data");

		selectedClub?.set("Next Meeting", nextMeeting);

		await selectedClub?.save();

		const updatedNextMeeting = selectedClub?.get("Next Meeting");

		res.status(200).json({
			message: `Successfully added next meeting date as ${updatedNextMeeting}!`,
		});
	} catch (error) {
		res.json(error);
	}
};

/**
 * Deletes the next meeting date of a club.
 * @param req - The request object containing the year and clubName properties in the body.
 * @param res - The response object used to send the JSON response.
 * @returns A JSON object containing a success message indicating that the next meeting date has been deleted.
 */
export const deleteClubMeeting = async (req: Request, res: Response) => {
	try {
		const { year, clubName } = req.body;

		if (!year || !clubName) {
			res.status(400).json("Missing required parameters!");
		}

		const selectedClub = await getSelectedClub(year, clubName, "raw data");

		selectedClub?.set("Next Meeting", "No Meeting Scheduled");

		await selectedClub?.save();

		res
			.status(200)
			.json({ message: `Successfully deleted next meeting date!` });
	} catch (error) {
		res.json(error);
	}
};
