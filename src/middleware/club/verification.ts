import { Request, Response, NextFunction } from "express";
import { serviceAccountAuth } from "../../app";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { Authority } from "../../enums/authority";

/**
 * Middleware function to verify user authority.
 * @param authority - An array of strings representing the required authorities to access the page.
 * @returns Middleware function.
 */
export const verifyAuthority = (authority: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uuid = req.params.uuid || req.body.uuid;

      const clubName = req.params.clubName || req.body.clubName;

      const user = new GoogleSpreadsheet(
        process.env.USER_DATA_SPREADSHEET_ID as string,
        serviceAccountAuth
      );

      await user.loadInfo();

      const userSheet = user.sheetsByIndex[0];
      const userRows = await userSheet.getRows();

      const userRow = userRows.find((row) => row.get("UID") == uuid);

      if (userRow) {
        const userAuthority = userRow.get("Client Authority");
        if (
          authority.includes(Authority.admin) &&
          userAuthority === Authority.admin
        ) {
          console.log("User Authority: " + userAuthority);
          next();
        } else if (authority.includes(Authority.club_president)) {
          const clubDataObject = JSON.parse(await userRow.get("Club Data"));
          console.log(clubDataObject);
          const isPresident = clubDataObject.PresidentOf.includes(clubName);
          console.log(isPresident);
          if (isPresident) {
            next();
          } else {
            res
              .status(403)
              .json("User doesn't have permission to access this page");
          }
        } else {
          res.json("User doesn't have permission to access this page");
        }
      } else {
        res.status(403).json("User not found");
      }
    } catch (error) {
      next(error);
    }
  };
};
