"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2callback = exports.auth = void 0;
const googleapis_1 = require("googleapis");
const app_1 = require("../app");
const auth = (req, res, next) => {
    res.redirect(app_1.redirectUri);
};
exports.auth = auth;
const oauth2callback = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authorizationCode = req.query.code;
    const { tokens } = yield app_1.oauth2Client.getToken(authorizationCode);
    app_1.oauth2Client.setCredentials(tokens);
    const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: app_1.oauth2Client });
    console.log(oauth2);
    res.json({ message: 'Authentication successful!' });
});
exports.oauth2callback = oauth2callback;
