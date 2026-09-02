const { rateLimit } = require('express-rate-limit');

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 10;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = rateLimit({
  windowMs: positiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  limit: positiveInteger(process.env.AUTH_RATE_LIMIT_MAX, DEFAULT_MAX_ATTEMPTS),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    message: 'Too many authentication attempts. Please try again later.'
  })
});
