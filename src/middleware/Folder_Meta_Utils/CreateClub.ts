import { service } from "../../app";
import QRCode from "qrcode";
import fs from "fs";
import { Readable } from "stream";

/**
 * Creates three folders in Google Drive: a main club folder, a spreadsheet folder, and a photo folder.
 * @param parentId - The ID of the parent folder where the club folders will be created.
 * @param clubName - The name of the club, which will be used as the name for the folders.
 * @returns An object containing the IDs of the created folders and the QR code.
 */
export const createClubFolders = async (parentId: string, clubName: string) => {
  try {
    // Create the main club folder
    const clubFolder = await service.files.create({
      requestBody: {
        name: clubName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id",
    });

    // Create the spreadsheet folder inside the main club folder
    const clubSheet = await service.files.create({
      requestBody: {
        name: clubName,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [clubFolder.data.id as string],
      },
      fields: "id",
    });

    // Create the photo folder inside the main club folder
    const clubPhotoFolder = await service.files.create({
      requestBody: {
        name: clubName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [clubFolder.data.id as string],
      },
      fields: "id",
    });

    // Generate QR code
    const qrCode = await createQRCode(clubFolder.data.id as string, clubName);

    // Return the IDs of the created folders and the QR code
    return {
      clubFolderId: clubFolder.data.id,
      clubSheetId: clubSheet.data.id,
      clubPhotoFolderId: clubPhotoFolder.data.id,
      qrCodeId: qrCode,
    };
  } catch (error) {
    console.error("Error creating club folders:", error);
    throw error;
  }
};

/**
 * Generates a QR code image and saves it to a Google Drive folder.
 * @param parentID - The ID of the parent folder in Google Drive.
 * @param folderName - The name of the folder.
 * @returns The ID of the uploaded file in Google Drive.
 */
async function createQRCode(parentID: string, folderName: string) {
  try {
    const trimFolderName = folderName.replace(/ /g, "_");
    console.log(trimFolderName);

    const link = `https://www.test.com/${trimFolderName}`;
    const qrcode = await QRCode.toFile(`src/imgs/${trimFolderName}.png`, link, {
      type: "png",
    });
    console.log("this is the qrcode:", qrcode);

    const buffer = fs.readFileSync(`src/imgs/${trimFolderName}.png`);

    const file = await service.files.create({
      requestBody: {
        name: `${folderName} QR Code`,
        parents: [parentID],
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
    throw error;
  }
}
