import { Request, Response, NextFunction } from "express";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth, service } from "../../app";
import { clubMeta } from "../../interface/interface";

export async function getSelectedClub(
  year: string,
  clubName: string,
  dataType: string
  // data type should either be object or just the raw data
) {
  // get folder meta
  const allMeta = new GoogleSpreadsheet(
    process.env.FOLDER_META_DATA_SPREADSHEET_ID as string,
    serviceAccountAuth
  );

  await allMeta.loadInfo();

  const allMetaSheet = allMeta.sheetsByIndex[0];
  const allMetaRows = await allMetaSheet.getRows();

  const getYearMeta = () => {
    for (const row of allMetaRows) {
      if (row.get("Folder Name") === year) {
        return row.get("Folder Meta Sheet ID");
      }
    }
    return false;
  };

  if (!getYearMeta()) {
    return false;
  } else {
    const thisYearMeta = new GoogleSpreadsheet(
      getYearMeta() as string,
      serviceAccountAuth
    );

    await thisYearMeta.loadInfo();

    const thisYearMetaSheet = thisYearMeta.sheetsByIndex[0];
    const thisYearMetaRows = await thisYearMetaSheet.getRows();

    /**
     * Retrieves information about a specific club from a Google Spreadsheet based on the provided club name and data type.
     * @param clubName - The name of the club to retrieve information for.
     * @param dataType - The type of data to retrieve. It can be either "object" or "raw data".
     * @returns If the dataType is "object", the function returns an object containing the information of the selected club.
     * If the dataType is not "object", the function returns the row of the selected club.
     * If no matching club is found, the function returns false.
     */
    const selectedClub = () => {
      const selectedRow = thisYearMetaRows.find(
        (row) => row.get("Club Name") === clubName
      );

      if (dataType === "object") {
        return selectedRow?.toObject() || false;
      } else if (dataType === "raw data") {
        return selectedRow || false;
      }
    };

    return selectedClub();
  }
}

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

//can change club meeting as well
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

    res.json({
      message: `Successfully added next meeting date as ${selectedClub?.get(
        "Next Meeting"
      )}!`,
    });
  } catch (error) {
    res.json(error);
  }
};

export const deleteClubMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, clubName } = req.body;
    // const nextMeeting = req.body.nextMeeting;

    const selectedClub = await getSelectedClub(year, clubName, "raw data");

    selectedClub?.set("Next Meeting", "No Meeting Scheduled");

    await selectedClub?.save();

    res.json({ message: `Successfully deleted next meeting date!` });
  } catch (error) {
    res.json(error);
  }
};
