import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from "googleapis";

export const createClubTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("TRIGGERED")
  const folderName = req.body.folderName;
  const folderMetaData = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
  }
  //Folder is being created but it seems like the user doesn't have access (folder id is defined)
  try {
    const folder = await service.files.create({
      resource: folderMetaData,
      fields: 'id',
    })
    const folderId = folder.data.id;
    //You can also set this to viewable by everyone or viewable to everyone in the organization in production
    const permissions = {
      role: 'writer',
      type: 'user',
      emailAddress: 'zhenghenry2@gmail.com',
    }
    await service.permissions.create({
      fileId: folderId,
      requestBody: permissions
    })
    res.json(`Created google drive folder with id ${folderId} and shared successfully.`);
  } catch (error) {
    console.error(error);
  }
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