import { service } from "../../app";
import { Readable } from "stream";

/**
 * Uploads a CSV file to Google Drive and converts it to a Google Spreadsheet.
 * @param csv - The CSV file to be uploaded.
 * @returns {Promise<string>} - The ID of the uploaded Google Spreadsheet.
 */
export const uploadCSV = async (csv: any): Promise<string> => {
  try {
    const folderName = `${new Date().getFullYear()}-${
      new Date().getFullYear() + 1
    } CSV`;

    // Upload the CSV file to Google Drive and convert it to Google Spreadsheet
    const response = await service.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
      media: {
        mimeType: "text/csv",
        body: Readable.from([csv.buffer]),
      },
      fields: "id",
    });

    const fileId = response.data.id;

    // Add the uploaded Google Spreadsheet to the specified folder
    await service.files.update({
      addParents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
      fileId: fileId,
    });

    return fileId;
  } catch (error) {
    console.error("Error uploading and converting CSV file:", error);
    throw error;
  }
};
