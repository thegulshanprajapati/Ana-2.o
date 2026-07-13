const path = require('node:path');

const express = require('express');
const multer = require('multer');

const { handleChatRequest } = require('../controllers/chatController');
const {
  ensureUploadsDirectory,
  isSupportedImageMimeType,
} = require('../utils/fileProcessor');

const router = express.Router();

const toSafeFileName = (originalName = 'upload') => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const normalizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'upload';

  return `${Date.now()}-${normalizedBaseName}${extension}`;
};

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    ensureUploadsDirectory()
      .then((directory) => callback(null, directory))
      .catch((error) => callback(error));
  },
  filename: (request, file, callback) => {
    callback(null, toSafeFileName(file.originalname));
  },
});

const fileFilter = (request, file, callback) => {
  if (!isSupportedImageMimeType(file.mimetype)) {
    const error = new Error('Only image uploads are supported for this endpoint.');
    error.statusCode = 400;
    callback(error);
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
});

router.post('/', upload.single('image'), handleChatRequest);

module.exports = router;
