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

Their are env files and keys that are required for the project to run properly

## [Attendance](src/middleware/club/attendance.ts)

### Route

#### Update Attendance

```

PATCH /updateAttendance

```

**Requests body**

Format:

```

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

```

Sample Request:

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

**Make sure _UUID_ is a valid UUID string from the User Attendance Sheet**

#### Update QR Code

```
PATCH /updateQRCode
```

**Requests Body**

```
{
    "club_name" = String
}
```

**Make sure the Club name matches an existing Club**
