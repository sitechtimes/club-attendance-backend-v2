import multer from 'multer'

  const upload = multer({
        limits: {
          fileSize: 2000000
        },
            fileFilter(req, file, cb) {
              console.log(req.body)
              if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                return cb(new Error("Please upload a jpg, jpeg or png only"));
              }
              cb(null, true);
            }
          });

export { upload }