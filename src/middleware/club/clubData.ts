import { Request, Response, NextFunction } from 'express'
import { clubNameDoc, service } from '../../app';
import { clubData } from '../../interface/interface';


export const getClubData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clubName = req.body.clubName
        await clubNameDoc.loadInfo()
        const clubNameSheet = clubNameDoc.sheetsById[0]
        const rows = await clubNameSheet.getRows()
        
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
            advisorEmail: selectedClub?.get("Advisor's Email"),
            presidentEmail: selectedClub?.get("President's Email")
        }

        res.json(clubData)
    } catch (error) {
        res.json(error)
    }
}