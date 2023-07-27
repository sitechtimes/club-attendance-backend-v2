import { Request, Response, NextFunction } from 'express'
import { clubNameDoc, service } from '../../app';
import { clubData } from '../../interface/interface';
import { getSelectedClub } from './clubMeta';


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
    res.json("sdcjsndnc")
    } catch (error) {
        res.json(error)
    }
}

