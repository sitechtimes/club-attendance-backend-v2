import { Request, Response, NextFunction } from "express";
import { service, serviceAccountAuth } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";

export const createSheets = async (
  
) = > {
  
}

export const createUserSheet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // await userDataSpreadSheet.loadInfo(); // loads document properties and worksheets
    // console.log(userDataSpreadSheet);
    const sheet = await service.files.create({
      // create google spreadsheet
      requestBody: {
        name: "User Data",
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID as string],
      },
      fields: "id",
    });

    const newUserData = new GoogleSpreadsheet(
      sheet.data.id as string,
      serviceAccountAuth
    );

    await newUserData.loadInfo();
    const userDataSheet = newUserData.sheetsByIndex[0];

    await userDataSheet.setHeaderRow([
      "UID",
      "First Name",
      "Last Name",
      "Email",
      "Client Authority",
      "Club Data",
      "Present Location", // do we need this?
    ]);

    /* const sheetHeaders = await userDataSpreadSheet.addSheet({
      headerValues: [
        "UID",
        "First Name",
        "Last Name",
        "Email",
        "Client Authority",
        "Club Data",
        "Present Location", // do we need this?
      ],
    }); */

    await userDataSheet.updateProperties({ title: "User Data" });

    await userDataSheet.loadCells("A1:L1");

    for (let i = 0; i < 12; i++) {
      const cell = userDataSheet.getCell(0, i); // access cells using a zero-based index
      console.log(cell.value);
      cell.textFormat = { bold: true };
      // save all updates in one call
    }
    await userDataSheet.saveUpdatedCells();

    res.json({ message: "User Data Sheet Created!" });
    // might need next for each function or we could just put them all in one function idk
  } catch (error) {
    res.json(error);
  }
};

export const createClubsInAttendanceSheet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sheet = await service.files.create({
      requestBody: {
        name: "Clubs In Attendance",
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID as string],
      },
      fields: "id",
    });

    const newClubsInAttendance = new GoogleSpreadsheet(
      sheet.data.id as string,
      serviceAccountAuth
    );

    await newClubsInAttendance.loadInfo();

    const clubsInAttendanceSheet = newClubsInAttendance.sheetsByIndex[0];

    await clubsInAttendanceSheet.setHeaderRow([
      "Club Name",
      "Club Attendance Sheet",
    ]);

    await clubsInAttendanceSheet.updateProperties({
      title: "Clubs In Attendance",
    });

    await clubsInAttendanceSheet.loadCells("A1:B1");

    for (let i = 0; i < 2; i++) {
      const cell = clubsInAttendanceSheet.getCell(0, i);
      cell.textFormat = { bold: true };
    }

    await clubsInAttendanceSheet.saveUpdatedCells();

    // might need next for each function or we could just put them all in one function idk
  } catch (error) {
    console.log(error);
  }
};

// create master attendance sheet
export const createMasterAttendanceSheet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sheet = await service.files.create({
      requestBody: {
        name: "Master Attendance",
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID as string],
      },
      fields: "id",
    });

    const newMasterAttendance = new GoogleSpreadsheet(
      sheet.data.id as string,
      serviceAccountAuth
    );

    await newMasterAttendance.loadInfo();

    const masterAttendanceSheet = newMasterAttendance.sheetsByIndex[0];

    await masterAttendanceSheet.setHeaderRow([
      "First Name",
      "Last Name",
      "Club Name",
    ]);

    await masterAttendanceSheet.updateProperties({
      title: "Master Attendance",
    });

    await masterAttendanceSheet.loadCells("A1:C1");

    for (let i = 0; i < 3; i++) {
      const cell = masterAttendanceSheet.getCell(0, i);
      cell.textFormat = { bold: true };
    }

    await masterAttendanceSheet.saveUpdatedCells();

    // might need next for each function or we could just put them all in one function idk
  } catch (error) {
    console.log(error);
  }
};

// folder meta
export const createFolderMeta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sheet = await service.files.create({
      requestBody: {
        name: "Folder Meta",
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID as string],
      },
      fields: "id",
    });

    const newFolderMeta = new GoogleSpreadsheet(
      sheet.data.id as string,
      serviceAccountAuth
    );

    await newFolderMeta.loadInfo();

    const folderMetaSheet = newFolderMeta.sheetsByIndex[0];

    await folderMetaSheet.setHeaderRow([
      "Folder Name",
      "Meta Sheet ID",
      "Folder Id ",
    ]);

    await folderMetaSheet.updateProperties({
      title: "Folder Meta",
    });

    await folderMetaSheet.loadCells("A1:C1");

    for (let i = 0; i < 3; i++) {
      const cell = folderMetaSheet.getCell(0, i);
      cell.textFormat = { bold: true };
    }

    await folderMetaSheet.saveUpdatedCells();

    // might need next for each function or we could just put them all in one function idk
  } catch (error) {
    console.log(error);
  }
};
