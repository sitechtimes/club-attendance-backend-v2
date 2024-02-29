import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service, ClubsInAttendance } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import {
  findMeta_ParentFolder,
  getMetaSheet,
} from "../Folder_Meta_Utils/FindMeta_ParentFolder";

/**
 * Updates attendance records in a Google Spreadsheet.
 * @param req - The request object containing the year, UUID, and club name.
 * @param res - The response object used to send the JSON response.
 */
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const { year, uuid, clubName } = req.body;
    const date = new Date().toLocaleDateString();

    // Load user data spreadsheet
    const userDoc = new GoogleSpreadsheet(
      process.env.USER_DATA_SPREADSHEET_ID as string,
      serviceAccountAuth
    );
    await userDoc.loadInfo();

    // Get user sheet and rows
    const userSheet = userDoc.sheetsByIndex[0];
    const userSheetRows = await userSheet.getRows();

    // Find user by UUID
    const user = userSheetRows.find((row) => row.get("UID") === uuid);
    if (!user) {
      return res.status(404).json("User not found!");
    }

    const userObject = user.toObject();

    // Find the parent folder ID of the metadata sheet for the specified year
    const metaSheetParentId = await findMeta_ParentFolder(year);
    if (!metaSheetParentId) {
      return res.status(404).json("Folder not found!");
    }

    // Retrieve the metadata sheet using the parent folder ID
    const metaSheet = await getMetaSheet(
      metaSheetParentId["Meta Sheet ID"],
      clubName
    );
    if (!metaSheet) {
      return res.json(false);
    }

    const clubspreadsheet = metaSheet.get("Club Spreadsheet");

    await ClubsInAttendance.loadInfo();

    const ClubsInAttendanceSheet = ClubsInAttendance.sheetsByIndex[0];
    const ClubsInAttendanceRows = await ClubsInAttendanceSheet.getRows();

    const club_logged = ClubsInAttendanceRows.find(
      (row) => row.get("Club Name") === clubName
    );
    // Adds club to Clubs in Attendance if not already present
    if (!club_logged) {
      await ClubsInAttendanceSheet.addRow({
        "Club Name": clubName,
        "Club Attendance Sheet": clubspreadsheet,
      });
    }
    // Load club attendance spreadsheet
    const clubAttendance = new GoogleSpreadsheet(
      clubspreadsheet as string,
      serviceAccountAuth
    );
    await clubAttendance.loadInfo();

    // Create or get current attendance sheet
    const currentAttendanceSheet = await createNewSheet(clubAttendance, date);
    const currentAttendanceSheetRows = await currentAttendanceSheet.getRows();

    // Get main sheet and rows of club attendance spreadsheet
    const clubAttendanceMainSheet = clubAttendance.sheetsByIndex[0];
    const clubAttendanceRows = await clubAttendanceMainSheet.getRows();

    // Check if user is already present in the club attendance spreadsheet
    const existingUser = clubAttendanceRows.find(
      (row) => row.get("UID") === uuid
    );
    if (
      existingUser &&
      currentAttendanceSheetRows.some((row) => row.get("UID") === uuid)
    ) {
      return res.json("This user is already present!");
    }

    // Determine user's position (President or Member) based on the club data
    const isPresident = () => {
      const { PresidentOf } = JSON.parse(userObject["Club Data"]);
      return PresidentOf.includes(clubName) ? "President" : "Member";
    };

    // Prepare row data for user
    const rowData = {
      UID: userObject["UID"],
      "First Name": userObject["First Name"],
      "Last Name": userObject["Last Name"],
      Email: userObject["Email"],
      Position: isPresident(),
      Grade: user["Grade"],
      "Official Class": userObject["Official Class"],
    };

    if (!existingUser) {
      // First time attending the club
      console.log("adding user to main");

      const newUser = await clubAttendanceMainSheet.addRow(rowData);
      newUser.assign({
        "# of Attendances": 1,
        "Date Joined": date,
        "Last Signed In": date,
        Absence: 0,
      });

      await newUser.save();
    } else {
      // Recurring member of club
      console.log("updating attendance");

      existingUser.assign({
        "# of Attendances": parseInt(existingUser.get("# of Attendances")) + 1,
        "Last Signed In": date,
      });

      await existingUser.save();
    }

    // Add user to current attendance sheet
    await currentAttendanceSheet.addRow(rowData);

    res.json(`Added ${uuid} to ${clubName}!`);
  } catch (error) {
    res.json(error);
  }
};

/**
 * Creates a new sheet in a Google Spreadsheet if a sheet with the given date does not already exist.
 * @param sheet - The Google Spreadsheet object.
 * @param date - The date for the new sheet in the format "YYYY-MM-DD".
 * @returns The newly created sheet with the given date as the title.
 */
async function createNewSheet(sheet: GoogleSpreadsheet, date: string) {
  const existingSheet = sheet.sheetsByTitle[date];
  if (!existingSheet) {
    const newSheet = await sheet.addSheet({ title: date });
    const headerRow = [
      "UID",
      "First Name",
      "Last Name",
      "Email",
      "Position",
      "Grade",
      "Official Class",
    ];
    await newSheet.setHeaderRow(headerRow);
    return newSheet;
  }
  return existingSheet;
}

// goin to have to redo this
export const showAttendancePhotos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clubName = req.body.clubName;
    const year = req.body.year;
    const attendanceData = await getClubSheet(clubName, year);

    console.log(attendanceData.data.files);

    const photosFolderId = attendanceData.data.files?.filter(
      (file) => file.name === `${clubName} Attendance Photos`
    )[0].id;

    const photos = await service.files.list({
      q: `'${photosFolderId}' in parents`,
      fields: "files(id, name, webViewLink, webContentLink, thumbnailLink)",
    });

    res.json(photos.data.files);
  } catch (error) {
    res.json(error);
  }
};
