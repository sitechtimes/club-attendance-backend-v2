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
exports.createClubMeta = exports.createClubTemplate = void 0;
const app_1 = require("../../app");
const google_spreadsheet_1 = require("google-spreadsheet");
const createClubTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("TRIGGERED");
    const folderName = req.body.folderName;
    const folderMetaData = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
    };
    //Folder is being created but it seems like the user doesn't have access (folder id is defined)
    try {
        const folder = yield app_1.service.files.create({
            resource: folderMetaData,
            fields: 'id',
        });
        const folderId = folder.data.id;
        //You can also set this to viewable by everyone or viewable to everyone in the organization in production
        const permissions = {
            role: 'writer',
            type: 'user',
            emailAddress: 'zhenghenry2@gmail.com',
        };
        yield app_1.service.permissions.create({
            fileId: folderId,
            requestBody: permissions
        });
        res.json(`Created google drive folder with id ${folderId} and shared successfully.`);
    }
    catch (error) {
        console.error(error);
    }
});
exports.createClubTemplate = createClubTemplate;
const createClubMeta = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //using user email for now
    const userEmail = req.body.email;
    console.log(userEmail);
    const userSpreadsheet = new google_spreadsheet_1.GoogleSpreadsheet(process.env.USER_DATA_SPREADSHEET_ID, app_1.serviceAccountAuth);
    yield userSpreadsheet.loadInfo();
    const userSheet = userSpreadsheet.sheetsByIndex[0];
    const users = yield userSheet.getRows();
    //check if the user is an admin before performing 
    const foundUser = users.filter(e => (e.get('Email') === userEmail) && (e.get('Client Authority') === 'admin'));
    if (foundUser.length === 0) {
        res.status(400);
        res.json({ error: 'Forbidden' });
        return;
    }
    console.log(`${userEmail} exists and is an admin`);
    const fileMetaData = {
        name: 'Club MetaData',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID]
    };
    try {
        const spreadsheet = yield app_1.service.files.create({
            resource: fileMetaData,
            fields: 'id'
        });
        const spreadsheetId = spreadsheet.data.id;
        const doc = new google_spreadsheet_1.GoogleSpreadsheet(spreadsheetId, app_1.serviceAccountAuth);
        yield doc.loadInfo();
        const meta_sheet = doc.sheetsByIndex[0];
        yield meta_sheet.setHeaderRow(["Advisor Email", "President Email", "Next Meeting", "QR Code", "Club Folder ID", "Club Spreadsheet", "Club Photo Folder ID", "Club Code"]);
        yield meta_sheet.updateProperties({ title: 'userMetaData' });
        yield meta_sheet.loadCells("A1:H1");
        for (let i = 0; i < 8; i++) {
            const cell = meta_sheet.getCell(0, i); // access cells using a zero-based index
            console.log(cell.value);
            cell.textFormat = { fontFamily: 'Times New Roman' };
            yield meta_sheet.saveUpdatedCells(); // save all updates in one call
        }
        res.json({ message: 'Club MetaData Sheet Created!' });
        next();
    }
    catch (error) {
        console.error(error);
    }
});
exports.createClubMeta = createClubMeta;
