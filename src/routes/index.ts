import express from "express";
import { oauth2, oauth2callback, returnRedirecUrl } from "../middleware/auth";
import { createUserSheet } from "../middleware/user/userData";
import {
  getClubData,
  addClubData,
  deleteClubData,
  getClubMembers,
  removeStudentFromClub,
} from "../middleware/club/clubData";

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
import { verifyAuthority } from "../middleware/user/verification";
import {
  getAllClubMeta,
  addClubMeeting,
  deleteClubMeeting,
} from "../middleware/club/clubMeta";

import {
  listFile,
  deleteFile,
  listFileAndRemove,
  listObject,
} from "../middleware/scripts/utility";
import { authority } from "../enums/authority";
import { createYearAttendanceFolder } from "../middleware/Folder_Meta_Utils/CreateClub";

const router = express.Router();

// Auth Routes ---------------------------------------------------------------------------------------------------------------------
router.get("/oauth2", oauth2);
router.get("/oauth2callback", oauth2callback);

// Club Data Routes ----------------------------------------------------------------------------------------------------------------
router.get("/getClubData/:clubName/:year", getClubData);
router.get(
  "/getClubMembers/:clubName/:year/:uuid",
  verifyAuthority([authority.admin, authority.club_president]),
  getClubMembers
);
router.get(
  "/getAllClubMeta/:uuid/:year",
  verifyAuthority([authority.admin]),
  getAllClubMeta
);

//update attendance
router.patch("/updateAttendance", updateAttendance);

// add/delete meeting
router.post(
  "/addClubMeeting",
  verifyAuthority([authority.club_president]),
  addClubMeeting
);
router.post(
  "/deleteClubMeeting",
  verifyAuthority([authority.club_president]),
  deleteClubMeeting
);

// ???????
router.get("/returnRedirectUrl", returnRedirecUrl);

// Club Image Routes
router.get("/showAttendancePhotos", showAttendancePhotos);
router.post(
  "/uploadImage",
  upload.array("image"),
  verifyAuthority([authority.club_president]),
  uploadImage
); // upload.array("image") needs to be before verifyAuthority or it doens't work for some reason

// Admin Routes --------------------------------------------------------------------------------------------------------------
// approve/unapprove image routes
router.post(
  "/approveImage",
  upload.array("image"),
  verifyAuthority([authority.admin]),
  approveImage
);
router.get(
  "/getUnapprovedImages/:uuid",
  verifyAuthority([authority.admin]),
  getImage
);
// add/delete club
router.post("/addClub", verifyAuthority([authority.admin]), addClubData);
router.delete(
  "/deleteClub",
  verifyAuthority([authority.admin]),
  deleteClubData
);
// other Admin routes
router.patch("/updateQRCode", updateQRCode);

// both Admin and Club President routes ------------------------------------------------------------------------------------------
//remove student from club
router.delete(
  "/removeStudentFromClub",
  verifyAuthority([authority.admin, authority.club_president]),
  removeStudentFromClub
);

// Dev Route ---------------------------------------------------------------------------------------------------------------------
router.post(
  "/createUserSheet",
  verifyAuthority([authority.admin]),
  createUserSheet
);
router.post(
  "/createClubTemplate",
  verifyAuthority([authority.admin]),
  createYearAttendanceFolder
); // could be made into an Admin Route, need to allow for uploading of the google sheet with all the approved clubs tho
router.get("/listfiles", listFile);
router.delete("/listFilesAndRemove", listFileAndRemove);
router.delete("/deleteFile", deleteFile);
router.get("/listObject", listObject);

export { router };
