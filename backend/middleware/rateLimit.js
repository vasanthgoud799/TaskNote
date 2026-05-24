const buckets = new Map();

export const rateLimit = ({ windowMs = 60_000, max = 5 } = {}) => (req, res, next) => {
  const key = `${req.ip}:${req.userId || "public"}:${req.originalUrl}`;
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (bucket.resetAt < now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > max) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }

  next();
};
