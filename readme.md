# Club Attendance API

## Contents

## Setup the Project

Clone the Repository

```
git clone https://github.com/sitechtimes/club-attendance-backend-v2.git
```

Install Dependencies

```
npm i
```

Make sure you have typescript installed

```
npm install typescript --save-dev
```

There are env files and keys that are required for the project to run properly

## [Attendance](src/middleware/club/attendance.ts)

This route is used to collect data about the user to update their club attendance for the day.

### Route

```
PATCH /updateAttendance
```

**Requests Body Format**

```
{
club_name: string;
uuid: string;
first_name: string;
last_name: string;
email: string;
position: string;
grade: number;
off_class: string;
num_attendance: number;
}
```

**Sample Request**

```
{
"club_name": "3D Printing Club",
"uuid": "116007774216187700433",
"first_name": "First_name",
"last_name": "Last_name",
"email": "test123@gmail.com",
"position": "admin",
"grade": 12,
"off_class": "12g",
"num_attendance": 2
}
```

**Make sure the _UUID_ is a valid UID string from the User Attendance Sheet**

## [Club Data](src/middleware/club/clubData.ts)

This route is used to search for generic information about a specific club.

### Route

```
GET /getClubData
```

**Requests Body Format**

```
{
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
```

**Sample Request**

```
{
"clubName": "3D Printing Club",
"clubAdvisor": "Mr. Whalen",
"clubPresident": "Edwin Zhou",
"frequency": "Every Week",
"day": "Friday",
"room": "259",
"advisorEmail": "advisoremail@gmail.com",
"presidentEmail": "presidentemail@gmail.com",
"nextMeeting": "10/12/2023"
}
```

## [Meta Club Data](src/middleware/club/clubMeta.ts)

This route is used to find the SpreadSheet data for all the clubs.

### Route

```
GET /getClubMeta
```

**Requests Body Format**

```
{
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
```

**Sample Request**

```
{
  "clubName": "3D Printing Club";
  "advisorEmail": "advisoremail@gmail.com";
  "presidentEmail": "presidentemail@gmail.com";
  "nextMeeting": "11/12/2023";
  "qrCode": "";
  "clubFolderId": "";
  "clubSpreadsheet": "";
  "clubPhotoFolderId": "";
  "clubCode": "";
}
```
