import { Request, Response, NextFunction } from 'express'
import { google } from 'googleapis';
import { oauth2Client, redirectUri } from '../app';
import { doc } from '../app';

export const oauth2 = (req: Request, res: Response, next: NextFunction) => {
    res.redirect(redirectUri);
}

export const oauth2callback = async (req: Request, res: Response, next: NextFunction) => {
    //need to store authentication on client side so it can be used for authentication for other routes (ex. you cant perform certaian actions unless you're an admin)
    const authorizationCode = req.query.code;
    const { tokens } = await oauth2Client.getToken(authorizationCode as string);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log(userInfo.data);
    const uid = userInfo.data.id;
    const firstName = userInfo.data.given_name;
    const lastName = userInfo.data.family_name;
    const email = userInfo.data.email;

    await doc.loadInfo(); // loads document properties and worksheets

    const userDataSheet = doc.sheetsById[0];
    const rows = await userDataSheet.getRows();
    const userRow = rows.find(row => row._rawData[3] === email);

    if (userRow) {
        // res.json({ message: 'User already exists!' });
        return;
    } else {
        await userDataSheet.addRow([uid, firstName, lastName, email, "user"]);
    }


    
    res.json({ message: 'Authentication successful!' });
}


