import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from "googleapis";
import { v4 as uuidv4 } from 'uuid';
import { clubNameDoc } from "../../app";
import QRCode from "qrcode";

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
    "# of Attendence",

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

  async function getClubNames() {
    await clubNameDoc.loadInfo();

    const infoSheet = clubNameDoc.sheetsByIndex[0];
    const infoSheetLen = infoSheet.rowCount;

    await infoSheet.loadCells(`A1:A${infoSheetLen}`);

    const generateQR = async( text: string, clubName: string) => {
      try {
        console.log(await QRCode.toFile( `./imgs/{clubName}.png`,text, {type: "png"} ))
      } catch (err) {
        console.error(err)
      }
    }

    for (let i = 1; i < infoSheetLen; i++) {
      const clubName = infoSheet.getCell(i, 0);

      if (clubName.value === null) {
        break;
      } else {
        const name: string = clubName.value;
        const text: string = `https://www.test.com/${name}`

        generateQR(text, name)
        arrFolderName.push(name);
      }
  
    }
  }

  async function createYearFolder() {
    const folder = await service.files.create({
      resource: yearFolderMetaData,
      fields: "id",
    });

    const folderId: string = folder.data.id;

    function timeout(ms: Number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    try {
      for (let i = 0; i < arrFolderName.length; i++) {
        await timeout(3000);
        const folderName = arrFolderName[i];
        await createClubFolder(folderId, folderName);
      }
    } catch (error) {
      console.error(`create year Folder function ${error}`);
    }
  }

  async function createClubFolder(parentID: String, folderName: String) {
    const folderMetaData = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentID],
    };
    const folder = await service.files.create({
      resource: folderMetaData,
      fields: "id",
    });

    const folderId: string = folder.data.id;

    try {
      await createFolder(folderId);
    } catch (error) {
      console.error(`create club photo folder function ${error}`);
    }
    try {
      await createSheets(folderId, folderName);
    } catch (error) {
      console.error(`create sheets function ${error}`);
    }

    //You can also set this to viewable by everyone or viewable to everyone in the organization in production

    // await service.permissions.create({   ?perm wrong ig
    //   fileId: folderId,
    //   requestBody: permissions,
    // });
  }

  async function createSheets(parentID: String, sheetName: String) {
    const sheetsRequestBody = {
      name: sheetName,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentID],
    };

    const sheetsFolder = await service.files.create({
      resource: sheetsRequestBody,
      fields: "id",
    });

    const sheetsFileId = sheetsFolder.data.id;

    // await service.permissions.create({
    //   fileId: sheetsFileId,
    //   requestBody: permissions,
    // });

    const doc = new GoogleSpreadsheet(sheetsFileId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.loadCells("A1:K1");

    for (let i = 0; i < 9; i++) {
      const cell = sheet.getCell(0, i); // access cells using a zero-based index
      cell.value = headerValues[i];
      cell.textFormat = { bold: true };
      // save all updates in one call
    }

    await sheet.saveUpdatedCells();
  }

  async function createFolder(parentID: string) {
    const folderMetaData = {
      name: "Club Attendence Photos",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentID],
    };
    const folder = await service.files.create({
      resource: folderMetaData,
      fields: "id",
    });
  }

  try {
    await getClubNames();
  } catch (error) {
    console.error(`get club names from sheet error ${error}`);
  }

  //Folder is being created but it seems like the user doesn't have access (folder id is defined)
  try {
    await createYearFolder();

    res.json(`Script Finished`);
  } catch (error) {
    console.error(error);
  }

  try {
  } catch (error) {}
};

export const createQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const clubName = "clubname"

  const text: string = `https://www.test.com/${clubName}`

  const generateQR = async( text: string) => {
    try {
      console.log(await QRCode.toFile( "./imgs/qrcode.png",text, {type: "png"} ))
    } catch (err) {
      console.error(err)
    }
  }

  await generateQR(text)

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
    await meta_sheet.setHeaderRow(["Advisor Email", "President Email", "Next Meeting", "QR Code", "Club Folder ID", "Club Spreadsheet", "Club Photo Folder ID", "Club Code"]);
    await meta_sheet.updateProperties({ title: 'userMetaData' })
    await meta_sheet.loadCells("A1:H1");
    
    for(let i = 0; i < 8; i++) {
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