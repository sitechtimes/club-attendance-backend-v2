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
exports.createClubTemplate = void 0;
const app_1 = require("../../app");
const { google } = require("googleapis");
const createClubTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("TRIGGERED");
    const folderName = req.body.folderName;
    const folderMetaData = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
    };
    console.log(process.env.CLUB_ATTENDANCE_FOLDER_ID);
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
