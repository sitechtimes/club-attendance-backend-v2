import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
const { google } = require("googleapis");

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
  console.log(process.env.CLUB_ATTENDANCE_FOLDER_ID)
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
