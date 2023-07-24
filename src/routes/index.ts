import express from 'express';
import { oauth2, oauth2callback } from '../middleware/auth';
import { createUserSheet } from '../middleware/user/userData';
import { createClubMeta, createClubTemplate } from '../middleware/scripts/drive';
import { uploadImage } from '../middleware/user/uploadImage';
import { upload } from '../middleware/user/multer';


const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.get('/oauth2', oauth2)
router.get('/oauth2callback', oauth2callback)

router.post("/createUserSheet", createUserSheet)
router.post("/createClubTemplate", createClubTemplate)
router.post("/createClubMeta", createClubMeta)
router.post("/uploadImage", upload.single("image"), uploadImage)


export { router };