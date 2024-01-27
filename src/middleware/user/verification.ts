import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";

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
