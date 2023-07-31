import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";

interface attendanceData {
  club_name: string,
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  grade: number;
  off_class: string;
  num_attendance: number;
  date: Date;
}

interface metaData {
  club_name: string;
  club_spreadsheet_id: string;
}
export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const date = new Date().toLocaleDateString()

  const data = req.body as attendanceData;
  const arrUID: string[] = [];
  const metaArr: metaData[] = [];
  const attendanceArrUID: string[] = [];
  const userSpreadSheetID: string = process.env.USER_DATA_SPREADSHEET_ID;
  const metaDataSheetID: string =
    "1vCC8ercuyn8ayszYSYEtpHFs0lxkLhxn0rF_IMyTU5E";
  const userDoc = new GoogleSpreadsheet(userSpreadSheetID, serviceAccountAuth);



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
          club_spreadsheet_id: metaRows[i].get("Club Spreadsheet"),
        };

        metaArr.push(data);

        // console.log(user_rows[i].get("UID"))
      }
    }

    const ID = metaArr.filter(el => el.club_name === clubName );

    return ID
  }

  // const x = user_rows[0].get('UID')
  // console.log(x)

  async function updateAttendance(uid: string, clubName: string) {
    const arrAttendanceID = await findClassID(clubName)
    let attendanceID: string = ""

      if(arrAttendanceID === undefined) {
        return res.json("invalid class name")
      }
      else {
        attendanceID = arrAttendanceID[0].club_spreadsheet_id
      }


    const attendanceDoc = new GoogleSpreadsheet(
      attendanceID,
      serviceAccountAuth
    );

    await attendanceDoc.loadInfo();
    await userDoc.loadInfo();
    const attendanceSheet = attendanceDoc.sheetsByIndex[0];
    const userSheet = userDoc.sheetsByIndex[0];
    const userSheetLen: number = userSheet.rowCount;
    const attendanceSheetLen: number = attendanceSheet.rowCount;

    const userRows = await userSheet.getRows();
    const attendanceRows = await attendanceSheet.getRows();
    // await attendance_sheet.loadCells("A1:K1");
    // const uid: number =

    for (let i = 0; i < userSheetLen; i++) {
      if (userRows[i] === undefined) {
        break;
      } else {
        arrUID.push(userRows[i].get("UID"));

        // console.log(user_rows[i].get("UID"))
      }
    }

    for (let i = 0; i < attendanceSheetLen; i++) {
      if (attendanceRows[i] === undefined) {
        break;
      } else {
        attendanceArrUID.push(attendanceRows[i].get("UID"));
        // console.log(user_rows[i].get("UID"))
      }
    }
    if (arrUID.includes(uid)) {
      const userUID = attendanceArrUID.includes(uid);
      console.log(userUID);
      if (userUID) {
        const rowNum: number = attendanceArrUID.indexOf(uid);
        const attNum: string = attendanceRows[rowNum].get("# of Attendances");
        const turnNum = Number(attNum);
        console.log(turnNum + 1);
        attendanceRows[rowNum].set("# of Attendances", turnNum + 1);
        await attendanceRows[rowNum].save();
      } else {
        const rowObject = await attendanceSheet.addRow({
          UID: uid,
          "First Name": data.first_name,
          "Last Name": data.last_name,
          Email: data.email,
          Position: data.position,
          Grade: data.grade,
          "Official Class": data.off_class,
          "# of Attendances": data.num_attendance + 1,
          Date: date
        });
      }
      res.json("updated attendance");
    } else {
      res.json("use a valid uid");
    }
  }

  try {
    await updateAttendance(data.uuid, data.club_name);

  } catch (error) {
    res.json(error);
  }
};
