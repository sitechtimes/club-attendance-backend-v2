import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { Readable } from "stream";
import { google } from "googleapis";
import { GoogleSpreadsheet } from 'google-spreadsheet';

// const service = google.drive({ version: 'v3', auth: serviceAccountAuth});


export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

    console.log("11",  req.body.year)
  const year: string = req.body.year
  const clubName: string = req.body.clubName

  let result = await service.files
    .list({
      q: `'${process.env.CLUB_ATTENDANCE_FOLDER_ID}' in parents`,
      fields: "nextPageToken, files(id, name)",
      spaces: "drive",
    })
    .catch((error) => console.log(error));
  let folder = result.data.files;
  const selectedYearFolder = folder?.filter((folder) => folder.name === year);
  const folderId = selectedYearFolder![0].id;
  console.log(folderId, "line 25")


  const metaSheet = await service.files.list({
    q: `name = 'Club MetaData' and '${folderId}' in parents`,
    fields: "nextPageToken, files(id, name)",
  })

  console.log(metaSheet.data.files, "meta")

  const metaSheetId = metaSheet.data.files![0].id

  const metaDataSpreadSheet = new GoogleSpreadsheet(metaSheetId as string, serviceAccountAuth);
  await metaDataSpreadSheet.loadInfo();
  const metaDataSheet = metaDataSpreadSheet.sheetsByIndex[0];
  const rows = await metaDataSheet.getRows()

  const selectedClub = rows.find(row => row._rawData[0] === clubName)

  console.log(selectedClub, "rows")

  const photoFolderId = selectedClub?.get("Club Photo Folder ID")




  // const selectedClubId = clubResult.data.files[0].id;
  // const selectedClubName = clubResult.data.files[0].name;

  //   //searches in the club folder for the attendance folder
  // const selectedClubResult = await service.files.list({
  //   q: `'${selectedClubId}' in parents`,
  //   fields: "nextPageToken, files(id, name)",
  // })


  // const attendanceFolder = selectedClubResult.data.files?.filter((file) => file.name?.includes("Attendance Photos"))


  // const attendanceFolderId = attendanceFolder[0].id


  

  try {
    console.log(req.files, "line 75")
    req.files?.forEach(async (file: any) => {
      console.log(req.file);

      const img = await service.files.create({
        requestBody: {
          name: file.originalname,
          parents: [`${photoFolderId}`],
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from([file.buffer]),
        },
      });
      console.log("File Id:", img.data.id);
    })
    // return file.data.id;
    res.json({ message: "File uploaded successfully!" });
  } catch (err) {
    res.json(err);
  }
};
