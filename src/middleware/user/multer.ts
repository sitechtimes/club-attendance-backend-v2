import multer from "multer";

const upload = multer({
  limits: {
    fileSize: 2000000,
  },
  fileFilter(req, file, cb) {
    console.log(req.body);
    if (!file.originalname.match(/\.(jpg|jpeg|png|csv)$/)) {
      return cb(
        new Error(
          "Image must be in the format .jpg, .jpeg, .png, Unless uploading a .csv"
        )
      );
    }
    cb(null, true);
  },
});

export { upload };
