import { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import { oauth2Client, redirectUri } from "../app";
import { userDataSpreadSheet } from "../app";
import { content } from "googleapis/build/src/apis/content";

export const oauth2 = (req: Request, res: Response, next: NextFunction) => {
  res.redirect(redirectUri);
};

export const oauth2callback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //need to store authentication on client side so it can be used for authentication for other routes (ex. you cant perform certaian actions unless you're an admin)
  const authorizationCode = req.query.code;
  const { tokens } = await oauth2Client.getToken(authorizationCode as string);
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  console.log(userInfo.data);
  const uid = userInfo.data.id;
  const firstName = userInfo.data.given_name;
  const lastName = userInfo.data.family_name;
  const email = userInfo.data.email;

  await userDataSpreadSheet.loadInfo(); // loads document properties and worksheets

  const userDataSheet = userDataSpreadSheet.sheetsById[0];
  const rows = await userDataSheet.getRows();
  const userRow = rows.find((row) => row._rawData[3] === email);

  if (!userRow) {
    // res.json({ message: 'User already exists!' });
    await userDataSheet.addRow([
      uid as string,
      firstName as string,
      lastName as string,
      email as string,
      "user",
    ]);
    // res.send({ message: 'User added!' });
  }

  res.cookie(
    "user_data",
    {
      uid: uid,
      firstName: firstName,
      lastName: lastName,
      email: email,
      picture: userInfo.data.picture,
      role: userRow?.get("Client Authority"),
      osis: userRow?.get("OSIS"),
      grade: userRow?.get("Grade"),
      isAuthenicated: true,
    },
    { maxAge: 900000 }
  );
  res.redirect("http://localhost:5173");
};

export const returnRedirecUrl = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({ redirectUri: redirectUri });
};
