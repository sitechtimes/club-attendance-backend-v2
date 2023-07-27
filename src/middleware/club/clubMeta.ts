import { Request, Response, NextFunction } from "express";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { serviceAccountAuth, service } from "../../app";
import { clubMeta } from "../../interface/interface";

export async function getSelectedClub(year: string, clubName: string) {

  let result = await service.files
  .list({
    q: `'${process.env.CLUB_ATTENDANCE_FOLDER_ID}' in parents`,
    fields: "nextPageToken, files(id, name)",
    spaces: "drive",
  })
  .catch((error) => console.log(error));
let folder = result.data.files;
const selectedYearFolder = folder?.filter((folder) => folder.name === year);


const metaSheetData = await service.files.list({
  q: `name = 'Club MetaData' and '${selectedYearFolder[0].id}' in parents`,
  fields: "nextPageToken, files(id, name)",
})

const metaSheetDoc = new GoogleSpreadsheet(
    metaSheetData.data.files[0].id,
    serviceAccountAuth
  );
  await metaSheetDoc.loadInfo();
  const metaSheet = metaSheetDoc.sheetsByIndex[0];
  const rows = await metaSheet.getRows();

  const selectedClub = rows.filter(club => club.get("Club Name") === clubName)[0]

return selectedClub
}

export const getClubMeta = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const year = req.body.year;
  const clubName = req.body.clubName;


try {
    const selectedClub = await getSelectedClub(year, clubName)
      const clubMeta: clubMeta = {
        clubName: selectedClub?.get("Club Name"),
        advisorEmail: selectedClub?.get("Advisor Email"),
        presidentEmail: selectedClub?.get("President Email"),
        nextMeeting: selectedClub?.get("Next Meeting"),
        qrCode: selectedClub?.get("QR Code"),
        clubFolderId: selectedClub?.get("Club Folder ID"),
        clubSpreadsheet: selectedClub?.get("Club Spreadsheet"),
        clubPhotoFolderId: selectedClub?.get("Club Photo Folder ID"),
        clubCode: selectedClub?.get("Club Code")
      }
    
    
      res.json(clubMeta);
} catch (error) {
    res.json(error)
}
};


//can change club meeting as well
export const addClubMeeting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

   try {
    const year = req.body.year;
    const clubName = req.body.clubName;
    const nextMeeting = req.body.nextMeeting;
  
   const selectedClub = await getSelectedClub(year, clubName)

    selectedClub.set("Next Meeting", nextMeeting);

    await selectedClub.save()

    res.json({message: `Successfully added next meeting date as ${selectedClub.get("Next Meeting")}!`})
   } catch (error) {
    res.json(error)
   }
  };
  
  export const deleteClubMeeting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

   try {
    const year = req.body.year;
    const clubName = req.body.clubName;
    // const nextMeeting = req.body.nextMeeting;
  
   const selectedClub = await getSelectedClub(year, clubName)

    selectedClub.set("Next Meeting", "");

    await selectedClub.save()

    res.json({message: `Successfully deleted next meeting date!`})
   } catch (error) {
    res.json(error)
   }
  };
  

