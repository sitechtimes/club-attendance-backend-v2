import { Request, Response, NextFunction } from "express";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth, service } from "../../app";
import { clubMeta } from "../../interface/interface";

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
  // Load the Google Spreadsheet containing the folder metadata
  const allMeta = new GoogleSpreadsheet(
    process.env.FOLDER_META_DATA_SPREADSHEET_ID as string,
    serviceAccountAuth
  );
  await allMeta.loadInfo();

  // Find the row in the metadata sheet that corresponds to the requested year
  const allMetaSheet = allMeta.sheetsByIndex[0];
  const allMetaRows = await allMetaSheet.getRows();

  // Get the metadata sheet ID for the requested year
  const yearMetaId = allMetaRows
    .find((row) => row.get("Folder Name") === year)
    ?.get("Folder Meta Sheet ID");

  // If the requested year metadata is not found, return false
  if (!yearMetaId) {
    return false;
  }

  // Load the Google Spreadsheet containing the club metadata for the requested year
  const thisYearMeta = new GoogleSpreadsheet(
    yearMetaId as string,
    serviceAccountAuth
  );
  await thisYearMeta.loadInfo();

  // Find the row in the club metadata sheet that corresponds to the requested club name
  const thisYearMetaSheet = thisYearMeta.sheetsByIndex[0];
  const thisYearMetaRows = await thisYearMetaSheet.getRows();

  // Get the selected club's information
  const selectedRow = thisYearMetaRows.find(
    (row) => row.get("Club Name") === clubName
  );

  // If the requested club metadata is not found, return false
  if (!selectedRow) {
    return false;
  }

  // Return the selected club's information in the specified data type
  if (dataType === "object") {
    return selectedRow.toObject();
  } else if (dataType === "raw data") {
    return selectedRow;
  }
}

//probably don't need
export const getClubMeta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* const year: string = req.body.year;
  const clubName = req.body.clubName; */

  const year: string = req.params.year;
  const clubName: string = req.params.clubName;

  try {
    let result = await service.files
      .list({
        q: `'${process.env.CLUB_ATTENDANCE_FOLDER_ID}' in parents`,
        fields: "nextPageToken, files(id, name)",
        spaces: "drive",
      })
      .catch((error) => console.log(error));
    let folder = result.data.files;
    const selectedYearFolder = folder?.filter((folder) => folder.name === year);

    const metaSheetData = await service.files.list({
      q: `name = 'Club MetaData' and '${selectedYearFolder![0].id}' in parents`,
      fields: "nextPageToken, files(id, name)",
    });

    const metaSheetDoc = new GoogleSpreadsheet(
      metaSheetData.data.files![0].id as string,
      serviceAccountAuth
    );
    await metaSheetDoc.loadInfo();
    const metaSheet = metaSheetDoc.sheetsByIndex[0];
    const rows = await metaSheet.getRows();

    const allClubMeta: clubMeta[] = [];

    rows.forEach((row) => {
      const clubMeta: clubMeta = {
        clubName: row.get("Club Name"),
        advisorEmail: row.get("Advisor Email"),
        presidentEmail: row.get("President Email"),
        nextMeeting: row.get("Next Meeting"),
        qrCode: row.get("QR Code"),
        clubFolderId: row.get("Club Folder ID"),
        clubSpreadsheet: row.get("Club Spreadsheet"),
        clubPhotoFolderId: row.get("Club Photo Folder ID"),
        clubCode: row.get("Club Code"),
      };
      allClubMeta.push(clubMeta);
    });
    // const selectedClub = await getSelectedClub(year, clubName)
    //   const clubMeta: clubMeta = {
    //     clubName: selectedClub?.get("Club Name"),
    //     advisorEmail: selectedClub?.get("Advisor Email"),
    //     presidentEmail: selectedClub?.get("President Email"),
    //     nextMeeting: selectedClub?.get("Next Meeting"),
    //     qrCode: selectedClub?.get("QR Code"),
    //     clubFolderId: selectedClub?.get("Club Folder ID"),
    //     clubSpreadsheet: selectedClub?.get("Club Spreadsheet"),
    //     clubPhotoFolderId: selectedClub?.get("Club Photo Folder ID"),
    //     clubCode: selectedClub?.get("Club Code")
    //   }

    res.json(allClubMeta);
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
export const addClubMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, clubName, nextMeeting } = req.body;

    const selectedClub = await getSelectedClub(year, clubName, "raw data");

    selectedClub?.set("Next Meeting", nextMeeting);

    await selectedClub?.save();

    const updatedNextMeeting = selectedClub?.get("Next Meeting");

    res.json({
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
 * @param next - The next function to be called in the middleware chain.
 * @returns A JSON object containing a success message indicating that the next meeting date has been deleted.
 */
export const deleteClubMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, clubName } = req.body;

    const selectedClub = await getSelectedClub(year, clubName, "raw data");

    selectedClub?.set("Next Meeting", "No Meeting Scheduled");

    await selectedClub?.save();

    res.json({ message: `Successfully deleted next meeting date!` });
  } catch (error) {
    res.json(error);
  }
};
