"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.service = exports.serviceAccountAuth = exports.redirectUri = exports.oauth2Client = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const express_session_1 = __importDefault(require("express-session"));
const googleapis_1 = require("googleapis");
const dotenv_1 = __importDefault(require("dotenv"));
const google_spreadsheet_1 = require("google-spreadsheet");
const body_parser_1 = __importDefault(require("body-parser"));
const google_auth_library_1 = require("google-auth-library");
const keys_json_1 = __importDefault(require("../keys.json"));
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
exports.app = app;
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
exports.oauth2Client = oauth2Client;
const redirectUri = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['email', 'profile']
});
exports.redirectUri = redirectUri;
const serviceAccountAuth = new google_auth_library_1.GoogleAuth({
    credentials: keys_json_1.default,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
});
exports.serviceAccountAuth = serviceAccountAuth;
const service = googleapis_1.google.drive({ version: 'v3', auth: serviceAccountAuth });
exports.service = service;
app.use((0, cors_1.default)());
app.use((0, express_session_1.default)({
    resave: false,
    saveUninitialized: false,
    secret: 'secret'
}));
//raw requests are now usable properties on req.body
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true
}));
// Enable the use of request body parsing middleware
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({
    extended: true
}));
const doc = new google_spreadsheet_1.GoogleSpreadsheet('1vA3tmBdtr7tltg9FNGp8McoBHF5qB3N1ohvnuOP-kiI', serviceAccountAuth);
const driveDoc = new google_spreadsheet_1.GoogleSpreadsheet('1vA3tmBdtr7tltg9FNGp8McoBHF5qB3N1ohvnuOP-kiI', serviceAccountAuth);
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
app.use("/", routes_1.router);
app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
});
