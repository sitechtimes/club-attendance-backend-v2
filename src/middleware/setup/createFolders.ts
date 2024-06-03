import { service } from "../../app";

export const createClubImageFolder = async () => {
  try {
    const folder = await service.files.create({
      // create folder called club image folder
      requestBody: {
        name: "Club Image",
        mimeType: "application/vnd.google-apps.folder",
        parents: [process.env.CLUB_ATTENDANCE_FOLDER_ID as string],
      },
      fields: "id",
    });

    console.log({ message: "Club Image Folder Created!" });

    return folder.data.id;
  } catch (error) {
    console.log(error);
  }
};
