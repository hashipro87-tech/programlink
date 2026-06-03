// errorHandler.js — Global error handler middleware
// Catches any error thrown in a route and returns a consistent JSON response
// so the frontend always receives the same error shape

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, fields: err.fields });
  }

  // PostgreSQL unique constraint violation (e.g. duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // Default: internal server error
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : err.message;

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
