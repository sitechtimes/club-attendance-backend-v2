import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { getClubSheet } from "./clubData";
import {
  attendanceData,
  dateData,
  metaData,
  clubData,
} from "../../interface/interface";

export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const date = new Date().toLocaleDateString();
  // const time = new Date();
  // const h = time.getHours();

  const data = req.body as attendanceData;
  const clubData = req.body as clubData;

  const arrUID: string[] = [];
  const dateArr: dateData[] = [];
  const metaArr: metaData[] = [];
  const attendanceArrUID: string[] = [];
  const masterArr: string[] = [];

  const userSpreadSheetID = process.env.USER_DATA_SPREADSHEET_ID as string;
  const metaDataSheetID = process.env.META_DATA_SPREADSHEET_ID as string;
  const masterSpreadSheetID = process.env.MASTER_SPREADSHEET_ID as string;

  const userDoc = new GoogleSpreadsheet(userSpreadSheetID, serviceAccountAuth);
  const masterDoc = new GoogleSpreadsheet(
    masterSpreadSheetID,
    serviceAccountAuth
  );

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

    const ID = metaArr.filter((el) => el.club_name === clubName);

    return ID;
  }

  // const x = user_rows[0].get('UID')
  // console.log(x)

  async function updateAttendance(
    uid: string,
    clubName: string,
    room: string,
    firstName: string,
    lastName: string
  ) {
    const arrAttendanceID = await findClassID(clubName);
    let attendanceID: string = "";

    if (arrAttendanceID === undefined) {
      return res.json("invalid class name");
    } else {
      attendanceID = arrAttendanceID[0].club_spreadsheet_id;
    }

    const attendanceDoc = new GoogleSpreadsheet(
      attendanceID,
      serviceAccountAuth
    );

    await attendanceDoc.loadInfo();
    await userDoc.loadInfo();
    await masterDoc.loadInfo();

    const attendanceSheet = attendanceDoc.sheetsByIndex[0];
    const userSheet = userDoc.sheetsByIndex[0];
    const masterSheet = masterDoc.sheetsByIndex[0];

    const userSheetLen = userSheet.rowCount;
    const attendanceSheetLen = attendanceSheet.rowCount;
    const masterSheetLen = masterSheet.rowCount;

    const userRows = await userSheet.getRows();
    const attendanceRows = await attendanceSheet.getRows();
    const masterRows = await masterSheet.getRows();
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
        const x = attendanceRows[i].get("UID");

        attendanceArrUID.push(x);
        // console.log(attendanceArrUID)
        // console.log(user_rows[i].get("UID"))
      }
    }
    const rowNum: number = attendanceArrUID.indexOf(uid);

    if (data.club_name === clubData.clubName) {
      const r = clubData.room;
      masterArr.push(r);
    }

    if (arrUID.includes(uid)) {
      const userUID = attendanceArrUID.includes(uid);
      if (rowNum === -1) {
        const rowObject = await attendanceSheet.addRow({
          UID: uid,
          "First Name": data.first_name,
          "Last Name": data.last_name,
          Email: data.email,
          Position: data.position,
          Grade: data.grade,
          "Official Class": data.off_class,
          "# of Attendances": data.num_attendance + 1,
          Date: date,
        });
        const updateMaster = await masterSheet.addRow({
          Club: data.club_name,
          Room: clubData.room,
          Last: data.last_name,
          First: data.first_name,
        });

        res.json("User attendance has been updated");
      } else if (attendanceRows[rowNum].get("Date") === date) {
        res.json("You may only update attendance once a day");
        console.log(attendanceRows[rowNum].get("Date"), date);
      } else {
        const attNum: string = attendanceRows[rowNum].get("# of Attendances");
        const turnNum = Number(attNum);
        attendanceRows[rowNum].set("# of Attendances", turnNum + 1);
        attendanceRows[rowNum].set("Date", date);
        await attendanceRows[rowNum].save();
        await masterRows[rowNum].save();
        res.json(`updated attendance: ${attNum} `);
      }
    } else {
      res.json("use a valid uid");
    }

    //
    //
    //
    // master attendance
  }

  try {
    await updateAttendance(
      data.uuid,
      data.club_name,
      clubData.room,
      data.first_name,
      data.last_name
    );
  } catch (error) {
    res.json(error);
  }
};

export const showAttendancePhotos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clubName = req.body.clubName;
    const year = req.body.year;

    const attendanceData = await getClubSheet(clubName, year);

    console.log(attendanceData.data.files);

    const photosFolderId = attendanceData.data.files?.filter(
      (file) => file.name === `${clubName} Attendance Photos`
    )[0].id;

    const photos = await service.files.list({
      q: `'${photosFolderId}' in parents`,
      fields: "files(id, name, webViewLink, webContentLink, thumbnailLink)",
    });

    res.json(photos.data.files);
  } catch (error) {
    res.json(error);
  }
};
