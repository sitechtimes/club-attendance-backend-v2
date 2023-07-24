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
exports.createQRCode = exports.createClubTemplate = void 0;
const app_1 = require("../../app");
const google_spreadsheet_1 = require("google-spreadsheet");
const app_2 = require("../../app");
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
        "# of Attendence",
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
    function getClubNames() {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_2.clubNameDoc.loadInfo();
            const infoSheet = app_2.clubNameDoc.sheetsByIndex[0];
            const infoSheetLen = infoSheet.rowCount;
            yield infoSheet.loadCells(`A1:A${infoSheetLen}`);
            const generateQR = (text, clubName) => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log(yield qrcode_1.default.toFile(`./imgs/{clubName}.png`, text, { type: "png" }));
                }
                catch (err) {
                    console.error(err);
                }
            });
            for (let i = 1; i < infoSheetLen; i++) {
                const clubName = infoSheet.getCell(i, 0);
                if (clubName.value === null) {
                    break;
                }
                else {
                    const name = clubName.value;
                    const text = `https://www.test.com/${name}`;
                    generateQR(text, name);
                    arrFolderName.push(name);
                }
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
            function timeout(ms) {
                return new Promise((resolve) => setTimeout(resolve, ms));
            }
            try {
                for (let i = 0; i < arrFolderName.length; i++) {
                    yield timeout(3000);
                    const folderName = arrFolderName[i];
                    yield createClubFolder(folderId, folderName);
                }
            }
            catch (error) {
                console.error(`create year Folder function ${error}`);
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
            const folder = yield app_1.service.files.create({
                resource: folderMetaData,
                fields: "id",
            });
            const folderId = folder.data.id;
            try {
                yield createFolder(folderId);
            }
            catch (error) {
                console.error(`create club photo folder function ${error}`);
            }
            try {
                yield createSheets(folderId, folderName);
            }
            catch (error) {
                console.error(`create sheets function ${error}`);
            }
            //You can also set this to viewable by everyone or viewable to everyone in the organization in production
            // await service.permissions.create({   ?perm wrong ig
            //   fileId: folderId,
            //   requestBody: permissions,
            // });
        });
    }
    function createSheets(parentID, sheetName) {
        return __awaiter(this, void 0, void 0, function* () {
            const sheetsRequestBody = {
                name: sheetName,
                mimeType: "application/vnd.google-apps.spreadsheet",
                parents: [parentID],
            };
            const sheetsFolder = yield app_1.service.files.create({
                resource: sheetsRequestBody,
                fields: "id",
            });
            const sheetsFileId = sheetsFolder.data.id;
            // await service.permissions.create({
            //   fileId: sheetsFileId,
            //   requestBody: permissions,
            // });
            const doc = new google_spreadsheet_1.GoogleSpreadsheet(sheetsFileId, app_1.serviceAccountAuth);
            yield doc.loadInfo();
            const sheet = doc.sheetsByIndex[0];
            yield sheet.loadCells("A1:K1");
            for (let i = 0; i < 9; i++) {
                const cell = sheet.getCell(0, i); // access cells using a zero-based index
                cell.value = headerValues[i];
                cell.textFormat = { bold: true };
                // save all updates in one call
            }
            yield sheet.saveUpdatedCells();
        });
    }
    function createFolder(parentID) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderMetaData = {
                name: "Club Attendence Photos",
                mimeType: "application/vnd.google-apps.folder",
                parents: [parentID],
            };
            const folder = yield app_1.service.files.create({
                resource: folderMetaData,
                fields: "id",
            });
        });
    }
    try {
        yield getClubNames();
    }
    catch (error) {
        console.error(`get club names from sheet error ${error}`);
    }
    //Folder is being created but it seems like the user doesn't have access (folder id is defined)
    try {
        yield createYearFolder();
        res.json(`Script Finished`);
    }
    catch (error) {
        console.error(error);
    }
    try {
    }
    catch (error) { }
});
exports.createClubTemplate = createClubTemplate;
const createQRCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const clubName = "clubname";
    const text = `https://www.test.com/${clubName}`;
    const generateQR = (text) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(yield qrcode_1.default.toFile("./imgs/qrcode.png", text, { type: "png" }));
        }
        catch (err) {
            console.error(err);
        }
    });
    yield generateQR(text);
});
exports.createQRCode = createQRCode;
