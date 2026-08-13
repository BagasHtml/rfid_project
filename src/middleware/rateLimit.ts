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
  limit: 3000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const writeIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const readIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const sseIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const loginIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const loginUserLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username = req.body?.username;
    if (typeof username === 'string' && username.trim()) {
      return `login:${username.trim().toLowerCase()}`;
    }
    return `login:ip:${ipKeyGenerator(req.ip || '')}`;
  },
  handler: tooManyRequestsHandler,
});
