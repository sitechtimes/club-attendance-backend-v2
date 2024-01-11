import { service } from "../../app";
import { Request, Response } from "express";
import { clubNameDoc } from "../../app";

export const deleteFile = async (req: Request, res: Response) => {
  const fileId = req.body.id;
  try {
    fileId.forEach(async (id: string) => {
      const response = await service.files.delete({
        fileId: `${id}`,
      });
      return response;
    });
    res.json("deleted files");
  } catch (error) {
    console.log(error);
  }
};

export const listFileAndRemove = async (req: Request, res: Response) => {
  const response: object[] = await service.files.list({
    q: "",
    fields: "nextPageToken, files(id, name)",
    spaces: "drive",
  });
  try {
    const Remove = async () => {
      response.data.files.forEach(async (club) => {
        const removeFile = await service.files.delete({
          fileId: `${club.id}`,
        });
      });
    };

    await Remove();
    res.json("Files deleted successfully");
  } catch (error) {
    console.log(error);
  }
}; /*`(mimeType = "image/jpeg")`  */

export const listFile = async (req: Request, res: Response) => {
  const response = await service.files.list({
    q: "",
    fields: "nextPageToken, files(id, name)",
    spaces: "drive",
  });
  try {
    res.json(response.data.files);
  } catch (error) {
    console.log(error);
  }
};

export const listObject = async (req: Request, res: Response) => {
  await clubNameDoc.loadInfo();
  await clubNameDoc.loadInfo();
  const clubNameSheet = clubNameDoc.sheetsByIndex[0];
  const rows = await clubNameSheet.getRows();

  const indexData = rows[1].toObject();
  try {
    res.json(indexData);
  } catch (error) {
    res.json(error);
  }
};
