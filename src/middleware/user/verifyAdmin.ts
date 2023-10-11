import { Request, Response, NextFunction } from 'express'
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet, GoogleSpreadsheetCell } from "google-spreadsheet";


export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userDoc = new GoogleSpreadsheet(process.env.USER_DATA_SPREADSHEET_ID as string, serviceAccountAuth)
    await userDoc.loadInfo()
    const userSheet = userDoc.sheetsByIndex[0]
    const userRows = await userSheet.getRows()

    const admin = userRows.filter(user => user.get("Client Authority") === "admin" && user.get("Email") === req.body.email)
    console.log(admin)

    if (admin.length === 0) {
        res.json({ message: "You are not an admin!" })
    } else{
        return next()
    }

}