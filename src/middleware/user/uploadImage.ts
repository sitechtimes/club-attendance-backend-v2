import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { Readable } from "stream";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { verifyAuthority } from "./verification";

// const service = google.drive({ version: 'v3', auth: serviceAccountAuth});
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const year: string = req.body.year;
  const clubName: string = req.body.clubName;
  const uuid: string = req.body.uuid;
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

    // return file.data.id;
  } catch (err) {
    res.json(err);
  }
};

export const approveImage = async (req: Request, res: Response) => {
  const uuid = req.body.uuid;
  const year = req.body.year;
  const clubName = req.body.clubName;

  const Authority = await verifyAuthority(uuid);

  const getClubMeta = async () => {
    const yearSheet = new GoogleSpreadsheet(
      process.env.FOLDER_META_DATA_SPREADSHEET_ID as string,
      serviceAccountAuth
    );

    await yearSheet.loadInfo();

    const yearMeta = yearSheet.sheetsByIndex[0];
    const yearRows = await yearMeta.getRows();
    const yearRowLen: number = yearMeta.rowCount;

    for (let i = 0; i < yearRowLen; i++) {
      if (yearRows[i] === undefined) {
        break;
      } else if (yearRows[i].get("Folder Name") === year) {
        return yearRows[i].get("Meta Sheet ID");
      }
    }
  };
  console.log(await getClubMeta());

  const getClub = async () => {
    const clubMetaSheet = new GoogleSpreadsheet(
      await getClubMeta(),
      serviceAccountAuth
    );

    await clubMetaSheet.loadInfo();

    const clubMeta = clubMetaSheet.sheetsByIndex[0];
    const clubRows = await clubMeta.getRows();
    const clubRowLen = clubMeta.rowCount;
    for (let i = 0; i < clubRowLen; i++) {
      if (clubRows[i] === undefined) {
        break;
      } else if (clubRows[i].get("Club Name") === clubName) {
        return clubRows[i].get("Club Photo Folder ID");
      }
    }
  };
  console.log(await getClub());

  try {
    if (Authority === "Admin") {
      const listImgs = await service.files.list({
        q: `name = '${clubName}' and '${process.env.CLUB_IMAGE_FOLDER_ID}' in parents`,
        fields: " files(id, name)",
        spaces: "drive",
      });

      const imgId = listImgs.data.files?.filter((img) => {
        console.log(img);
        if (img.name === clubName) {
          return img;
        }
      });
      /* console.log(imgId![0].id); */
      const deleteImg = await service.files.delete({
        fileId: `${imgId[0].id}`,
      });
      const clubFolderId = await getClub();
      req.files?.forEach(async (file: any) => {
        const image = await service.files.create({
          requestBody: {
            name: req.body.clubName,
            parents: [clubFolderId],
          },
          media: {
            mimeType: file.mimetype,
            body: Readable.from([file.buffer]),
          },
          fields: "id",
        });

        console.log(image.data.id);
      });
      console.log("uploading image to club folder");
      res.json("Image has been approved");
    } else {
      res.json("User doesn't have the required authority");
    }
  } catch (error) {
    console.log(error);
  }
};

export const getImage = async (req: Request, res: Response) => {
  const uuid = req.body.uuid;
  const year = req.body.year;

  try {
    const images = await service.files.list({
      q: `'${process.env.CLUB_IMAGE_FOLDER_ID}' in parents`,
      fields: " files(id, name, webViewLink)",
      spaces: "drive",
    });

    res.json(images.data.files);
  } catch (error) {
    res.json(error);
  }
};
