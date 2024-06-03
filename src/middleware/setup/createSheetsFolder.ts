import {
  createUserSheet,
  createClubsInAttendanceSheet,
  createMasterAttendanceSheet,
  createFolderMeta,
} from "./createClubSheets";
import { createClubImageFolder } from "./createFolders";

const createSheetsFolders = async () => {
  try {
    const userSheetId = await createUserSheet();
    const clubsInAttendanceSheetId = await createClubsInAttendanceSheet();
    const masterAttendanceSheetId = await createMasterAttendanceSheet();
    const folderMetaSheetId = await createFolderMeta();

    const createClubImageFolderId = await createClubImageFolder();
    console.log(
      `
      USER_DATA_SPREADSHEET_ID=${userSheetId}
      MASTER_ATTENDANCE_SHEET=${masterAttendanceSheetId}
      FOLDER_META_DATA_SPREADSHEET_ID=${folderMetaSheetId}
      CLUBS_IN_ATTENDANCE=${clubsInAttendanceSheetId}

      CLUB_IMAGE_FOLDER_ID=${createClubImageFolderId}
      `
    );

    return true;
  } catch (error) {
    console.log(error);
  }
};

createSheetsFolders();
