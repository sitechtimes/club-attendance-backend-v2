import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";

interface attendanceData {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  grade: number;
  off_class: string;
  num_attendance: number;
}

export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body as attendanceData;
  const arrUID: string[] = [];
  const attendanceArrUID: string[] = [];
  const attendanceSpreadsheetId: string =
    "1BnI_D9ktnQJ6U_nhT-ukos82UmyNCWR9YFYDaSF-i3Q";
  const userSpreadSheetID = process.env.USER_DATA_SPREADSHEET_ID;

  // const x = user_rows[0].get('UID')
  // console.log(x)

  async function updateAttendance(attendanceID: string) {
    const userDoc = new GoogleSpreadsheet(
      userSpreadSheetID,
      serviceAccountAuth
    );
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

    console.log(attendanceArrUID);
    const userUID = attendanceArrUID.includes(data.uuid);
    console.log(userUID);
    if (userUID) {
      const rowNum: number = attendanceArrUID.indexOf(data.uuid);
      const attNum: string = attendanceRows[rowNum].get("# of Attendances");
      const turnNum = Number(attNum);
      console.log(turnNum + 1);
      attendanceRows[rowNum].set("# of Attendances", turnNum + 1);
      await attendanceRows[rowNum].save();
    } else {
      const rowObject = await attendanceSheet.addRow({
        UID: data.uuid,
        "First Name": data.first_name,
        "Last Name": data.last_name,
        Email: data.email,
        Position: data.position,
        Grade: data.grade,
        "Official Class": data.off_class,
        "# of Attendances": data.num_attendance + 1,
      });

    }
  }

  try {
    await updateAttendance(attendanceSpreadsheetId);
    res.json("work");
  } catch (error) {
    res.json(error);
  }
};
