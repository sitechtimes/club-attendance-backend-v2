"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.router = router;
router.get('/', (req, res) => {
    res.send('Hello World!');
});
router.get('/oauth2', auth_1.auth);
router.get('/oauth2callback', auth_1.oauth2callback);
