import { Request, Response, NextFunction } from "express";
import { userDataSpreadSheet } from "../../app";

export const createUserSheet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await userDataSpreadSheet.loadInfo(); // loads document properties and worksheets
    console.log(userDataSpreadSheet);

    const sheet = await userDataSpreadSheet.addSheet({
      headerValues: [
        "UID",
        "First Name",
        "Last Name",
        "Email",
        "Client Authority",
        "Club Data",
        "Present Location", // do we need this?
      ],
    });
    await sheet.updateProperties({ title: "User Data" });

    await sheet.loadCells("A1:L1");

    for (let i = 0; i < 12; i++) {
      const cell = sheet.getCell(0, i); // access cells using a zero-based index
      console.log(cell.value);
      cell.textFormat = { bold: true };
      // save all updates in one call
    }
    await sheet.saveUpdatedCells();

    res.json({ message: "User Data Sheet Created!" });
    next();
  } catch (error) {
    res.json(error);
  }
};
