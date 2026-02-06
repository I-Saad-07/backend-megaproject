import multer from "multer";

const storage = multer.diskStorage({  // diskStorage → Save to your server's disk (you're using this) & memoryStorage → Keep in RAM temporarily

  destination: function (req, file, cb) {   // req = http req object, file = info about the uploaded file, cb = callback fn to tell multer what to do
    cb(null, './public/temp')   // null = should return with no errors, 2nd param = file save location
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)   // null = should return with no errors, 2nd param = Keeps the original filename from user's computer
  }
})

export const upload = multer({
  storage: storage  // creates and uploads the configured multer instance 
})