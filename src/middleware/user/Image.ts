import { google } from "googleapis";
import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { Readable } from "stream";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { verifyAuthority } from "./verification";
import {
  findMeta_ParentFolder,
  getMetaSheet,
} from "../Folder_Meta_Utils/FindMeta_ParentFolder";

/**
 * Handles the uploading of images to a Google Drive folder.
 * @param req The HTTP request object containing the file(s) to be uploaded and the required parameters (`year` and `clubName`).
 * @param res The HTTP response object used to send a JSON response indicating the success of the upload.
 * @param next The next middleware function in the request-response cycle.
 */
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, clubName } = req.body;
    const photoFolderId = process.env.UNAPPROVED_CLUB_IMAGE_FOLDER as string;

    if (!year || !clubName || !photoFolderId) {
      throw new Error("Missing required parameters");
    }

    const files = req.files;

    if (!files || files.length === 0) {
      throw new Error("No files to upload");
    }

    const uploadPromises = files.map(async (file: any) => {
      const response = await service.files.create({
        requestBody: {
          name: clubName,
          parents: [photoFolderId],
          appProperties: {
            year: year,
          },
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from([file.buffer]),
        },
        fields: "id",
      });

      console.log("File Id:", response.data.id);
    });

    await Promise.all(uploadPromises);

    res.json({ message: "File uploaded successfully!" });
  } catch (err) {
    res.json(err);
  }
};

/**
 * Moves an approved image to a specific folder in Google Drive.
 * @param req - The request object containing the year and club name in the request body.
 * @param res - The response object used to send the result of the function.
 */
export const approveImage = async (req: Request, res: Response) => {
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
      return res.json("Meta Not Found!");
    }

    const query = `name = '${clubName}' and '${process.env.UNAPPROVED_CLUB_IMAGE_FOLDER}' in parents and appProperties has { key='year' and value='${year}' }`;

    const listImgs = await service.files.list({
      q: query,
      fields: "files(id, name, parents)",
      spaces: "drive",
    });

    if (listImgs.data.files.length === 0) {
      return res.json("No images found!");
    }

    const imageId = listImgs.data.files[0].id as string;
    const currentParent = listImgs.data.files[0].parents[0] as string;
    const newParent = metaSheet.get("Club Photo Folder ID") as string;

    const changeParentFolder = await service.files.update({
      fileId: imageId,
      addParents: newParent,
      removeParents: currentParent,
      fields: "id, parents",
    });

    res.json(
      `Moved Approved Image ${changeParentFolder.data.id} to ${changeParentFolder.data.parents[0]}`
    );
  } catch (error) {
    console.log(error);
  }
};
/**
 * Retrieves a list of unapproved images from a Google Drive folder and sends the data as a JSON response.
 * @param req - The request object from Express.
 * @param res - The response object from Express.
 */
export const getUnapprovedImage = async (req: Request, res: Response) => {
  try {
    const images = await service.files.list({
      q: `'${process.env.UNAPPROVED_CLUB_IMAGE_FOLDER}' in parents`,
      fields: " files(id, name, webViewLink)",
      spaces: "drive",
    });

    res.json(images.data.files);
  } catch (error) {
    res.json(error);
  }
};
