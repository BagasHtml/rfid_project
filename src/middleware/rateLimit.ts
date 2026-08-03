import { Request, Response } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

const WINDOW_MS = 60_000;

function tooManyRequestsHandler(_req: Request, res: Response) {
  res.status(429).json({
    success: false,
    message: 'Terlalu banyak percobaan, coba lagi dalam beberapa saat',
  });
}

export const attendanceUidLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.uid || ipKeyGenerator(req.ip || ''),
  handler: tooManyRequestsHandler,
});

export const attendanceIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const writeIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: tooManyRequestsHandler,
});
