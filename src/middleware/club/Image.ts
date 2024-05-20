import { Request, Response } from "express";
import { service } from "../../app";
import { Readable } from "stream";
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
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { year, clubName } = req.body;
    const photoFolderId = process.env.CLUB_IMAGE_FOLDER_ID as string;

    if (!year || !clubName || !photoFolderId) {
      res.status(400).json("Missing required parameters");
    }

    const files = req.files;

    if (!files || files.length === 0) {
      res.json("No files to upload");
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

    res.status(200).json({ message: "File uploaded successfully!" });
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
    const { year, clubName, fileId } = req.body;

    if (!year || !clubName || !fileId) {
      res.json(400).json("Missing required parameters");
    }
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
      res.status(404).json("Meta Not Found!");
    }

    const getImage = await service.files.get({
      fileId: fileId,
      fields: "id, name, parents, thumbnailLink",
    });

    console.log(getImage.data);
    if (!getImage) {
      return res.status(404).json("No images found!");
    }

    const imageId = getImage.data.id as string;
    const currentParent = getImage.data.parents[0] as string;
    const newParent = metaSheet.get("Club Photo Folder ID") as string;

    // add drive thumbnail link to meta
    metaSheet.set("Club Attendance Photo", getImage.data.thumbnailLink);

    await metaSheet.save();

    await service.files.update({
      fileId: imageId,
      addParents: newParent,
      removeParents: currentParent,
      fields: "id, parents",
    });

    res
      .status(200)
      .json("Image has been approved and has been moved to the new folder");
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
      q: `'${process.env.CLUB_IMAGE_FOLDER_ID}' in parents`,
      fields: "files(id, name, thumbnailLink)",
      spaces: "drive",
    });
    if (images.data.files.length > 0) {
      res.status(200).json(images.data.files);
    } else {
      res.status(204).json("No Images to be Approved");
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

export const unapprovedImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.body;

    if (!imageId) {
      res.status(400).json("Missing required parameters");
    }

    const image = await service.files.delete({
      fileId: imageId,
      fields: "files(id)",
    });

    console.log(image.data);

    res
      .status(200)
      .json("Image has been unapproved and has been deleted from the folder");
  } catch (error) {
    console.log(error);
  }
};
