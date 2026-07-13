const fs = require('node:fs/promises');
const path = require('node:path');

const UPLOADS_DIRECTORY = path.join(__dirname, '..', 'uploads');
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureUploadsDirectory = async () => {
  await fs.mkdir(UPLOADS_DIRECTORY, { recursive: true });
  return UPLOADS_DIRECTORY;
};

const isSupportedImageMimeType = (mimeType) =>
  SUPPORTED_IMAGE_MIME_TYPES.has(normalizeText(mimeType).toLowerCase());

const isRemoteImageUrl = (value) => /^https?:\/\/.+/i.test(normalizeText(value));

const isDataUriImage = (value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(normalizeText(value));

const fileToDataUri = async (file) => {
  if (!file?.path || !isSupportedImageMimeType(file.mimetype)) {
    throw createHttpError('Unsupported image upload.', 400);
  }

  const fileBuffer = await fs.readFile(file.path);
  return `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
};

const resolveChatImageInput = async ({ file, imageUrl, imageBase64 }) => {
  if (file) {
    return fileToDataUri(file);
  }

  const normalizedUrl = normalizeText(imageUrl);
  if (normalizedUrl) {
    if (!isRemoteImageUrl(normalizedUrl) && !isDataUriImage(normalizedUrl)) {
      throw createHttpError('imageUrl must be an http(s) URL or a valid data URI.', 400);
    }

    return normalizedUrl;
  }

  const normalizedBase64 = normalizeText(imageBase64);
  if (normalizedBase64) {
    if (!isDataUriImage(normalizedBase64)) {
      throw createHttpError(
        'imageBase64 must be a valid image data URI (for example: data:image/png;base64,...).',
        400
      );
    }

    return normalizedBase64;
  }

  return null;
};

const cleanupUploadedFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[backend] upload_cleanup_failed', error);
    }
  }
};

module.exports = {
  cleanupUploadedFile,
  ensureUploadsDirectory,
  isSupportedImageMimeType,
  resolveChatImageInput,
};
