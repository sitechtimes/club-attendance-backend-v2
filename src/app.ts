import express from 'express';
import cors from 'cors';
import { router } from './routes';
import session from 'express-session';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const redirectUri = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['email', 'profile']
});

app.use(cors());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'secret'
}))

app.use(router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
});

export { app, oauth2Client, redirectUri };