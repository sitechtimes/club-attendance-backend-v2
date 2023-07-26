import { Request, Response, NextFunction } from 'express'
import { clubNameDoc, service } from '../../app';


export const getClubData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clubName = req.body.clubName
        await clubNameDoc.loadInfo()
        const clubNameSheet = clubNameDoc.sheetsById[0]
        const rows = await clubNameSheet.getRows()
        
        const selectedClub = rows.find(row => row._rawData[0] === clubName)
        console.log(selectedClub?.get("Club Name"))
        const clubData = {
            clubName: selectedClub?.get("Club Name"),
            clubAdivsor: selectedClub?.get("Club Advisor"),
            clubPresident: selectedClub?.get("Club President(s)"),
            frequency: selectedClub?.get("Frequency"),
            day: selectedClub?.get("Day"),
            room: selectedClub?.get("Room"),
        }
        res.json(clubData)
    } catch (error) {
        res.json(error)
    }
}