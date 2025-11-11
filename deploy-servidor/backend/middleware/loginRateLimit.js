// Simple in-memory rate limiter for login endpoint.
// For production use a distributed store (Redis) and a battle-tested lib (express-rate-limit).
const attempts = new Map();
// window in ms, max requests per window
const WINDOW_MS = Number(process.env.LOGIN_RATE_WINDOW_MS) || 60 * 1000; // 1 minute
const MAX_REQUESTS = Number(process.env.LOGIN_MAX_REQUESTS) || 30;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (now - entry.start > WINDOW_MS * 2) attempts.delete(key);
  }
}

setInterval(cleanup, WINDOW_MS).unref();

module.exports = function loginRateLimit(req, res, next) {
  try {
    const key = (req.ip || req.headers['x-forwarded-for'] || 'unknown') + '|' + (req.body && req.body.email ? req.body.email : 'noemail');
    const now = Date.now();
    const entry = attempts.get(key) || { count: 0, start: now };
    if (now - entry.start > WINDOW_MS) {
      entry.count = 0;
      entry.start = now;
    }
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > MAX_REQUESTS) {
      // Too many requests
      return res.status(429).json({ success: false, message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
    }
    next();
  } catch (e) {
    // on error, don't block
    next();
  }
};
