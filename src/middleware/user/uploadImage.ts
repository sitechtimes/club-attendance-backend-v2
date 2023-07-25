import { Request, Response, NextFunction } from 'express'
import { service } from '../../app'
import { Readable } from 'stream'


export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clubName = req.body.clubName;
        console.log(req.file)

        const file = await service.files.create({
            requestBody: {
                name: req.file?.originalname,
                parents: [`${process.env.CLUB_ATTENDANCE_FOLDER_ID}`],
              },
              media: {
                mimeType: req.file?.mimetype,
                body: Readable.from([req.file?.buffer]),
              },
        });
        console.log('File Id:', file.data.id);
        // return file.data.id;
        res.json({ message: 'File uploaded successfully!' })

      } catch (err) {
       res.json(err)
      }
    
}