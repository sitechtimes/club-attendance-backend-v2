import { Request, Response, NextFunction } from "express";
import { service } from "../../app";
import { Readable } from "stream";

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

    console.log("11",  req.files)
  const year = req.body.year
  const clubName = req.body.clubName

  let result = await service.files
    .list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: "nextPageToken, files(id, name)",
      spaces: "drive",
    })
    .catch((error) => console.log(error));
  let folder = result.data.files;
  const selectedFolder = folder?.filter((folder) => folder.name === year);
  const folderId = selectedFolder[0].id;

    //searches in the year folder for the club folder
  const clubResult = await service.files.list({
    q: `name = '${clubName}' and '${folderId}' in parents`,
    fields: "nextPageToken, files(id, name)",
  })




  const selectedClubId = clubResult.data.files[0].id;
  const selectedClubName = clubResult.data.files[0].name;

    //searches in the club folder for the attendance folder
  const selectedClubResult = await service.files.list({
    q: `'${selectedClubId}' in parents`,
    fields: "nextPageToken, files(id, name)",
  })


  const attendanceFolder = selectedClubResult.data.files?.filter((file) => file.name?.includes("Attendence Photos"))


  const attendanceFolderId = attendanceFolder[0].id


  try {
    req.files?.forEach(async (file: any) => {
      console.log(req.file);

      const img = await service.files.create({
        requestBody: {
          name: file.originalname,
          parents: [`${attendanceFolderId}`],
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
