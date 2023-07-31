import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet, GoogleSpreadsheetCell } from "google-spreadsheet";
import { google } from "googleapis";
import uniqid from 'uniqid';
import { clubNameDoc } from "../../app";
import QRCode, { create } from "qrcode";
import { upload } from "../user/multer";
import { cloudbuild } from "googleapis/build/src/apis/cloudbuild";
import fs from "fs";
import { Readable } from 'stream'

interface metaData {
    club_name: string;
    club_parent_id: string;
  }

export const updateQRCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => { 


    const metaArr: metaData[] = [];
    const genID = uniqid()
    const userSpreadSheetID: any = process.env.USER_DATA_SPREADSHEET_ID;
    const metaDataSheetID: string =
      "1vCC8ercuyn8ayszYSYEtpHFs0lxkLhxn0rF_IMyTU5E";

    async function findClassID(clubName: string) {
        const metaDoc = new GoogleSpreadsheet(metaDataSheetID, serviceAccountAuth);
    
        await metaDoc.loadInfo();
      
        const metaSheet = metaDoc.sheetsByIndex[0];
        const metaRows = await metaSheet.getRows();
        const metaSheetLen: number = metaSheet.rowCount;
    
        for (let i = 0; i < metaSheetLen; i++) {
          if (metaRows[i] === undefined) {
            break;
          } else {
        
          const data: metaData = {
              
              club_name: metaRows[i].get("Club Name"),
              club_parent_id: metaRows[i].get("Club Folder ID"),
            };
    
            metaArr.push(data);
    
            // console.log(user_rows[i].get("UID"))
          }
        }
    
        const ID = metaArr.filter(el => el.club_name === clubName );
    
        return ID
      }
    

    
  async function createQRCode(parentID: string, folderName: string) {
    try {
      const trimFolderName = folderName.replace(/ /g, "_");
      console.log(trimFolderName)
      const link = `https://www.test.com/${trimFolderName}?id=${genID}`;
      const qrcode = await QRCode.toFile( `./imgs/${trimFolderName}.png`, link, { type: "png"})

      const buffer = fs.readFileSync(`./imgs/${trimFolderName}.png`);

      //Johnson please save the qrcode to the drive, the parent ID is here 
      const file = await service.files.create({
        requestBody: {
            name: `${folderName} QR Code`,
            parents: [`${parentID}`],
          },
          media: {
            mimeType: "image/png",
            body: Readable.from([buffer]),
          },
    });
      console.log('File Id:', file.data.id);

      return qrcode;
    } catch (error) {
      console.error(error);
    }
  }

  try {
    const date = new Date().toLocaleDateString()

    res.json(date)
  } catch (error) {
    
  }

  }