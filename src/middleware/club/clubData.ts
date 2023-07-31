import { Request, Response, NextFunction } from 'express'
import { clubNameDoc, service, serviceAccountAuth } from '../../app';
import { clubData } from '../../interface/interface';
import { getSelectedClub } from './clubMeta';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from 'googleapis';
const sheets = google.sheets('v4');


export const getClubData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clubName = req.body.clubName
        const year = req.body.year
        await clubNameDoc.loadInfo()
        const clubNameSheet = clubNameDoc.sheetsById[0]
        const rows = await clubNameSheet.getRows()
        
        const club = await getSelectedClub(year , clubName)

        console.log(club, "17")

        // const selectedClub = rows.find(row => row._rawData[0] === clubName)
        const selectedClub = rows.filter(row => row.get("Club Name") === clubName)[0]
        console.log(selectedClub?.get("Club Name"))
        const clubData: clubData = {
            clubName: selectedClub?.get("Club Name"),
            clubAdivsor: selectedClub?.get("Club Advisor"),
            clubPresident: selectedClub?.get("Club President(s)"),
            frequency: selectedClub?.get("Frequency"),
            day: selectedClub?.get("Day"),
            room: selectedClub?.get("Room"),
            advisorEmail: club?.get("Advisor Email"),
            presidentEmail: club?.get("President Email"),
            nextMeeting: club?.get("Next Meeting"),
        }

        res.json(clubData)
    } catch (error) {
        res.json(error)
    }
}

//add club
export const addClubData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clubName = req.body.clubName
        const clubAdvisor = req.body.clubAdvisor
        const clubPresident = req.body.clubPresident
        const frequency = req.body.frequency
        const day = req.body.day
        const room = req.body.room
        const activtyType = req.body.activityType
        const status = req.body.status
        const email = req.body.email

        await clubNameDoc.loadInfo()
        const clubNameSheet = clubNameDoc.sheetsById[0]
        await clubNameSheet.addRow({
            "Club Name": clubName,
            "Club Advisor": clubAdvisor,
            "Club President(s)": clubPresident,
            Frequency: frequency,
            Day: day,
            Room: room,
            "Activity Type": activtyType,
            Status: "APPROVED",
            Email: email
        })

        res.json(`${clubName} has been added!`)

    } catch (error) {
        res.json(error)
    }
}


//delete club
export const deleteClubData = async (req: Request, res: Response, next: NextFunction) => {
try{
    const clubName = req.body.clubName

    await clubNameDoc.loadInfo()
    const clubNameSheet = clubNameDoc.sheetsById[0]
    const rows = await clubNameSheet.getRows()

    const selectedClub = rows.filter(row => row.get("Club Name") === clubName)[0]
    await selectedClub.delete()
    res.json(`${clubName} has been deleted!`)
    } catch (error) {
        res.json(error)
    }
}

//get all students in club
export const getClubMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const year = req.body.year
        const clubName = req.body.clubName
        
        let result = await service.files
        .list({
          q: `'${process.env.CLUB_ATTENDANCE_FOLDER_ID}' in parents`,
          fields: "nextPageToken, files(id, name)",
          spaces: "drive",
        })
        .catch((error) => console.log(error));
      let folder = result.data.files;
      const selectedYearFolder = folder?.filter((folder) => folder.name === year);
      
      
      const attendanceFolderData = await service.files.list({
        q: `name = '${clubName}' and '${selectedYearFolder[0].id}' in parents`,
        fields: "nextPageToken, files(id, name)",
      })

      const attendanceId = attendanceFolderData.data.files[0].id

      const attendanceData = await service.files.list({
        q: `'${attendanceId}' in parents`,
        fields: "nextPageToken, files(id, name)",
      })



      const attendanceSheetId: string = attendanceData.data.files?.find((file) => file.name === `${clubName}`)?.id



      const attendanceSheetData = new GoogleSpreadsheet(attendanceSheetId, serviceAccountAuth);
      await attendanceSheetData.loadInfo()

      const attendanceSheet = attendanceSheetData.sheetsByIndex[0]
      const rows = await attendanceSheet.getRows()

      console.log(rows)

      const allMembers = []

      rows.forEach(row => {
            const member = {
                
            }

      })

      
    } catch (error) {
        res.json(error)
    }
}
