export interface clubData {
    clubName: string;
    clubAdivsor: string;
    clubPresident: string;
    frequency: string;
    day: string;
    room: string;
    advisorEmail: string;
    presidentEmail: string;
    nextMeeting: string;
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
    UID: string,
    firstName: string,
    lastName: string,
    email: string,
    grade: string,
    position: string,
    officialClass: string,
    numAttendance: string,
    date: string,
}