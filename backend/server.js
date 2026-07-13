require('dotenv').config();

const cors = require('cors');
const express = require('express');

const chatRoutes = require('./routes/chatRoutes');
const { ensureUploadsDirectory } = require('./utils/fileProcessor');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3001', 10);

const parseAllowedOrigins = () => {
  const value = typeof process.env.CORS_ORIGIN === 'string' ? process.env.CORS_ORIGIN : '';

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'ana-backend',
  });
});

app.use('/chat', chatRoutes);

app.use((request, _response, next) => {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use((error, _request, response, _next) => {
  const isPayloadTooLarge = error?.code === 'LIMIT_FILE_SIZE';
  const statusCode =
    Number.isInteger(error?.statusCode) && error.statusCode > 0
      ? error.statusCode
      : isPayloadTooLarge
        ? 413
        : 500;

  const message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message
      : 'Internal server error.';

  if (statusCode >= 500) {
    console.error('[backend] request_failed', error);
  }

  response.status(statusCode).json({
    error: isPayloadTooLarge ? 'Uploaded file is too large.' : message,
  });
});

const startServer = async () => {
  await ensureUploadsDirectory();

  app.listen(PORT, () => {
    console.info(`[backend] listening on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[backend] startup_failed', error);
    process.exit(1);
  });
}

module.exports = app;
