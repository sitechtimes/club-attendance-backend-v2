export interface clubData {
  "Club Name": string;
  "Advisor Email": string;
  "Club Advisor": string;
  "President Email": string;
  "Club President": string;
  "Next Meeting": string;
  Room: string;
  thumbnailLink: string;
}

export interface attendanceData {
  club_name: string;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  grade: number;
  off_class: string;
  num_attendance: number;
  // date: Date;
}

export interface metaData {
  club_name: string;
  club_spreadsheet_id: string;
}

export interface dateData {
  uid: string;
  date: Date;
}

export interface clubMeta {
  clubName: string;
  advisorEmail: string;
  presidentEmail: string;
  nextMeeting: string;
  qrCode: string;
  clubFolderId: string;
  clubSpreadsheet: string;
  clubPhotoFolderId: string;
  clubCode: string;
}

export interface memberData {
  UID: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  position: string;
  officialClass: string;
  numAttendance: string;
  date: string;
}
