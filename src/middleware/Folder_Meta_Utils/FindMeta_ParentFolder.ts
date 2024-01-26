import { GoogleSpreadsheet } from "google-spreadsheet";
import { allMeta, serviceAccountAuth } from "../../app";

/**
 * Searches for a row in a Google Spreadsheet containing folder metadata based on a given year.
 * @param year - The year for which the metadata needs to be found.
 * @returns False if the requested year metadata is not found.
 */
export const findMeta_ParentFolder = async (year: string) => {
  try {
    // Find the row in the metadata sheet that corresponds to the requested year
    const allMetaSheet = allMeta.sheetsByIndex[0];
    const allMetaRows = await allMetaSheet.getRows();

    // Get the metadata sheet ID for the requested year
    const yearMetaRow = allMetaRows.find(
      (row) => row.get("Folder Name") === year
    );

    // If the requested year metadata is not found, return false
    if (!yearMetaRow) {
      return false;
    }

    const yearMetaParentId = yearMetaRow.toObject();

    return yearMetaParentId;
  } catch (error) {
    console.error("Error finding metadata:", error);
    throw error;
  }
};

/**
 * Retrieves metadata from a Google Spreadsheet.
 * @param metaSheetId - The ID of the Google Spreadsheet containing the club metadata.
 * @param club - The name of the club to retrieve metadata for. If `null`, the entire metadata sheet is returned.
 * @returns If `club` is `null`, the function returns the entire metadata sheet. If `club` is provided and a matching row is found, the function returns the row object. If `club` is provided but no matching row is found, the function returns `false`.
 */
export const getMetaSheet = async (
  metaSheetId: string,
  club: string | null
) => {
  try {
    // Load the Google Spreadsheet containing the club metadata for the requested year
    const thisYearMeta = new GoogleSpreadsheet(
      metaSheetId as string,
      serviceAccountAuth
    );
    await thisYearMeta.loadInfo();

    // Find the row in the club metadata sheet that corresponds to the requested club name
    const thisYearMetaSheet = thisYearMeta.sheetsByIndex[0];

    if (club === null) {
      return thisYearMetaSheet;
    } else if (club) {
      const thisYearMetaRows = await thisYearMetaSheet.getRows();
      // Get the selected club's information
      const selectedRow = thisYearMetaRows.find(
        (row) => row.get("Club Name") === club
      );

      // If the requested club metadata is not found, return false
      if (!selectedRow) {
        return false;
      }

      return selectedRow;
    }
  } catch (error) {
    console.error("Error retrieving metadata:", error);
    throw error;
  }
};
