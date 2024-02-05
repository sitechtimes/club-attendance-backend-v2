import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { v4 as uuidv4 } from "uuid";
import { clubNameDoc } from "../../app";
import QRCode from "qrcode";
import fs from "fs";
import { Readable } from "stream";

export const createClubTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // let arrFolderName: string[] = [];
  let headerValues: string[] = [
    "UID",
    "First Name",
    "Last Name",
    "Email",
    "Position",
    "Grade",
    "Official Class",
    "# of Attendances",
    "Date",
  ];
  const clubAttendanceFolderID = process.env
    .CLUB_ATTENDANCE_FOLDER_ID as string;
  // let arrFolderId: string[] = [];
  const date = new Date();
  const year = date.getFullYear();
  const email = req.body.email;

  // const permissions = {
  //   role: "writer",
  //   type: "user",
  //   emailAddress: "harveyjiang11@gmail.com",
  //   sendNotificationEmails: false,
  // };

  async function createQRCode(parentID: string, folderName: string) {
    try {
      const trimFolderName = folderName.replace(/ /g, "_");
      console.log(trimFolderName);
      const link = `https://www.test.com/${trimFolderName}`;
      const qrcode = await QRCode.toFile(
        `src/imgs/${trimFolderName}.png`,
        link,
        { type: "png" }
      );
      console.log("this is the qrcode:", qrcode);
      const buffer = fs.readFileSync(`src/imgs/${trimFolderName}.png`);

      //Johnson please save the qrcode to the drive, the parent ID is here
      const file = await service.files.create({
        requestBody: {
          name: `${folderName} QR Code`,
          parents: [`${parentID}`],
        },
        media: {
          mimeType: "image/png",
          body: Readable.from([buffer]),
        },
      });
      console.log("File Id:", file.data.id);

      return file.data.id;
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
    for (let i = 1; i < clubNameSheetLen; i++) {
      const cell = clubNameSheet.getCell(i, 0);
      //Stop iterating when the row is empty
      if (cell.value === null) {
        break;
      }
      clubNames.push(cell.value);
    }
    return clubNames;
  }

  //Gets Data of Specific Rows
  async function getClubData(index: number) {
    await clubNameDoc.loadInfo();
    await clubNameDoc.loadInfo();
    const clubNameSheet = clubNameDoc.sheetsByIndex[0];
    const rows = await clubNameSheet.getRows();

    const indexData = rows[index].toObject();

    return indexData;
  }

  async function createYearFolder() {
    const folder = await service.files.create({
      requestBody: {
        name: `${year}-${year + 1}`,
        mimeType: "application/vnd.google-apps.folder",
        parents: [clubAttendanceFolderID],
      },
      fields: "id",
    });

    const folderId = folder.data.id as string;
    try {
      function timeout(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      await createClubMeta(folderId, year);
      const clubNames = await getClubNames();
      console.log(clubNames);
      for (let i = 0; i < clubNames.length; i++) {
        await timeout(3000);
        const folderName: any = clubNames[i];
        console.log("line 70");
        await createClubFolder(folderId, folderName, i);
        console.log("line96");
      }

      console.log(email, "118");
      res.status(200).json("year folder created");
    } catch (error) {
      console.error(error);
    }
  }
  async function addToMeta(
    folderName: string,
    clubFolderId: string,
    photoSheetId: string,
    attendanceSheetId: string,
    qrCodeId: any,
    parentID: string,
    advisor_Email: string,
    club_Advisor: string,
    president_Email: string,
    club_President: string,
    next_Meeting: string,
    Room: string
  ) {
    //search for the metadata spreadsheet in the year folder
    const metaName = "Club MetaData";
    let result = await service.files
      .list({
        q: `mimeType='application/vnd.google-apps.spreadsheet' and '${parentID}' in parents`,
        fields: "nextPageToken, files(id, name)",
        spaces: "drive",
      })
      .catch((error) => console.log(error));
    let metadata = result;

    console.log(metadata.data.files![0].id, "136");

    const metaDataSpreadSheet = new GoogleSpreadsheet(
      metadata.data.files![0].id as string,
      serviceAccountAuth
    );
    await metaDataSpreadSheet.loadInfo();
    const metaDataSheet = metaDataSpreadSheet.sheetsByIndex[0];
    const metaDataSheetLen = metaDataSheet.rowCount;

    await metaDataSheet.loadCells(`A1:A${metaDataSheetLen}`);
    await metaDataSheet.addRow([
      folderName,
      advisor_Email,
      club_Advisor,
      president_Email,
      club_President,
      next_Meeting,
      Room,
      qrCodeId,
      clubFolderId,
      attendanceSheetId,
      photoSheetId,
      uuidv4(),
    ]);
    await metaDataSheet.saveUpdatedCells();
  }

  async function createAttendanceSheet(parentID: string, sheetName: string) {
    const attendanceSpreadsheet = await service.files.create({
      requestBody: {
        name: sheetName,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [parentID],
      },
      fields: "id",
    });

    const attendanceSpreadsheetId = attendanceSpreadsheet.data.id as string;
    //Opening the created spreadsheet to add header row values
    const attendanceDoc = new GoogleSpreadsheet(
      attendanceSpreadsheetId,
      serviceAccountAuth
    );
    await attendanceDoc.loadInfo();
    const sheet = attendanceDoc.sheetsByIndex[0];
    await sheet.loadCells("A1:K1");
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
      const photoFolder = await service.files.create({
        requestBody: {
          name: `${folderName} Attendance Photos`,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentID],
        },
        fields: "id",
      });

      // res.json(`Created folder for ${folderName} attendence photos.`);
      return photoFolder.data.id;
    } catch (error) {
      res.json(error);
    }
  }

  async function createClubFolder(
    parentID: string,
    folderName: string,
    index: number
  ) {
    const clubFolder = await service.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentID],
      },
      fields: "id",
    });

    const folderId = clubFolder.data.id as string;
    console.log(folderName);

    try {
      const photoSheetId = (await createPhotoFolder(
        folderId,
        folderName
      )) as string;
      const attendanceSheetId = (await createAttendanceSheet(
        folderId,
        folderName
      )) as string;
      const qrCodeId = await createQRCode(folderId, folderName);

      const clubData: Partial<Record<string, any>> = await getClubData(index);
      //add club to metadata spreadsheet given club name, and ids of the spreadsheets

      const metaSheet = await addToMeta(
        folderName,
        folderId,
        photoSheetId,
        attendanceSheetId,
        qrCodeId,
        parentID,
        "Advisor Email",
        clubData["Club Advisor"],
        "President Email",
        clubData["Club President(s)"],
        "Next Meeting",
        clubData["Room"]
      );
      console.log(`Created all drive content for ${folderName}!`);
    } catch (error) {
      res.json(error);
    }
  }

  await createYearFolder();

  res.json({
    message: "Successfully created all club folders for the school year!",
  });
};

const createClubMeta = async (parentID: string, year: number) => {
  // Loads Spreadsheet that contains all the MetaSheets' Id
  const AllMeta = new GoogleSpreadsheet(
    process.env.FOLDER_META_DATA_SPREADSHEET_ID as string,
    serviceAccountAuth
  );
  await AllMeta.loadInfo();
  const AllMetaSheet = AllMeta.sheetsByIndex[0];

  try {
    const spreadsheet = await service.files.create({
      requestBody: {
        name: "Club MetaData",
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [parentID],
      },
      fields: "id",
    });
    const spreadsheetId = spreadsheet.data.id as string;
    const addMetaData = await AllMetaSheet.addRow({
      "Folder Name": `${year.toString()}-${(year + 1).toString()}`,
      "Folder Meta Sheet ID": spreadsheetId,
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();

    const meta_sheet = doc.sheetsByIndex[0];
    await meta_sheet.setHeaderRow([
      "Club Name",
      "Advisor Email",
      "Club Advisor",
      "President Email",
      "Club President",
      "Next Meeting",
      "Room",
      "QR Code",
      "Club Folder ID",
      "Club Spreadsheet",
      "Club Photo Folder ID",
      "Club Code",
    ]);
    await meta_sheet.updateProperties({ title: "userMetaData" });
    await meta_sheet.loadCells("A1:L1"); //maybe

    for (let i = 0; i < 12; i++) {
      const cell = meta_sheet.getCell(0, i); // access cells using a zero-based index
      console.log(cell.value);
      cell.textFormat = { fontFamily: "Times New Roman" };
      await meta_sheet.saveUpdatedCells(); // save all updates in one call
    }
    console.log("Club MetaData Sheet Created!");
    // res.json({ message: 'Club MetaData Sheet Created!' });
    // next();
  } catch (error) {
    console.error(error);
  }
};
