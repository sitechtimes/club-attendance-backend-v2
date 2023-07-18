"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectUri = exports.oauth2Client = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const express_session_1 = __importDefault(require("express-session"));
const googleapis_1 = require("googleapis");
const dotenv_1 = __importDefault(require("dotenv"));
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
app.use("/", routes_1.router);
app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
});
