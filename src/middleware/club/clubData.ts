import { Request, Response, NextFunction } from "express";
import { service, serviceAccountAuth } from "../../app";
import { clubData, memberData } from "../../interface/interface";
import { getSelectedClub } from "./clubMeta";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
  findMeta_ParentFolder,
  getMetaSheet,
} from "../Folder_Meta_Utils/FindMeta_ParentFolder";
import { createClubFolders } from "../Folder_Meta_Utils/CreateClub";
import { v4 as uuidv4 } from "uuid";

/**
 * Retrieves club data based on the provided club name and year.
 * @param req - The request object containing the club name and year.
 * @param res - The response object used to send the club data or error message.
 */
export const getClubData = async (req: Request, res: Response) => {
  try {
    /* const clubName: string = req.body.clubName
        const year: string = req.body.year */
    const clubName: string = req.params.clubName;
    const year: string = req.params.year;

    const club: clubData | false = (await getSelectedClub(
      year,
      clubName,
      "object"
    )) as clubData;

    //console.log(club);

    if (!club) {
      res.status(404).json("Club not found!");
    } else {
      const clubData = {
        clubName: club["Club Name"],
        clubAdivsor: club["Club Advisor"],
        clubAdvisorEmail: club["Advisor Email"],
        clubPresident: club["Club President"],
        clubPresidentEmail: club["President Email"],
        nextMeeting: club["Next Meeting"],
        room: club["Room"],
      };
      res.json(clubData);
    }
  } catch (error) {
    res.json(error);
  }
};

/**
 * Retrieves club data from a metadata sheet for a specified year.
 * @param req - The request object from Express.js.
 * @param res - The response object from Express.js.
 * @param next - The next function from Express.js.
 * @returns The club data as a JSON response.
 */
export const getAllClubData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year } = req.params;

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

    res.json(allClubData);
  } catch (error) {
    res.json(error);
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

    // Create the required club folders using the parent folder ID and club name
    const createClub = await createClubFolders(
      metaSheetParentId["Folder Id"],
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

    res.json(`${clubName} has been added!`);
  } catch (error) {
    res.json(error);
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

    res.json(deleteClubFolder);
  } catch (error) {
    res.json(error);
  }
};
//do we need to get the attendacne data for adfmin?
export const getClubSheet = async (clubName: string, year: string) => {
  let result = await service.files
    .list({
      q: `'${process.env.CLUB_ATTENDANCE_FOLDER_ID}' in parents`,
      fields: "nextPageToken, files(id, name)",
      spaces: "drive",
    })
    .catch((error) => console.log(error));
  let folder = result.data.files;
  const selectedYearFolder = folder?.filter((folder) => folder.name === year);

  const attendanceFolderData = await service.files.list({
    q: `name = '${clubName}' and '${selectedYearFolder![0].id}' in parents`,
    fields: "nextPageToken, files(id, name)",
  });

  const attendanceId: string | undefined | null =
    attendanceFolderData.data.files![0].id;

  const attendanceData = await service.files.list({
    q: `'${attendanceId}' in parents`,
    fields: "nextPageToken, files(id, name)",
  });

  return attendanceData;
};

//get all students in club
export const getClubMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    /* const year: string = req.body.year;
    const clubName: string = req.body.clubName; */
    const year: string = req.params.year;
    const clubName: string = req.params.clubName;

    const attendanceSheetFile = await getClubSheet(clubName, year);

    const attendanceSheetId: string | undefined | null =
      attendanceSheetFile.data.files?.find(
        (file) => file.name === `${clubName}`
      )?.id;

    const attendanceSheetData = new GoogleSpreadsheet(
      attendanceSheetId as string,
      serviceAccountAuth
    );
    await attendanceSheetData.loadInfo();

    const attendanceSheet = attendanceSheetData.sheetsByIndex[0];
    const rows = await attendanceSheet.getRows();

    console.log(rows);

    const allMembers: memberData[] = [];

    rows.forEach((row) => {
      const member = {
        UID: row.get("UID"),
        firstName: row.get("First Name"),
        lastName: row.get("Last Name"),
        email: row.get("Email"),
        grade: row.get("Grade"),
        position: row.get("Position"),
        officialClass: row.get("Official Class"),
        numAttendance: row.get("# of Attendances"),
        date: row.get("Date"),
      };
      allMembers.push(member);
    });

    res.json(allMembers);
  } catch (error) {
    res.json(error);
  }
};

//remove student from club
export const removeStudentFromClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const year = req.body.year;
    const clubName = req.body.clubName;
    const UID = req.body.UID;

    const attendanceSheetFile = await getClubSheet(clubName, year);

    const attendanceSheetId: string | null | undefined =
      attendanceSheetFile.data.files?.find(
        (file) => file.name === `${clubName}`
      )?.id;

    const attendanceSheetData = new GoogleSpreadsheet(
      attendanceSheetId as string,
      serviceAccountAuth
    );
    await attendanceSheetData.loadInfo();

    const attendanceSheet = attendanceSheetData.sheetsByIndex[0];
    const rows = await attendanceSheet.getRows();

    const selectedStudent = rows.filter((row) => row.get("UID") === UID)[0];
    await selectedStudent.delete();

    res.json(
      `${selectedStudent.get("First Name")} ${selectedStudent.get(
        "Last Name"
      )} has been removed from ${clubName}`
    );
  } catch (error) {
    res.json(error);
  }
};
