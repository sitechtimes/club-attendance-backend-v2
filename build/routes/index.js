"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const userData_1 = require("../middleware/user/userData");
const drive_1 = require("../middleware/scripts/drive");
const router = express_1.default.Router();
exports.router = router;
router.get('/', (req, res) => {
    res.send('Hello World!');
});
router.get('/oauth2', auth_1.oauth2);
router.get('/oauth2callback', auth_1.oauth2callback);
router.post("/createUserSheet", userData_1.createUserSheet);
router.post("/createClubTemplate", drive_1.createClubTemplate);
router.post("/createQRCode", drive_1.createQRCode);
