import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
const { google } = require("googleapis");
import { GoogleSpreadsheet } from "google-spreadsheet";
const fs = require("fs");

export const createClubTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const folderName = "club 411";
  console.log(folderName);
  const folderMetaData = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
  };

  const permissions = {
    role: "writer",
    type: "user",
    emailAddress: "harveyjiang11@gmail.com",
  };



  async function createSheets(parentID: String) {
    const sheetsRequestBody = {
      name: "sheets20",
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentID],
    };

    const sheetsFolder = await service.files.create({
      resource: sheetsRequestBody,
      fields: "id",
    });

    const sheetsFileId = sheetsFolder.data.id;

    await service.permissions.create({
      fileId: sheetsFileId,
      requestBody: permissions,
    });
  }

  async function createClubFolder() {
    const folder = await service.files.create({
      resource: folderMetaData,
      fields: "id",
    });

    const folderId = folder.data.id;

    //You can also set this to viewable by everyone or viewable to everyone in the organization in production

    await service.permissions.create({
      fileId: folderId,
      requestBody: permissions,
    });

    createSheets(folderId);
  }

  console.log(process.env.CLUB_ATTENDANCE_FOLDER_ID);
  //Folder is being created but it seems like the user doesn't have access (folder id is defined)
  try {
    createClubFolder()

    res.json(`Created google drive folder with id and shared successfully.`);
  } catch (error) {
    console.error(error);
  }
};
