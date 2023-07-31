import express from 'express';
import { oauth2, oauth2callback } from '../middleware/auth';
import { createUserSheet } from '../middleware/user/userData';
import { getClubData } from '../middleware/club/clubData';
import { createClubTemplate } from '../middleware/scripts/drive';
import { uploadImage } from '../middleware/user/uploadImage';
import { upload } from '../middleware/user/multer';
import { updateAttendance } from '../middleware/club/attendance';
import { updateQRCode } from '../middleware/club/updateQRCode';


const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.get('/oauth2', oauth2)
router.get('/oauth2callback', oauth2callback)
router.get("/getClubData", getClubData)

router.post("/createUserSheet", createUserSheet)
router.patch("/updateAttendance", updateAttendance)
router.patch("/updateQRCode",  updateQRCode)
router.post("/createClubTemplate", createClubTemplate)
// router.post("/createClubMeta", createClubMeta)
router.post("/uploadImage", upload.array("image"), uploadImage)


export { router };