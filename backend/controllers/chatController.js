const { generateChatReply, MODEL_ID } = require('../services/aiService');
const {
  cleanupUploadedFile,
  resolveChatImageInput,
} = require('../utils/fileProcessor');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const handleChatRequest = async (request, response, next) => {
  const uploadedFilePath = request.file?.path;

  try {
    const prompt = normalizeText(request.body?.prompt || request.body?.message);

    if (!prompt) {
      throw createHttpError('Prompt is required.', 400);
    }

    const imageUrl = await resolveChatImageInput({
      file: request.file,
      imageUrl: request.body?.imageUrl,
      imageBase64: request.body?.imageBase64,
    });

    const reply = await generateChatReply({
      prompt,
      imageUrl,
    });

    response.status(200).json({
      model: MODEL_ID,
      reply,
    });
  } catch (error) {
    next(error);
  } finally {
    // Uploaded files are only a temporary transport layer for the HF request.
    await cleanupUploadedFile(uploadedFilePath);
  }
};

module.exports = {
  handleChatRequest,
};
