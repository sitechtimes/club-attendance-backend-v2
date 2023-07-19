import { Request, Response, NextFunction } from 'express'
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { doc } from '../../app';

export const createUserSheet = async (req: Request, res: Response, next: NextFunction) => {
 try {
    await doc.loadInfo(); // loads document properties and worksheets
    console.log(doc)
    
    const sheet = await doc.addSheet({ headerValues: ["UID", 'First Name', 'Last Name', "Email", "Client Authority", "Osis", "Grade", "Official Class", "Email Domain", "Club Data", "Present Location"] });
    await sheet.updateProperties({ title: 'User Data' });
    
    await sheet.loadCells("A1:L1")

    for(let i = 0; i < 12; i++) {
        const cell = sheet.getCell(0, i); // access cells using a zero-based index
        console.log(cell.value)
        cell.textFormat = { bold: true };
        await sheet.saveUpdatedCells(); // save all updates in one call
    }
    
    res.json({ message: 'User Data Sheet Created!' })

 } catch (error) {
    res.json(error)
 }
}