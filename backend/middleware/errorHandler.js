/**
 * backend/middleware/errorHandler.js
 * Global error handler — used as the last middleware in server.js
 */
function errorHandler(err, req, res, next) {
  console.error('[API Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error', status });
}

module.exports = errorHandler;
