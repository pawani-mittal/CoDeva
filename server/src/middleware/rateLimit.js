// In-memory sliding window rate limiter
export function createRateLimiter({ windowMs = 60 * 1000, max = 30, message = 'Too many requests, please try again later.' }) {
  const requests = new Map();

  // Periodically clean up old buckets (unref so it doesn't hold open process/tests)
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now - record.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);
  timer.unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const identifier = req.user ? `${req.user._id}` : ip;
    const now = Date.now();

    const record = requests.get(identifier);

    if (!record || now - record.startTime > windowMs) {
      requests.set(identifier, {
        count: 1,
        startTime: now,
      });
      return next();
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    record.count += 1;
    next();
  };
}
