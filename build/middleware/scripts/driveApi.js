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
const path = require("path");
const { google } = require("googleapis");
const drive = google.drive("v3");
const createClubTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = google.drive({ version: "v3", serviceAccountAuth: app_1.serviceAccountAuth });
    const folderId = '1MxuYvxnZX86XoeA9IX3XplGrcHPQARJ-';
    const fileMetadata = {
        name: "Invoices",
        mimeType: "application/vnd.google-apps.folder",
        parents: [folderId],
    };
    try {
        const file = yield service.files.create({
            resource: fileMetadata,
            fields: "id",
        });
        console.log("Folder Id:", file.data.id);
        return file.data.id;
    }
    catch (error) {
        res.json(error);
    }
});
exports.createClubTemplate = createClubTemplate;
