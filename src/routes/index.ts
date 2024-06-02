import express from "express";
import { oauth2, oauth2callback, returnRedirecUrl } from "../middleware/auth";
import { createUserSheet } from "../middleware/setup/createClubSheets";
import {
  getClubData,
  addClubData,
  deleteClubData,
  getClubMembers,
  removeStudentFromClub,
  getAllClubData,
} from "../middleware/club/clubData";

import {
  approveImage,
  getUnapprovedImage,
  unapprovedImage,
  uploadImage,
} from "../middleware/club/Image";
import { upload } from "../multer";

import { updateQRCode } from "../middleware/club/updateQRCode";
import {
  updateAttendance,
  showAttendancePhotos,
} from "../middleware/club/updateAttendance";
import { verifyAuthority } from "../middleware/club/verification";
import {
  getAllClubMeta,
  addClubMeeting,
  deleteClubMeeting,
} from "../middleware/club/clubMeta";

import { Authority } from "../enums/authority";
import { createYearAttendanceFolder } from "../middleware/setup/createClub";
//import { uploadCSV } from "../middleware/scripts/uploadCSV"; uncomment to test only upload csv middleware

const router = express.Router();

// Auth Routes ---------------------------------------------------------------------------------------------------------------------
router.get("/oauth2", oauth2);
router.get("/oauth2callback", oauth2callback);
router.get("/returnRedirectUrl", returnRedirecUrl);

// Club Data Routes ----------------------------------------------------------------------------------------------------------------
router.get("/getClubData/:clubName/:year", getClubData);
router.get(
  "/getAllClubData/:year/:uuid",
  verifyAuthority([Authority.admin]),
  getAllClubData
);
router.get(
  "/getClubMembers/:clubName/:year/:uuid",
  verifyAuthority([Authority.admin, Authority.club_president]),
  getClubMembers
);
router.get(
  "/getAllClubMeta/:uuid/:year",
  verifyAuthority([Authority.admin]),
  getAllClubMeta
);

//update attendance
router.patch("/updateAttendance", updateAttendance);

// add/delete meeting
router.post(
  "/addClubMeeting",
  verifyAuthority([Authority.club_president]),
  addClubMeeting
);
router.post(
  "/deleteClubMeeting",
  verifyAuthority([Authority.club_president]),
  deleteClubMeeting
);

// Club Image Routes
router.get("/showAttendancePhotos", showAttendancePhotos);
router.post(
  "/uploadImage",
  upload.array("image"),
  verifyAuthority([Authority.club_president]),
  uploadImage
); // upload.array("image") needs to be before verifyAuthority or it doens't work for some reason
// doesn't seem to work

// Admin Routes --------------------------------------------------------------------------------------------------------------
// creating club templates by uploading a csv file
router.post(
  "/createClubTemplate",
  upload.single("csv"),
  verifyAuthority([Authority.admin]),
  createYearAttendanceFolder
);
// approve/unapprove image routes
router.patch(
  "/approveImage/:uuid",
  upload.array("image"),
  verifyAuthority([Authority.admin]),
  approveImage
);
router.get(
  "/getUnapprovedImages/:uuid",
  verifyAuthority([Authority.admin]),
  getUnapprovedImage
);

router.delete(
  "/unapproveImage/:uuid",
  verifyAuthority([Authority.admin]),
  unapprovedImage
);
// add/delete club
router.post("/addClub", verifyAuthority([Authority.admin]), addClubData);
router.delete(
  "/deleteClub",
  verifyAuthority([Authority.admin]),
  deleteClubData
);
// other Admin routes
//router.patch("/updateQRCode", updateQRCode);

// both Admin and Club President routes ------------------------------------------------------------------------------------------
//remove student from club
router.delete(
  "/removeStudentFromClub",
  verifyAuthority([Authority.admin, Authority.club_president]),
  removeStudentFromClub
);

// Dev Testing Routes --------------------------------------------------------------------------------------------------------------------------------
// uncomment to test only upload csv middleware
// router.post("/createSheetFromCSV", upload.single("csv"), uploadCSV);

export { router };
