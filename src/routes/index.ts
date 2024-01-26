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
import {
  approveImage,
  getImage,
  uploadImage,
} from "../middleware/user/uploadImage";
import { upload } from "../middleware/user/multer";

import { updateQRCode } from "../middleware/club/updateQRCode";
import {
  updateAttendance,
  showAttendancePhotos,
} from "../middleware/club/attendance";
import { verifyAdmin, verifyAuthority } from "../middleware/user/verification";
import {
  getClubMeta,
  addClubMeeting,
  deleteClubMeeting,
} from "../middleware/club/clubMeta";
// import { redirectUri } from '../app';

import {
  listFile,
  deleteFile,
  listFileAndRemove,
  listObject,
} from "../middleware/scripts/utility";
import { authority } from "../enums/authority";
import { createYearAttendanceFolder } from "../middleware/Folder_Meta_Utils/CreateClub";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("hello world");
});

router.get("/oauth2", oauth2);
router.get("/oauth2callback", oauth2callback);
router.get("/getClubData/:clubName/:year", getClubData);
router.get(
  "/getClubMeta/:clubName/:year/:uuid",
  verifyAuthority([authority.admin]),
  getClubMeta
); //admin
router.get(
  "/getClubMembers/:clubName/:year/:uuid",
  verifyAuthority([authority.admin, authority.club_president]),
  getClubMembers
); //admin and president (need to test for multiple valid authorities)
router.get("/showAttendancePhotos", showAttendancePhotos);
router.get(
  "/getAllClubData/:uuid",
  verifyAuthority([authority.admin]),
  getAllClubData
); //admin?s
router.get("/returnRedirectUrl", returnRedirecUrl);
router.get(
  "/getUnapprovedImages/:uuid",
  verifyAuthority([authority.admin]),
  getImage
); //admin

router.post(
  "/createUserSheet",
  verifyAuthority([authority.admin]),
  createUserSheet
); //admin
router.patch("/updateAttendance", updateAttendance); // attendance
router.patch("/updateQRCode", updateQRCode); //????
router.post(
  "/createClubTemplate",
  verifyAuthority([authority.admin]),
  createYearAttendanceFolder
); /* createClubTemplate */
// router.post("/createClubMeta", createClubMeta)
router.post(
  "/uploadImage",
  upload.array("image"),
  verifyAuthority([authority.club_president]),
  uploadImage
); // upload.array("image") needs to be before verifyAuthority or it doens't work for some reason
router.post(
  "/approveImage",
  upload.array("image"),
  verifyAuthority([authority.admin]),
  approveImage
); // admin (probably works if the one above works)
router.post(
  "/addClubMeeting",
  verifyAuthority([authority.club_president]),
  addClubMeeting
); // president
router.post("/addClub", verifyAuthority([authority.admin]), addClubData); //admin

// router.patch("/changeMeta", changeMeta)

router.post(
  "/deleteClubMeeting",
  verifyAuthority([authority.club_president]),
  deleteClubMeeting
); // president
router.delete(
  "/deleteClub",
  verifyAuthority([authority.admin]),
  deleteClubData
); //admin
router.delete(
  "/removeStudentFromClub",
  verifyAuthority([authority.admin, authority.club_president]),
  removeStudentFromClub
); //president and admin

router.get("/listfiles", listFile);
router.delete("/listFilesAndRemove", listFileAndRemove);
router.delete("/deleteFile", deleteFile);
router.get("/listObject", listObject);

export { router };
