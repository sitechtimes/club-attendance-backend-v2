import express from 'express';
import { oauth2, oauth2callback } from '../middleware/auth';
import { createUserSheet } from '../middleware/user/userData';
import { getClubData, addClubData, deleteClubData } from '../middleware/club/clubData';
import { createClubTemplate } from '../middleware/scripts/drive';
import { uploadImage } from '../middleware/user/uploadImage';
import { upload } from '../middleware/user/multer';
import { updateAttendance } from '../middleware/club/attendance';
import { verifyAdmin } from '../middleware/user/verifyAdmin';
import { getClubMeta, addClubMeeting, deleteClubMeeting } from '../middleware/club/clubMeta';


const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.get('/oauth2', oauth2)
router.get('/oauth2callback', oauth2callback)
router.get("/getClubData", getClubData)
router.get("/getClubMeta", getClubMeta)

router.post("/createUserSheet", createUserSheet)
router.post("/createClubTemplate",verifyAdmin, createClubTemplate)
// router.post("/createClubMeta", createClubMeta)
router.post("/uploadImage", upload.array("image"), uploadImage)
router.post("/addClubMeeting", addClubMeeting)
router.post("/addClub", verifyAdmin, addClubData)

router.patch("/updateAttendance", updateAttendance)
// router.patch("/changeMeta", changeMeta)

router.delete("/deleteClubMeeting", deleteClubMeeting)
router.delete("/deleteClub", deleteClubData)

export { router };