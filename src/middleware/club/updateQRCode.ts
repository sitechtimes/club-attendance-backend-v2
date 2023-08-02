import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import uniqid from "uniqid";
import QRCode from "qrcode";
import fs from "fs";
import { Readable } from "stream";

interface metaData {
  club_name: string;
  club_parent_id: string;
  qrcode_id: string;
  index: number;
}

export const updateQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clubName: string = req.body.club_name;

  const genID = uniqid();

  const metaArr: metaData[] = [];

  const metaDataSheetID: string =
    "1MTpouiXD8gVt4nYxPqlBlTa_54XXJ3gup3WKMcTFK8A";
  const metaDoc = new GoogleSpreadsheet(metaDataSheetID, serviceAccountAuth);

  await metaDoc.loadInfo();

  const metaSheet = metaDoc.sheetsByIndex[0];
  const metaRows = await metaSheet.getRows();
  const metaSheetLen: number = metaSheet.rowCount;

  async function findClassID(clubName: string) {
    for (let i = 0; i < metaSheetLen; i++) {
      if (metaRows[i] === undefined) {
        break;
      } else {
        const data: metaData = {
          club_name: metaRows[i].get("Club Name"),
          club_parent_id: metaRows[i].get("Club Folder ID"),
          qrcode_id: metaRows[i].get("QR Code"),
          index: i,
        };

        metaArr.push(data);

        // console.log(user_rows[i].get("UID"))
      }
    }

    const ID = metaArr.filter((el) => el.club_name === clubName);

    return ID;
  }

  async function updateQRCode(folderName: string) {
    try {
      const classIDS = await findClassID(folderName);
      const qrcodeID = classIDS[0].qrcode_id;
      const qrfile = await service.files.delete({
        fileId: qrcodeID,
      });

      const trimFolderName = folderName.replace(/ /g, "_");
      console.log(trimFolderName);
      const link = `https://www.test.com/${trimFolderName}?id=${genID}`;
      const qrcode = await QRCode.toFile(`${trimFolderName}.png`, link, {
        type: "png",
      });

      const buffer = fs.readFileSync(`${trimFolderName}.png`);

      //Johnson please save the qrcode to the drive, the parent ID is here
      const file = await service.files.create({
        requestBody: {
          name: `${folderName} QR Code`,
          parents: [`${classIDS[0].club_parent_id}`],
        },
        media: {
          mimeType: "image/png",
          body: Readable.from([buffer]),
        },
      });

      metaRows[classIDS[0].index].set("QR Code", file.data.id);
      await metaRows[classIDS[0].index].save();

      console.log("File Id:", file.data.id);
    } catch (error) {
      console.error(error);
    }
  }

  try {
    await updateQRCode(clubName);

    res.json(genID);
  } catch (error) {}
};
