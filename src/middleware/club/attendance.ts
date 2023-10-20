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
  const MainSheetUID: string[] = [];

  //ENVIRONMENT VARIABLES
  const userSpreadSheetID = process.env.USER_DATA_SPREADSHEET_ID as string;
  const metaDataSheetID = process.env.META_DATA_SPREADSHEET_ID as string;
  const masterSpreadSheetID = process.env.MASTER_SPREADSHEET_ID as string;

  //GET USER INFORMATION
  const userDoc = new GoogleSpreadsheet(userSpreadSheetID, serviceAccountAuth);

  let headerValues: string[] = [
    "UID",
    "First Name",
    "Last Name",
    "Email",
    "Position",
    "Grade",
    "Official Class",
  ];
  //FROM META DATA SHEET GET CLUB SHEET ID AND NAME
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

  async function updateAttendance(uid: string, clubName: string) {
    /* firstName: string, lastName:string */
    const arrAttendanceID = await findClassID(clubName);
    let attendanceID: string = "";

    if (arrAttendanceID === undefined) {
      return res.json("invalid class name");
    } else {
      attendanceID = arrAttendanceID[0].club_spreadsheet_id;
    }

    //GET CLUBS ATTENDANCE SHEET
    const attendanceDoc = new GoogleSpreadsheet(
      attendanceID,
      serviceAccountAuth
    );

    const masterDoc = new GoogleSpreadsheet(
      masterSpreadSheetID,
      serviceAccountAuth
    );

    //LOAD SHEETS
    await attendanceDoc.loadInfo();
    await userDoc.loadInfo();
    await masterDoc.loadInfo();

    //CREATE SHEET FOR THE DAY THE CLUB MEMBERS SIGN IN
    let newSheet: any = "";
    if (!attendanceDoc.sheetsByTitle[date]) {
      console.log("creating new worksheet");
      newSheet = await attendanceDoc.addSheet({ title: date });

      //CREATE HEADERS
      await newSheet.loadCells("A1:K1");
      console.log("adding header");
      for (let i = 0; i < 9; i++) {
        const cell = newSheet.getCell(0, i); // access cells using a zero-based index
        // console.log(headerValues[i]);
        cell.value = headerValues[i];
        cell.textFormat = { bold: true };
      }

      await newSheet.saveUpdatedCells();
    } else {
      console.log("updating existing worksheet");
      newSheet = attendanceDoc.sheetsByTitle[date];
    }
    //END OF CREATING SHEETS

    /* const attendanceSheet = attendanceDoc.sheetsByIndex[0]; */
    const userSheet = userDoc.sheetsByIndex[0];
    const masterSheet = masterDoc.sheetsByIndex[0];
    const ClubMainSheet = attendanceDoc.sheetsByIndex[0];

    const userSheetLen = userSheet.rowCount;
    const attendanceSheetLen = newSheet.rowCount;
    const ClubMainSheetLen = ClubMainSheet.rowCount;
    /*     const masterSheetLen = masterSheet.rowCount;

    const masterRows = await masterSheet.getRows(); */
    const userRows = await userSheet.getRows();
    const attendanceRows = await newSheet.getRows();
    const ClubMainSheetRows = await ClubMainSheet.getRows();
    // await attendance_sheet.loadCells("A1:K1");
    // const uid: number =
    //gets all users
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

    for (let i = 0; i < ClubMainSheetLen; i++) {
      if (ClubMainSheetRows[i] === undefined) {
        break;
      }
      const x = ClubMainSheetRows[i].get("UID");

      MainSheetUID.push(x);
    }
    const rowNum: number = attendanceArrUID.indexOf(uid);
    const MainRowNum: number = MainSheetUID.indexOf(uid);

    //MATCH USER INFO FROM USER SPREAD SHEET WITH THE UID
    if (arrUID.includes(uid)) {
      const userUID = attendanceArrUID.includes(uid);

      if (MainRowNum === -1) {
        const rowObject = await ClubMainSheet.addRow({
          UID: uid,
          "First Name": data.first_name,
          "Last Name": data.last_name,
          Email: data.email,
          Position: data.position,
          Grade: data.grade,
          "Official Class": data.off_class,
          "# of Attendances": 1,
          Date: date,
        });
      }
      //IF USER IS NOT IN THE ATTENDANCE SHEET
      if (rowNum === -1) {
        const updateNewSheet = await newSheet.addRow({
          UID: uid,
          "First Name": data.first_name,
          "Last Name": data.last_name,
          Email: data.email,
          Position: data.position,
          Grade: data.grade,
          "Official Class": data.off_class,
        });

        ClubMainSheetRows[MainRowNum].set(
          "# of Attendances",
          data.num_attendance + 1
        );

        ClubMainSheetRows[MainRowNum].set(
          "# of Attendances",
          data.num_attendance + 1
        );
        console.log(MainRowNum);

        /* res.json("added user to club attendance"); */
        if (masterSheet.title != date) {
          await masterSheet.clearRows({ start: 2 });
          await masterSheet.updateProperties({
            title: `${date}`,
          });

          const updateMaster = await masterSheet.addRow({
            Club: data.club_name,
            "First Name": data.first_name,
            "Last Name": data.last_name,
            UID: uid,
          });
          console.log("cleared rows and attendance updated (first signin)");
        } else {
          const updateMaster = await masterSheet.addRow({
            Club: data.club_name,
            "First Name": data.first_name,
            "Last Name": data.last_name,
            UID: uid,
          });
          console.log("user attendance updated");
        }

        res.json("Attendance has been updated.");
        await ClubMainSheetRows[MainRowNum].save();
      } else if (attendanceRows[rowNum].get("Date") === date) {
        res.json("You may only update attendance once a day");
        console.log(attendanceRows[rowNum].get("Date"), date);
      } else {
        const attNum: string = attendanceRows[rowNum].get("# of Attendances");
        const turnNum = Number(attNum);
        attendanceRows[rowNum].set("# of Attendances", turnNum + 1);
        attendanceRows[rowNum].set("Date", date);
        await attendanceRows[rowNum].save();

        res.json(`updated attendance: ${attNum} `);
      }
    } else {
      res.json("use a valid uid");
    }
  }

  try {
    await updateAttendance(data.uuid, data.club_name);
    /*  await updateAttendance(
      data.uuid,
      data.club_name,
      data.first_name,
      data.last_name
    ); */
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
