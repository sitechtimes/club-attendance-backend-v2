import { serviceAccountAuth } from "../app";
import { GoogleSpreadsheet } from "google-spreadsheet";

export const clearMasterAttendance = async () => {
  try {
    const masterAttendance = new GoogleSpreadsheet(
      process.env.MASTER_ATTENDANCE_SHEET as string,
      serviceAccountAuth
    );

    await masterAttendance.loadInfo();

    const masterAttendanceSheet = masterAttendance.sheetsByIndex[0];

    await masterAttendanceSheet.clearRows();

    console.log("Cleared Master Attendance Sheet");
  } catch (error) {
    console.log(error);
  }
};
