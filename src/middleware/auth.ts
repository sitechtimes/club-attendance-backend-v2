import { Request, Response, NextFunction } from 'express'
import { google } from 'googleapis';
import { oauth2Client, redirectUri } from '../app';

export const oauth2 = (req: Request, res: Response, next: NextFunction) => {
    res.redirect(redirectUri);
}

export const oauth2callback = async (req: Request, res: Response, next: NextFunction) => {
    const authorizationCode = req.query.code;
    const { tokens } = await oauth2Client.getToken(authorizationCode as string);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log(userInfo.data);
    res.json({ message: 'Authentication successful!' });
}