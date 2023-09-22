import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { getClubSheet } from "./clubData";
import { attendanceData, dateData, metaData } from "../../interface/interface";

export const updateAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const date = new Date().toLocaleDateString();
  const data = req.body as attendanceData;
  const arrUID: string[] = [];
  const dateArr: dateData[] = [];
  const metaArr: metaData[] = [];
  const attendanceArrUID: string[] = [];

  const userSpreadSheetID = process.env.USER_DATA_SPREADSHEET_ID as string; // need to get id of new spread sheet for new day
  const metaDataSheetID = process.env.META_DATA_SPREADSHEET_ID as string;

  const userDoc = new GoogleSpreadsheet(userSpreadSheetID, serviceAccountAuth);

  // takes club name, from metaData sheet get club name and club spreadsheet id, return club name
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

    // get current club object from metaArr
    const ID = metaArr.filter((el) => el.club_name === clubName);

    return ID;
  }

  // const x = user_rows[0].get('UID')
  // console.log(x)

  // get club sheet id,
  async function updateAttendance(uid: string, clubName: string) {
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

    await attendanceDoc.loadInfo(); // this is the current clubs sheet
    await userDoc.loadInfo();
    /* const attendanceSheet = attendanceDoc.sheetsByIndex[0]; */
    let attendance_sheet: any = {};
    let headerValues: string[] = [
      "UID",
      "First Name",
      "Last Name",
      "Email",
      "Position",
      "Grade",
      "Official Class",
    ];
    if (attendanceDoc.sheetsByTitle[`${date}`]) {
      console.log(attendanceDoc.sheetsByTitle[`${date}`]);
      attendance_sheet = attendanceDoc.sheetsByTitle[`${date}`];
    } else {
      let newAttendanceSheet = await attendanceDoc.addSheet({
        title: `${date}`,
      });
      /* const sheet = newAttendanceSheet.loadCells("A1:I1"); */
      /* for (let i = 0; i < 9; i++) {
        const cell = sheet.getCell(0, i); // access cells using a zero-based index
        cell.value = headerValues[i];
        cell.textFormat = { bold: true };
      } */
      attendance_sheet = newAttendanceSheet;
    }
    console.log("102");
    const userSheet = userDoc.sheetsByIndex[0];
    const userSheetLen = userSheet.rowCount;
    const attendanceSheetLen = attendance_sheet.rowCount;

    const userRows = await userSheet.getRows();

    console.log("109");
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
      if (newAttendanceSheetRows[i] === undefined) {
        break;
      } else {
        const x = newAttendanceSheetRows[i].get("UID");

        attendanceArrUID.push(x);
        // console.log(attendanceArrUID)
        // console.log(user_rows[i].get("UID"))
      }
    }
    const rowNum: number = attendanceArrUID.indexOf(uid);

    if (arrUID.includes(uid)) {
      const userUID = attendanceArrUID.includes(uid);
      if (rowNum === -1) {
        const rowObject = await attendance_sheet.addRow({
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

        res.json("added user to club attendance");
      } else if (newAttendanceSheetRows[rowNum].get("Date") === date) {
        res.json("You may only update attendance once a day");
        console.log(newAttendanceSheetRows[rowNum].get("Date"), date);
      } else {
        const attNum: string =
          newAttendanceSheetRows[rowNum].get("# of Attendances");
        const turnNum = Number(attNum);
        attendance_sheet[rowNum].set("# of Attendances", turnNum + 1);
        newAttendanceSheetRows[rowNum].set("Date", date);
        await newAttendanceSheetRows[rowNum].save();
        res.json(`updated attendance: ${attNum} `);
      }
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
