import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth } from "../../app";
const path = require("path");
const { google } = require("googleapis");
const drive = google.drive("v3");

import { doc } from "../../app";

export const createClubTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

  const service = google.drive({ version: "v3", serviceAccountAuth });
  const folderId = '1MxuYvxnZX86XoeA9IX3XplGrcHPQARJ-'
  const fileMetadata = {
    name: "Invoices",
    mimeType: "application/vnd.google-apps.folder",
    parents: [folderId],
  };

  try {
   
    const file = await service.files.create({
      resource: fileMetadata,
      fields: "id",
    });
    console.log("Folder Id:", file.data.id);
    return file.data.id;
  } catch (error) {
    res.json(error);
  }
};
