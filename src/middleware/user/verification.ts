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

/**
 * Middleware function to verify user authority.
 * @param authority - An array of strings representing the required authorities to access the page.
 * @returns Middleware function.
 */
export const verifyAuthority = (authority: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uuid = req.params.uuid || req.body.uuid;
      const userSheetID = process.env.USER_DATA_SPREADSHEET_ID as string;
      const user = new GoogleSpreadsheet(userSheetID, serviceAccountAuth);

      await user.loadInfo();

      const userSheet = user.sheetsByIndex[0];
      const userRows = await userSheet.getRows();

      const userRow = userRows.find((row) => row.get("UID") === uuid);

      if (userRow) {
        const userAuthority = userRow.get("Client Authority");
        if (authority.includes(userAuthority)) {
          console.log("User Authority: " + userAuthority);
          next();
        } else {
          res
            .status(403)
            .json("User doesn't have permission to access this page");
        }
      } else {
        res.status(403).json("User not found");
      }
    } catch (error) {
      next(error);
    }
  };
};
