import express from "express";
import { oauth2, oauth2callback, returnRedirecUrl } from "../middleware/auth";
import { createUserSheet } from "../middleware/user/userData";
import {
  getClubData,
  addClubData,
  deleteClubData,
  getClubMembers,
  removeStudentFromClub,
  getAllClubData,
} from "../middleware/club/clubData";
import { createClubTemplate } from "../middleware/scripts/drive";
import { approveImage, uploadImage } from "../middleware/user/uploadImage";
import { upload } from "../middleware/user/multer";

import { updateQRCode } from "../middleware/club/updateQRCode";
import {
  updateAttendance,
  showAttendancePhotos,
} from "../middleware/club/attendance";
import { verifyAdmin } from "../middleware/user/verifyAdmin";
import {
  getClubMeta,
  addClubMeeting,
  deleteClubMeeting,
} from "../middleware/club/clubMeta";
// import { redirectUri } from '../app';

import { listFile, deleteFile } from "../middleware/scripts/delete";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("hello world");
});

router.get("/oauth2", oauth2);
router.get("/oauth2callback", oauth2callback);
router.get("/getClubData/:clubName/:year", getClubData);
router.get("/getClubMeta/:clubName/:year", getClubMeta);
router.get("/getClubMembers/:clubName/:year", getClubMembers);
router.get("/showAttendancePhotos", showAttendancePhotos);
router.get("/getAllClubData", getAllClubData);
router.get("/returnRedirectUrl", returnRedirecUrl);

router.post("/createUserSheet", createUserSheet);
router.patch("/updateAttendance", updateAttendance); // attendance
router.patch("/updateQRCode", updateQRCode);
router.post("/createClubTemplate", verifyAdmin, createClubTemplate);
// router.post("/createClubMeta", createClubMeta)
router.post("/uploadImage", upload.array("image"), uploadImage);
router.post("/approveImage", upload.array("image"), approveImage);
router.post("/addClubMeeting", addClubMeeting);
router.post("/addClub", verifyAdmin, addClubData);

// router.patch("/changeMeta", changeMeta)

router.delete("/deleteClubMeeting", deleteClubMeeting);
router.delete("/deleteClub", deleteClubData);
router.delete("/removeStudentFromClub", removeStudentFromClub);

router.get("/listfiles", listFile);
router.delete("/deleteFile", deleteFile);

export { router };
