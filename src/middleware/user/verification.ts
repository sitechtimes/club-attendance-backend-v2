import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth, service } from "../../app";
import { GoogleSpreadsheet, GoogleSpreadsheetCell } from "google-spreadsheet";
import { authority } from "../../enums/authority";

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userDoc = new GoogleSpreadsheet(
    process.env.USER_DATA_SPREADSHEET_ID as string,
    serviceAccountAuth
  );
  await userDoc.loadInfo();
  const userSheet = userDoc.sheetsByIndex[0];
  const userRows = await userSheet.getRows();

  const admin = userRows.filter(
    (user) =>
      user.get("Client Authority") === "admin" &&
      user.get("Email") === req.body.email
  );
  console.log(admin);

  if (admin.length === 0) {
    res.json({ message: "You are not an admin!" });
  } else {
    return next();
  }
};

/* export const verifyAuthority = async (uuid: string) => {
  const userSheetID = process.env.USER_DATA_SPREADSHEET_ID as string;
  const user = new GoogleSpreadsheet(userSheetID, serviceAccountAuth);

  await user.loadInfo();

  const userSheet = user.sheetsByIndex[0];
  const userRow = await userSheet.getRows();
  const userRowLen: number = userSheet.rowCount;

  for (let i = 0; i < userRowLen; i++) {
    if (userRow[i] === undefined) {
      break;
    }
    if (userRow[i].get("UID") === uuid) {
      return userRow[i].get("Client Authority");
    }
  }
};
 */
export const verifyAuthority = (authority: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const getId = req.params.uuid;
    const postId = req.body.uuid;

    const userSheetID = process.env.USER_DATA_SPREADSHEET_ID as string;
    const user = new GoogleSpreadsheet(userSheetID, serviceAccountAuth);

    await user.loadInfo();

    const userSheet = user.sheetsByIndex[0];
    const userRow = await userSheet.getRows();
    const userRowLen: number = userSheet.rowCount;

    try {
      const setId = () => {
        if (req.method === "GET") {
          return getId;
        } else if (req.method === "POST") {
          return postId;
        }
      };

      const id = setId();

      for (let i = 0; i < userRowLen; i++) {
        if (userRow[i] === undefined) {
          break;
        }
        if (userRow[i].get("UID") === id) {
          console.log("found user");
          for (let j = 0; j < authority.length; j++) {
            if (userRow[i].get("Client Authority") === authority[j]) {
              next();
            } else {
              res
                .status(403)
                .json("user doesn't have permission to access this page");
            }
          }
        }
      }
    } catch (error) {
      return error;
    }
  };
};
