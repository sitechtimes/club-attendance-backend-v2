import { ClubsInAttendance, serviceAccountAuth } from "../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
/**
 * Marks absences in a club attendance sheet.
 * It loads the main attendance sheet, retrieves the club attendance sheets, and updates the absence count for each member who did not sign in on the current date.
 */
export const markAbsence = async () => {
  try {
    console.log("Marking Absences");

    const currentDate = new Date().toLocaleDateString();

    // Load the main attendance sheet
    await ClubsInAttendance.loadInfo();

    const ClubsInAttendanceSheet = ClubsInAttendance.sheetsByIndex[0];
    const ClubsInAttendanceRows = await ClubsInAttendanceSheet.getRows();

    // Process each row in the main attendance sheet
    for (const ClubsInAttendanceRow of ClubsInAttendanceRows) {
      const clubAttendanceSheetId = ClubsInAttendanceRow.get(
        "Club Attendance Sheet"
      );

      // Load the club attendance sheet
      console.log("Loading Club");
      const clubAttendance = new GoogleSpreadsheet(
        clubAttendanceSheetId as string,
        serviceAccountAuth
      );
      await clubAttendance.loadInfo();

      const clubAttendanceSheet = clubAttendance.sheetsByIndex[0];
      const clubAttendanceRows = await clubAttendanceSheet.getRows();

      // Process each row in the club attendance sheet
      for (const clubAttendanceRow of clubAttendanceRows) {
        if (clubAttendanceRow.get("Last Signed In") !== currentDate) {
          console.log("Marking Absence");
          // Increment the absence count for the member
          clubAttendanceRow.set(
            "Absence",
            parseInt(clubAttendanceRow.get("Absence")) + 1
          );
          // Save changes to the club attendance sheet
          await clubAttendanceRow.save();
        }
      }
      // Clears the sheet after updating absence
      await ClubsInAttendanceSheet.clearRows();
    }
  } catch (error) {
    console.error("An error occurred while marking absences:", error);
  }
};
