import { service } from "../../app";
import { Request, Response } from "express";

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

export const listFile = async (req: Request, res: Response) => {
  const response = await service.files.list({
    q: `(mimeType = "image/jpeg")`,
    fields: "nextPageToken, files(id, name)",
    spaces: "drive",
  });
  try {
    res.json(response.data.files[0].id);
  } catch (error) {
    console.log(error);
  }
};
