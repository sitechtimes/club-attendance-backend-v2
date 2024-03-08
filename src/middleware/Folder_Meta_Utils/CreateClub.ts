import { allMeta, service, serviceAccountAuth } from "../../app";
import QRCode from "qrcode";
import fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { uploadCSV } from "../scripts/uploadCSV";

/**
 * Creates a new folder in Google Drive with the name of the current year and the next year.
 *
 * @param req - The request object containing information about the HTTP request.
 * @param res - The response object used to send a response back to the client.
 */
export const createYearAttendanceFolder = async (
  req: Request,
  res: Response
) => {
  try {
    const csvAvailable = async () => {
      if (req.file) {
        return await uploadCSV(req.file);
      }
    };

    const csvFileId = await csvAvailable();

    const currentYear = new Date().getFullYear();
    const folderName = `${currentYear}-${currentYear + 1}`;
    /* let metaData: any[] = []; */

    // Create this year's attendance folder
    const createYearFolder = await service.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID as string],
      },
      fields: "id",
    });
    console.log("created year folder", createYearFolder.data);
    // Create meta sheet for this year
    const thisYearMeta = await createMetaSheet(
      createYearFolder.data.id as string
    );
    console.log("created meta sheet", thisYearMeta);

    const getThisYearMeta = new GoogleSpreadsheet(
      thisYearMeta as string,
      serviceAccountAuth
    );
    await getThisYearMeta.loadInfo();

    const thisYearMetasheet = getThisYearMeta.sheetsByIndex[0];

    await allMeta.loadInfo();

    const allMetaSheet = allMeta.sheetsByIndex[0];
    await allMetaSheet.addRow({
      "Folder Name": folderName,
      "Meta Sheet ID": `${thisYearMeta}`,
      "Folder Id": `${createYearFolder.data.id}`,
    });
    console.log("added to all meta sheet");
    // Get club data sheet
    const clubDataSpreadSheetId = csvFileId
      ? csvFileId
      : (process.env.CLUB_DATA_SPREADSHEET_ID as string);

    const getClubSheet = new GoogleSpreadsheet(
      clubDataSpreadSheetId,
      serviceAccountAuth
    );
    await getClubSheet.loadInfo();

    const clubSheet = getClubSheet.sheetsByIndex[0];
    const clubSheetRows = await clubSheet.getRows();

    /**
     * Iterates over a list of clubs and creates a folder for each club.
     * Adds metadata for each club to an array.
     *
     * @param index - The starting index of the club list.
     * @param length - The length of the club list.
     * @returns {Promise<void>}
     */
    const addClubs = async (index: number, length: number) => {
      if (index >= length) {
        return;
      }

      const clubName = clubSheetRows[index].get("Club Name");
      const clubAdvisor = clubSheetRows[index].get("Club Advisor");
      const clubPresident = clubSheetRows[index].get("Club President(s)");
      const room = clubSheetRows[index].get("Room");
      const clubFolderId = await createClubFolders(
        createYearFolder.data.id as string,
        clubName
      );

      const data = {
        "Club Data": {
          clubName: clubName,
          advisor: {
            name: clubAdvisor,
            email: "advisor@email.com",
          },
          president: {
            name: clubPresident,
            email: "president@email.com",
          },
          nextMeeting: "No Scheduled Meeting",
          room: room,
        },
        "Meta Data ID": clubFolderId,
      };

      await thisYearMetasheet.addRow({
        "Club Name": data["Club Data"].clubName,
        "Advisor Email": data["Club Data"].advisor.email,
        "Club Advisor": data["Club Data"].advisor.name,
        "President Email": data["Club Data"].president.email,
        "Club President": data["Club Data"].president.name,
        "Next Meeting": "No Scheduled Meeting",
        Room: data["Club Data"].room,
        "QR Code": data["Meta Data ID"].qrCodeId as any,
        "Club Folder ID": data["Meta Data ID"].clubFolderId as any,
        "Club Spreadsheet": data["Meta Data ID"].clubSheetId as any,
        "Club Photo Folder ID": data["Meta Data ID"].clubPhotoFolderId as any,
        "Club Code": uuidv4(),
        "Club Attendance Photo": "No Photo Available",
      });
      console.log(data);

      setTimeout(async () => {
        await addClubs(index + 1, length);
      }, 3000); // Delay of 3 seconds so that we don't exceed quota limit for google api
    };

    await addClubs(0, clubSheetRows.length);
    // didn't test this part yet but probably works
    // Specify the path to the folder containing the files you want to delete
    const folderPath = "src/imgs";

    // Call the function to delete files in the folder
    await deleteFilesInFolder(folderPath);

    res
      .status(200)
      .json(
        "All Club Folders Created Successfully, Cleaned Up the Image Folder!"
      );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

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

    // Load the information of the created spreadsheet
    const getClubSheet = new GoogleSpreadsheet(
      clubSheet.data.id as string,
      serviceAccountAuth
    );
    await getClubSheet.loadInfo();

    // Set the header row of the spreadsheet
    const sheet = getClubSheet.sheetsByIndex[0];
    await sheet.setHeaderRow([
      "UID",
      "First Name",
      "Last Name",
      "Email",
      "Position",
      "Official Class",
      "# of Attedance",
      "Date Joined",
      "Last Signed In",
      "Absence",
    ]);
    // formate the header to bold

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
 * Adds metadata information to a 2D array.
 * @param meta - An array containing metadata information.
//  */
// async function addMeta(meta: any[][]) {
//   const metaSheet = allMeta.sheetsByIndex[0];
//   // Iterate over each subarray in meta
//   for (const subarray of meta) {
//     // Push the subarray to the array
//     await metaSheet.addRow(subarray);
//   }
// }

/**
 * Creates a new Google Spreadsheet and sets the header row with specific column names.
 * @returns The ID of the newly created Google Spreadsheet.
 * @throws If there is an error creating the metadata sheet.
 */
async function createMetaSheet(parentId: string) {
  try {
    // Create a new Google Spreadsheet
    const newMetaSheet = await service.files.create({
      requestBody: {
        name: "Club MetaData",
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [parentId],
      },
      fields: "id",
    });

    // Create a new instance of GoogleSpreadsheet
    const getMeta = new GoogleSpreadsheet(
      newMetaSheet.data.id as string,
      serviceAccountAuth
    );

    // Load the information of the spreadsheet
    await getMeta.loadInfo();

    // Get the first sheet of the spreadsheet
    const meta_sheet = getMeta.sheetsByIndex[0];

    // Set the header row with specific column names
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

    // Return the ID of the newly created spreadsheet
    return newMetaSheet.data.id as string;
  } catch (error) {
    console.error("Error creating metadata sheet:", error);
    throw error;
  }
}

/**
 *
 * Generates a QR code image and saves it to a Google Drive folder.
 * @param parentID - The ID of the parent folder in Google Drive.
 * @param folderName - The name of the folder.
 * @returns The ID of the uploaded file in Google Drive.
 */
async function createQRCode(parentID: string, folderName: string) {
  try {
    const trimFolderName = folderName.replace(/[\/\s]/g, "_");

    console.log(trimFolderName);

    const link = `https://localhost:5173/?club=${trimFolderName}`;
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
      fields: "id,thumbnailLink",
    });
    console.log({
      "File Id:": file.data.id,
      "QRCode Link": link,
      "Web View Link": file.data.thumbnailLink,
    });

    // update files so that the qr code can be viewed by anyone with link

    const updatePermission = await service.permissions.create({
      fileId: file.data.id as string,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    console.log(
      `Permissions of the qr code has been updated. File ID: ${updatePermission.data.id}`
    );

    return file.data.thumbnailLink;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Deletes all files in a specified folder.
 * @param folderPath - The path to the folder containing the files to be deleted.
 */
async function deleteFilesInFolder(folderPath: string) {
  try {
    // Get the list of files in the folder
    const files = fs.readdirSync(folderPath);

    // Iterate through the files and delete them
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);

      // Check if it's a file (not a subdirectory)
      if (fs.statSync(filePath).isFile()) {
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      }
    });

    console.log("All files deleted successfully.");
  } catch (err) {
    console.error(`Error deleting files: ${err}`);
  }
}
