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
exports.createUserSheet = void 0;
const app_1 = require("../../app");
const createUserSheet = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield app_1.doc.loadInfo(); // loads document properties and worksheets
        console.log(app_1.doc);
        const sheet = yield app_1.doc.addSheet({ headerValues: ["UID", 'First Name', 'Last Name', "Email", "Client Authority", "Osis", "Grade", "Official Class", "Email Domain", "Club Data", "Present Location"] });
        yield sheet.updateProperties({ title: 'User Data' });
        yield sheet.loadCells("A1:L1");
        for (let i = 0; i < 12; i++) {
            const cell = sheet.getCell(0, i); // access cells using a zero-based index
            console.log(cell.value);
            cell.textFormat = { bold: true };
            yield sheet.saveUpdatedCells(); // save all updates in one call
        }
        res.json({ message: 'User Data Sheet Created!' });
        next();
    }
    catch (error) {
        res.json(error);
    }
});
exports.createUserSheet = createUserSheet;
