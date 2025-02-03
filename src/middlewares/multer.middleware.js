import multer from "multer";

const storage = multer.diskStorage({
  // NOTE: this file access is not available in express thats why multer is used
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage: storage,
});
