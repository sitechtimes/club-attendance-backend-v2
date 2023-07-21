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
const fs = require("fs");
const createClubTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const folderName = "club 411";
    console.log(folderName);
    const folderMetaData = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID],
    };
    const permissions = {
        role: "writer",
        type: "user",
        emailAddress: "harveyjiang11@gmail.com",
    };
    function createSheets(parentID) {
        return __awaiter(this, void 0, void 0, function* () {
            const sheetsRequestBody = {
                name: "sheets20",
                mimeType: "application/vnd.google-apps.spreadsheet",
                parents: [parentID],
            };
            const sheetsFolder = yield app_1.service.files.create({
                resource: sheetsRequestBody,
                fields: "id",
            });
            const sheetsFileId = sheetsFolder.data.id;
            yield app_1.service.permissions.create({
                fileId: sheetsFileId,
                requestBody: permissions,
            });
        });
    }
    function createClubFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = yield app_1.service.files.create({
                resource: folderMetaData,
                fields: "id",
            });
            const folderId = folder.data.id;
            //You can also set this to viewable by everyone or viewable to everyone in the organization in production
            yield app_1.service.permissions.create({
                fileId: folderId,
                requestBody: permissions,
            });
            createSheets(folderId);
        });
    }
    console.log(process.env.CLUB_ATTENDANCE_FOLDER_ID);
    //Folder is being created but it seems like the user doesn't have access (folder id is defined)
    try {
        createClubFolder();
        res.json(`Created google drive folder with id and shared successfully.`);
    }
    catch (error) {
        console.error(error);
    }
});
exports.createClubTemplate = createClubTemplate;
