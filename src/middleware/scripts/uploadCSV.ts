import { service } from "../../app";
import { Request, Response } from "express";
import { Readable } from "stream";

/**
 * Uploads a CSV file to Google Drive and converts it to a Google Spreadsheet.
 * @param req - The request object from Express.js.
 * @param res - The response object from Express.js.
 */
export const uploadCSV = async (csv: any) => {
  try {
    console.log(csv);
    const currentYear = new Date().getFullYear();
    const folderName = `${currentYear}-${currentYear + 1} CSV`;
    // Upload the CSV file to Google Drive
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.spreadsheet",
    };
    const media = {
      mimeType: "text/csv",
      body: Readable.from([csv.buffer]),
    };

    const response = await service.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = response.data.id;

    // Convert the uploaded CSV file to Google Spreadsheet
    await service.files.update({
      addParents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
      fileId: `${fileId}`,
    });

    return fileId;
  } catch (error) {
    console.error("Error converting CSV file to Google Spreadsheet:", error);
  }
};
