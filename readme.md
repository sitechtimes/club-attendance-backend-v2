# Club Attendance API

## Setup the Project

Clone the Repository.

```
git clone https://github.com/sitechtimes/club-attendance-backend-v2.git
```

Install Dependencies.

```
npm i
```

Make sure you have typescript installed.

```
npm install typescript --save-dev
```

There are env files and keys that are required for the project to run properly.

## [Attendance](src/middleware/club/attendance.ts)

Collects data about the user to update their club attendance for the day.

### Route

```
PATCH /updateAttendance
```

**Request Body Format**

```ts
interface attendanceData {
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

```json
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

Returns information about a specific club.

### Route

```
GET /getClubData
```

**Request Body Format**

```ts
interface clubData {
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

```json
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

Search for SpreadSheet data for a specific club.

### Route

```
GET /getClubMeta
```

**Request Body Format**

```ts
interface clubMeta {
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

```json
{
  "clubName": "3D Printing Club",
  "advisorEmail": "advisoremail@gmail.com",
  "presidentEmail": "presidentemail@gmail.com",
  "nextMeeting": "11/12/2023",
  "qrCode": "",
  "clubFolderId": "",
  "clubSpreadsheet": "",
  "clubPhotoFolderId": "",
  "clubCode": ""
}
```

## [Making User Data Sheet](src/middleware/user/userData.ts)

This code runs one time to initialize the new worksheet where all the user data will be stored.

**Header**

These header values will be automatically set on the worksheet when it's created.

```ts
[
  "UID",
  "First Name",
  "Last Name",
  "Email",
  "Client Authority",
  "Osis",
  "Grade",
  "Official Class",
  "Email Domain",
  "Club Data",
  "Present Location",
];
```

This just styles the headers so it stands out.

```ts
for (let i = 0; i < 12; i++) {
  const cell = sheet.getCell(0, i);
  cell.textFormat = { bold: true };
}
```

The last part saves the changes to sheet.

```ts
await sheet.saveUpdatedCells();
```

## [Verifying Admin](src/middleware/user/verifyAdmin.ts)

Used to verify that the user is an Admin.

```ts
const admin = userRows.filter(
  (user) =>
    user.get("Client Authority") === "admin" &&
    user.get("Email") === req.body.email
);
```

If the user is an admin, it will return a value of 1.
If not, it will send a message that they're not an admin.

```ts
if (admin.length === 0) {
  res.json({ message: "You are not an admin!" });
} else {
  return next();
}
```

## [Image Upload](src/middleware/user/uploadImage.ts)

Allows the club advisor or president to upload an image of the club and saves it on the drive.

```ts
const metaSheet = await service.files.list({
  q: `name = 'Club MetaData' and '${folderId}' in parents`,
  fields: "nextPageToken, files(id, name)",
});
```
