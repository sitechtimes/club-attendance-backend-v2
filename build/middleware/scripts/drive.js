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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClubMeta = exports.createClubTemplate = void 0;
const app_1 = require("../../app");
const google_spreadsheet_1 = require("google-spreadsheet");
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
const createClubTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let arrFolderName = [];
    let headerValues = [
        "UID",
        "First Name",
        "Last Name",
        "Email",
        "Position",
        "Grade",
        "Official Class",
        "# of Attendences",
    ];
    // let arrFolderId: string[] = [];
    const date = new Date();
    const year = date.getFullYear();
    const yearFolderMetaData = {
        name: `${year}-${year + 1}`,
        mimeType: "application/vnd.google-apps.folder",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
    };
    const permissions = {
        role: "writer",
        type: "user",
        emailAddress: "harveyjiang11@gmail.com",
        sendNotificationEmails: false,
    };
    function createQRCode(parentID, folderName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const link = `https://www.test.com/${folderName}`;
                const qrcode = yield qrcode_1.default.toFile(`./imgs/${folderName}.png`, link, { type: "png" });
                //Johnson please save the qrcode to the drive, the parent ID is here 
                return qrcode;
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    function createYearFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = yield app_1.service.files.create({
                resource: yearFolderMetaData,
                fields: "id",
            });
            const folderId = folder.data.id;
            try {
                function timeout(ms) {
                    return new Promise((resolve) => setTimeout(resolve, ms));
                }
                for (let i = 0; i < arrFolderName.length; i++) {
                    yield timeout(3000);
                    const folderName = arrFolderName[i];
                    yield createClubFolder(folderId, folderName);
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    function createClubFolder(parentID, folderName) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderMetaData = {
                name: folderName,
                mimeType: "application/vnd.google-apps.folder",
                parents: [parentID],
            };
            const clubFolder = yield app_1.service.files.create({
                resource: folderMetaData,
                fields: "id",
            });
            const folderId = clubFolder.data.id;
            console.log(folderName);
            try {
                const photoSheetId = yield createPhotoFolder(folderId, folderName);
                const attendanceSheetId = yield createAttendanceSheet(folderId, folderName);
                const qrCode = yield createQRCode(folderId, folderName);
                //add club to metadata spreadsheet given club name, and ids of the spreadsheets
                const metaSheet = addToMeta(folderName, folderId, photoSheetId, attendanceSheetId, qrCode);
                console.log(`Created all drive content for ${folderName}!`);
            }
            catch (error) {
                res.json(error);
            }
        });
    }
    function addToMeta(folderName, clubFolderId, photoSheetId, attendanceSheetId, qrCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataSpreadSheet = new google_spreadsheet_1.GoogleSpreadsheet(process.env.CLUB_METADATA_SPREADSHEET_ID, app_1.serviceAccountAuth);
            const metaDataSheet = metaDataSpreadSheet.sheetsByIndex[0];
            const metaDataSheetLen = metaDataSheet.rowCount;
            yield metaDataSheet.loadCells(`A1:A${metaDataSheetLen}`);
            yield metaDataSheet.addRow([
                folderName,
                "advisor email",
                "president email",
                "next meeting date",
                JSON.stringify(qrCode),
                clubFolderId,
                attendanceSheetId,
                photoSheetId,
                (0, uuid_1.v4)()
            ]);
            yield metaDataSheet.saveUpdatedCells();
        });
    }
    function createAttendanceSheet(parentID, sheetName) {
        return __awaiter(this, void 0, void 0, function* () {
            const attendanceRequestBody = {
                name: sheetName,
                mimeType: "application/vnd.google-apps.spreadsheet",
                parents: [parentID],
            };
            const attendanceSpreadsheet = yield app_1.service.files.create({
                resource: attendanceRequestBody,
                fields: "id",
            });
            const attendanceSpreadsheetId = attendanceSpreadsheet.data.id;
            //Opening the created spreadsheet to add header row values
            const attendanceDoc = new google_spreadsheet_1.GoogleSpreadsheet(attendanceSpreadsheetId, app_1.serviceAccountAuth);
            yield attendanceDoc.loadInfo();
            const sheet = attendanceDoc.sheetsByIndex[0];
            yield sheet.loadCells("A1:K1");
            for (let i = 0; i < 9; i++) {
                const cell = sheet.getCell(0, i); // access cells using a zero-based index
                cell.value = headerValues[i];
                cell.textFormat = { bold: true };
            }
            yield sheet.saveUpdatedCells();
            return attendanceSpreadsheetId;
        });
    }
    function createPhotoFolder(parentID, folderName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const photoFolderMetaData = {
                    name: `${folderName} Attendence Photos`,
                    mimeType: "application/vnd.google-apps.folder",
                    parents: [parentID],
                };
                const photoFolder = yield app_1.service.files.create({
                    resource: photoFolderMetaData,
                    fields: "id",
                });
                res.json(`Created folder for ${folderName} attendence photos.`);
                return photoFolder.data.id;
            }
            catch (error) {
                res.json(error);
            }
        });
    }
    createYearFolder();
    res.json({ message: "Successfully created all club folders for the school year!" });
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
