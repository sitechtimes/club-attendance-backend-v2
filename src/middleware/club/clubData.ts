import { Request, Response, NextFunction } from 'express'
import { clubNameDoc, service, serviceAccountAuth } from '../../app';
import { clubData, memberData } from '../../interface/interface';
import { getSelectedClub } from './clubMeta';
import { GoogleSpreadsheet } from "google-spreadsheet";


export const getClubData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clubName: string = req.body.clubName
        const year: string = req.body.year
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
        const clubName: string = req.body.clubName
        const clubAdvisor: string = req.body.clubAdvisor
        const clubPresident: string = req.body.clubPresident
        const frequency: string = req.body.frequency
        const day: string = req.body.day
        const room: string = req.body.room
        const activtyType: string = req.body.activityType
        const status = req.body.status
        const email: string = req.body.email

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
    const clubName: string = req.body.clubName

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


export const getClubSheet = async (clubName: string, year: string) => {
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
        q: `name = '${clubName}' and '${selectedYearFolder![0].id}' in parents`,
        fields: "nextPageToken, files(id, name)",
      })

      const attendanceId: string | undefined | null = attendanceFolderData.data.files![0].id

      const attendanceData = await service.files.list({
        q: `'${attendanceId}' in parents`,
        fields: "nextPageToken, files(id, name)",
      })


      return attendanceData
}

//get all students in club
export const getClubMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const year: string = req.body.year
        const clubName: string = req.body.clubName
        
        

       const attendanceSheetFile = await getClubSheet(clubName, year)

       const attendanceSheetId: string | undefined | null = attendanceSheetFile.data.files?.find((file) => file.name === `${clubName}`)?.id

    
      const attendanceSheetData = new GoogleSpreadsheet(attendanceSheetId as string, serviceAccountAuth);
      await attendanceSheetData.loadInfo()

      const attendanceSheet = attendanceSheetData.sheetsByIndex[0]
      const rows = await attendanceSheet.getRows()

      console.log(rows)

      const allMembers: memberData[] = []

      rows.forEach(row => {
            const member = {
                UID: row.get("UID"),
                firstName: row.get("First Name"),
                lastName: row.get("Last Name"),
                email: row.get("Email"),
                grade: row.get("Grade"),
                position: row.get("Position"),
                officialClass: row.get("Official Class"),
                numAttendance: row.get("# of Attendances"),
                date: row.get("Date"),
            }
            allMembers.push(member)

      })

      res.json(allMembers)
      
    } catch (error) {
        res.json(error)
    }
}

//remove student from club
export const removeStudentFromClub = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const year = req.body.year
        const clubName = req.body.clubName
        const UID = req.body.UID

        const attendanceSheetFile = await getClubSheet(clubName, year)

        const attendanceSheetId: string | null | undefined = attendanceSheetFile.data.files?.find((file) => file.name === `${clubName}`)?.id

        const attendanceSheetData = new GoogleSpreadsheet(attendanceSheetId as string, serviceAccountAuth);
        await attendanceSheetData.loadInfo()

        const attendanceSheet = attendanceSheetData.sheetsByIndex[0]
        const rows = await attendanceSheet.getRows()

        const selectedStudent = rows.filter(row => row.get("UID") === UID)[0]
        await selectedStudent.delete()

        res.json(`${selectedStudent.get("First Name")} ${selectedStudent.get("Last Name")} has been removed from ${clubName}`)
    } catch (error) {
        res.json(error)
    }
}

