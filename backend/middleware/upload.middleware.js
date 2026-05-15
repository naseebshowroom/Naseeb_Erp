import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Only JPEG and PNG are allowed.'), false);
    }
  },
});

export default upload;
