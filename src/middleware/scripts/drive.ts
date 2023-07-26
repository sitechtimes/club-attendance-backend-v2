import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from "googleapis";
import { v4 as uuidv4 } from 'uuid';
import { clubNameDoc } from "../../app";
import QRCode from "qrcode";
import { upload } from "../user/multer";
import { cloudbuild } from "googleapis/build/src/apis/cloudbuild";

export const createClubTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let arrFolderName: string[] = [];
  let headerValues: string[] = [
    "UID",
    "First Name",
    "Last Name",
    "Email",
    "Position",
    "Grade",
    "Official Class",
    "# of Attendences",

  ];
  // let arrFolderId: string[] = [];
  const date = new Date();
  const year = date.getFullYear();

  const yearFolderMetaData = {
    name: `${year}-${year + 1}`,
    mimeType: "application/vnd.google-apps.folder",
    parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
  };

  const permissions = {
    role: "writer",
    type: "user",
    emailAddress: "harveyjiang11@gmail.com",
    sendNotificationEmails: false,
  };

  async function createQRCode(parentID: string, folderName: string) {
    try {
      const link = `https://www.test.com/${folderName}`;
      const qrcode = await QRCode.toFile( `./imgs/${folderName}.png`, link, { type: "png"} )

      //Johnson please save the qrcode to the drive, the parent ID is here 
      return qrcode;
    } catch (error) {
      console.error(error);
    }
  }

  async function getClubNames() {
    await clubNameDoc.loadInfo();
    const clubNameSheet = clubNameDoc.sheetsByIndex[0];
    const clubNameSheetLen = clubNameSheet.rowCount;
    await clubNameSheet.loadCells(`A1:A${clubNameSheetLen}`);

    let clubNames = [];
    for (let i=1; i < clubNameSheetLen; i++) {
      const cell = clubNameSheet.getCell(i, 0);
      //Stop iterating when the row is empty
      if (cell.value === null) {
        break
      }
      clubNames.push(cell.value);
    }
    return clubNames;
  }

  async function createYearFolder() {

    const folder = await service.files.create({
      resource: yearFolderMetaData,
      fields: "id",
    });

    const folderId: string = folder.data.id;
    try {
      function timeout(ms: Number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      const clubNames = await getClubNames();
      console.log(clubNames)
      for (let i=0; i < clubNames.length; i++) {
        await timeout(3000);
        const folderName = clubNames[i];
        console.log("line 70")
        await createClubFolder(folderId, folderName);
      }

    console.log("year folder created")
    } catch (error) {
      console.error(error);
    }
  }
  async function addToMeta(folderName: string, clubFolderId: string, photoSheetId: string, attendanceSheetId: string, qrCode: any) {
    const metaDataSpreadSheet = new GoogleSpreadsheet(process.env.CLUB_METADATA_SPREADSHEET_ID, serviceAccountAuth);
    const metaDataSheet = metaDataSpreadSheet.sheetsByIndex[0];
    const metaDataSheetLen = metaDataSheet.rowCount;

    await metaDataSheet.loadCells(`A1:A${metaDataSheetLen}`);
    await metaDataSheet.addRow([
        folderName, 
        "advisor email", 
        "president email", 
        "next meeting date", 
        JSON.stringify(qrCode), 
        clubFolderId, 
        attendanceSheetId, 
        photoSheetId, 
        uuidv4()
    ])
    await metaDataSheet.saveUpdatedCells();

  }

  async function createAttendanceSheet(parentID: string, sheetName: string) {
    const attendanceRequestBody = {
      name: sheetName,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentID],
    };

    const attendanceSpreadsheet = await service.files.create({
      resource: attendanceRequestBody,
      fields: "id",
    });

    const attendanceSpreadsheetId = attendanceSpreadsheet.data.id;
    //Opening the created spreadsheet to add header row values
    const attendanceDoc = new GoogleSpreadsheet(attendanceSpreadsheetId, serviceAccountAuth);
    await attendanceDoc.loadInfo();
    const sheet = attendanceDoc.sheetsByIndex[0];
    await sheet.loadCells("A1:K1");
    console.log("askjdjajsdaslkjdaksjldjaksjdla")
    for (let i = 0; i < 9; i++) {
      const cell = sheet.getCell(0, i); // access cells using a zero-based index
      cell.value = headerValues[i];
      cell.textFormat = { bold: true };
    }

    await sheet.saveUpdatedCells();
    return attendanceSpreadsheetId;
  }

  async function createPhotoFolder(parentID: string, folderName: string) {
    try {

      const photoFolderMetaData = {
        name: `${folderName} Attendence Photos`,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentID],
      };
      
      const photoFolder = await service.files.create({
        resource: photoFolderMetaData,
        fields: "id",
      });

      // res.json(`Created folder for ${folderName} attendence photos.`);
      return photoFolder.data.id;

    } catch (error) {
      res.json(error);
    }
  }

  async function createClubFolder(parentID: string, folderName: string) {
    console.log("this si the club folder hahaha")
    const folderMetaData = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentID],
    };

    const clubFolder = await service.files.create({
      resource: folderMetaData,
      fields: "id",
    });

    const folderId: string = clubFolder.data.id;
    console.log(folderName)

    try {
      console.log(parentID)
      console.log("PHOTO")
      const photoSheetId = await createPhotoFolder(folderId, folderName);
      console.log("ATTENDANCE")
      const attendanceSheetId = await createAttendanceSheet(folderId, folderName);
      console.log("QR CODE")
      const qrCode = await createQRCode(folderId, folderName);

      //add club to metadata spreadsheet given club name, and ids of the spreadsheets
      const metaSheet = addToMeta(folderName, folderId, photoSheetId, attendanceSheetId, qrCode);
      console.log(`Created all drive content for ${folderName}!`);
    } catch (error) {
      res.json(error);
    }
  }

  createYearFolder();
  res.json({ message: "Successfully created all club folders for the school year!" });
};

export const createClubMeta = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //using user email for now
  const userEmail = req.body.email;
  console.log(userEmail);
  const userSpreadsheet = new GoogleSpreadsheet(process.env.USER_DATA_SPREADSHEET_ID, serviceAccountAuth);
  await userSpreadsheet.loadInfo();
  const userSheet = userSpreadsheet.sheetsByIndex[0];
  const users = await userSheet.getRows();

  //check if the user is an admin before performing 
  const foundUser = users.filter(e => (e.get('Email') === userEmail) && (e.get('Client Authority') === 'admin'));
  if (foundUser.length === 0) {
    res.status(400);
    res.json({ error: 'Forbidden'});
    return
  }
  console.log(`${userEmail} exists and is an admin`);
  const fileMetaData = {
    name: 'Club MetaData',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID]
  }
  try {
    const spreadsheet = await service.files.create({
      resource: fileMetaData,
      fields: 'id'
    })
    const spreadsheetId = spreadsheet.data.id;
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();

    const meta_sheet = doc.sheetsByIndex[0];
    await meta_sheet.setHeaderRow(["Club Name", "Advisor Email", "President Email", "Next Meeting", "QR Code", "Club Folder ID", "Club Spreadsheet", "Club Photo Folder ID", "Club Code"]);
    await meta_sheet.updateProperties({ title: 'userMetaData' })
    await meta_sheet.loadCells("A1:I1");
    
    for(let i = 0; i < 9; i++) {
      const cell = meta_sheet.getCell(0, i); // access cells using a zero-based index
      console.log(cell.value)
      cell.textFormat = { fontFamily: 'Times New Roman'};
      await meta_sheet.saveUpdatedCells(); // save all updates in one call
  }
  
  res.json({ message: 'Club MetaData Sheet Created!' });
  next();

  } catch (error) {
    console.error(error);
  }
}