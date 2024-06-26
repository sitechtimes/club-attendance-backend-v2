import { Request, Response } from "express";
import { google } from "googleapis";
import { oauth2Client, redirectUri } from "../app";
import { userDataSpreadSheet } from "../app";
/**
 * Callback endpoint for the OAuth2 authentication process.
 * Handles the authentication code received from the OAuth2 provider,
 * exchanges it for access tokens, retrieves user information,
 * and performs actions based on the user's data.
 * @param req The request object containing information about the HTTP request.
 * @param res The response object used to send the HTTP response.
 */
export const oauth2callback = async (req: Request, res: Response) => {
  try {
    //need to store authentication on client side so it can be used for authentication for other routes (ex. you cant perform certaian actions unless you're an admin)
    const authorizationCode = req.query.code as string;
    const { tokens } = await oauth2Client.getToken(authorizationCode);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log(userInfo.data);

    const {
      id: uid,
      given_name: firstName,
      family_name: lastName,
      email,
    } = userInfo.data;
    /*   const uid = userInfo.data.id;
  const firstName = userInfo.data.given_name;
  const lastName = userInfo.data.family_name;
  const email = userInfo.data.email; */

    await userDataSpreadSheet.loadInfo(); // loads document properties and worksheets

    const userDataSheet = userDataSpreadSheet.sheetsById[0];
    const rows = await userDataSheet.getRows();
    const userRow = rows.find((row) => row.get("Email") === email);


    if (!userRow) {
      // res.json({ message: 'User already exists!' });
      const user = await userDataSheet.addRow({
        UID: `${uid}`,
        "First Name": `${firstName}`,
        "Last Name": `${lastName}`,
        Email: `${email}`,
        "Client Authority": "User", // FIGURE OUT CLIENT AUTHORITY HIERACHY
        "Club Data": JSON.stringify({ PresidentOf: [], MemberOf: [] }),
        "Present Location": `${null}`,
      });

      console.log(user.get("Club Data"))

      // sends cookie for new users
      res.cookie(
        "user_data",
        {
          uid: uid,
          firstName: firstName,
          lastName: lastName,
          email: email,
          picture: userInfo.data.picture,
          role: user?.get("Client Authority"),
          isAuthenticated: true,
          ClubData: JSON.parse(user?.get("Club Data")),
        },
        { maxAge: 900000 }
      );
      res.redirect("http://localhost:5173");
    } else {
      // sends cookie for existing users 
      res.cookie(
        "user_data",
        {
          uid: uid,
          firstName: firstName,
          lastName: lastName,
          email: email,
          picture: userInfo.data.picture,
          role: userRow?.get("Client Authority"),
          isAuthenticated: true,
          ClubData: JSON.parse(userRow?.get("Club Data")),
        },
        { maxAge: 900000 }
      );
      res.redirect("http://localhost:5173");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

export const oauth2 = (req: Request, res: Response) => {
  // Redirect the user to the redirectUri generated by the oauth2Client
  res.redirect(redirectUri);
};
export const returnRedirecUrl = (req: Request, res: Response) => {
  res.json({ redirectUri: redirectUri });
};
