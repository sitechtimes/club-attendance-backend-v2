import express from "express";
import cors from "cors";
import { router } from "./routes";
import session from "express-session";
import { google } from "googleapis";
import dotenv from "dotenv";
import { GoogleSpreadsheet } from "google-spreadsheet";
import bodyParser from "body-parser";
import { JWT, GoogleAuth } from "google-auth-library";
import keys from "../keys.json";

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const redirectUri = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["email", "profile"],
});

const serviceAccountAuth = new GoogleAuth({
  credentials: keys,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

const service = google.drive({ version: "v3", auth: serviceAccountAuth });

app.use(cors());
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "secret",
  })
);
//raw requests are now usable properties on req.body
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Enable the use of request body parsing middleware
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const userDataSpreadSheet = new GoogleSpreadsheet(
  process.env.USER_DATA_SPREADSHEET_ID as string,
  serviceAccountAuth
);
// const drive = new

const clubNameDoc = new GoogleSpreadsheet(
  process.env.CLUB_DATA_SPREADSHEET_ID as string,
  serviceAccountAuth
);
// const clubMetaData = new GoogleSpreadsheet(process.env.CLUB_METADATA_SPREADSHEET_ID, serviceAccountAuth);

// await doc.loadInfo();
// await driveDoc.loadInfo(); // loads document properties and worksheets
// console.log(doc.title)

// // Pre-configure the client with credentials you have stored in e.g. your database
// // NOTE - `refresh_token` is required, `access_token` and `expiry_date` are optional
// // (the refresh token is used to generate a missing/expired access token)
// const { accessToken, refreshToken, expiryDate } = await fetchUserGoogleCredsFromDatabase();
// oauth2Client.credentials.access_token = accessToken;
// oauth2Client.credentials.refresh_token = refreshToken;
// oauth2Client.credentials.expiry_date = expiryDate; // Unix epoch milliseconds

app.use("/", router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});

export {
  app,
  oauth2Client,
  redirectUri,
  serviceAccountAuth,
  service,
  userDataSpreadSheet,
  clubNameDoc,
  AllMetaIdSheet,
};
