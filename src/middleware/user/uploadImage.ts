import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { Readable } from "stream";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { iam } from "googleapis/build/src/apis/iam";

// const service = google.drive({ version: 'v3', auth: serviceAccountAuth});
const verifyAuthority = async (uuid: string) => {
  const userSheetID = process.env.USER_DATA_SPREADSHEET_ID as string;
  const user = new GoogleSpreadsheet(userSheetID, serviceAccountAuth);

  await user.loadInfo();

  const userSheet = user.sheetsByIndex[0];
  const userRow = await userSheet.getRows();
  const userRowLen: number = userSheet.rowCount;

  console.log("finding user");
  for (let i = 0; i < userRowLen; i++) {
    if (userRow[i] === undefined) {
      break;
    }
    if (userRow[i].get("UID") === uuid) {
      if (userRow[i].get("Client Authority") === "Club President") {
        console.log(userRow[i].get("Client Authority"));
        return true;
      } else {
        return false;
      }
    }
  }
};

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const year: string = req.body.year;
  const clubName: string = req.body.clubName;
  const uuid: string = req.body.uuid;

  const Authority = await verifyAuthority(uuid);
  /* let result = await service.files
    .list({
      q: `'${process.env.CLUB_ATTENDANCE_FOLDER_ID}' in parents`,
      fields: "nextPageToken, files(id, name)",
      spaces: "drive",
    })
    .catch((error) => console.log(error));
  let folder = result.data.files;
  const selectedYearFolder = folder?.filter((folder) => folder.name === year);
  const folderId = selectedYearFolder![0].id;
  console.log(folderId, "line 25");

  const metaSheet = await service.files.list({
    q: `name = 'Club MetaData' and '${folderId}' in parents`,
    fields: "nextPageToken, files(id, name)",
  });

  console.log(metaSheet.data.files, "meta");

  const metaSheetId = metaSheet.data.files![0].id;

  const metaDataSpreadSheet = new GoogleSpreadsheet(
    metaSheetId as string,
    serviceAccountAuth
  );
  await metaDataSpreadSheet.loadInfo();
  const metaDataSheet = metaDataSpreadSheet.sheetsByIndex[0];
  const rows = await metaDataSheet.getRows();

  const selectedClub = rows.find((row) => row._rawData[0] === clubName);

  console.log(selectedClub, "rows");

  const photoFolderId = selectedClub?.get("Club Photo Folder ID"); */

  const photoFolderId = process.env.CLUB_IMAGE_FOLDER_ID as string;

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
    if (Authority !== true) {
      res.json("User's does not have the authority to upload image");
    }
    if (Authority === true) {
      console.log(req.files);
      console.log(photoFolderId);
      req.files?.forEach(async (file: any) => {
        console.log(req.file);

        const img = await service.files.create({
          requestBody: {
            name: req.body.clubName,
            parents: [photoFolderId],
          },
          media: {
            mimeType: file.mimetype,
            body: Readable.from([file.buffer]),
          },
          fields: "id",
        });

        console.log("File Id:", img.data.id);
      });
      res.json({ message: "File uploaded successfully!" });
    }

    // return file.data.id;
  } catch (err) {
    res.json(err);
  }
};

export const approveImage = async (req: Request, res: Response) => {
  const uuid = req.body.uuid;
  const year = req.body.year;
  const clubName = req.body.clubName;

  const yearSheet = new GoogleSpreadsheet(
    process.env.FOLDER_META_DATA_SPREADSHEET_ID as string,
    serviceAccountAuth
  );

  await yearSheet.loadInfo();
  const yearMeta = yearSheet.sheetsByIndex[0];
  const yearRows = await yearMeta.getRows();
  const yearRowLen = yearMeta.rowCount;

  const getClubMeta = () => {
    for (let i = 0; i < yearRowLen; i++) {
      if (yearRows[i] === undefined) {
        break;
      } else if (yearRows[i].get("Folder Name") === year) {
        return yearRows[i].get("Folder Meta Sheet ID");
      }
    }
  };

  const clubMetaSheet = new GoogleSpreadsheet(
    getClubMeta.toString(),
    serviceAccountAuth
  );

  await clubMetaSheet.loadInfo();

  const clubMeta = clubMetaSheet.sheetsByIndex[0];
  const clubRows = await clubMeta.getRows();
  const clubRowLen = clubMeta.rowCount;

  const getClub = () => {
    for (let i = 0; i < clubRowLen; i++) {
      if (clubRows[i] === undefined) {
        break;
      } else if (clubRows[i].get("Club Name") === clubName) {
        return clubRows[i].get("Club Photo Folder ID");
      }
    }
  };

  try {
    res.json("working");
    const imgId = await service.files.list({
      q: `name = '${clubName}'`,
      fields: " files(id, name)",
      spaces: "drive",
    });

    res.json(imgId.data.files);

    const deleteImg = await service.files.delete({
      fileId: `${imgId.data.files[0].id}`,
    });

    console.log(deleteImg);

    req.files?.forEach(async (file: any) => {
      const image = await service.files.create({
        requestBody: {
          name: req.body.clubName,
          parents: [getClub.toString()],
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from([file.buffer]),
        },
        fields: "id",
      });

      console.log(image.data.id);
    });

    res.json("Image has been approved");
  } catch (error) {
    res.json(error);
  }
};
