import { Router, Request, Response } from 'express';
import * as service from '../services/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loginIpLimiter, loginUserLimiter } from '../middleware/rateLimit.js';
import { LoginSchema, ChangePasswordSchema, type LoginInput, type ChangePasswordInput } from '../validators/auth.js';

const router = Router();

router.post(
  '/login',
  validate(LoginSchema),
  loginUserLimiter,
  loginIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as LoginInput;
    const result = await service.login(body.username, body.password);

    if (result.success && result.cookie) {
      res.setHeader('Set-Cookie', result.cookie);
    }

    res.status(result.statusCode).json({ success: result.success, message: result.message, user: result.user });
  }),
);

router.post(
  '/logout',
  (_req: Request, res: Response) => {
    res.clearCookie('sid', { path: '/' });
    res.json({ success: true, message: 'Berhasil keluar' });
  },
);

router.post(
  '/change-password',
  requireAuth,
  validate(ChangePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as ChangePasswordInput;
    const result = await service.changePassword(req.user!.id, body.old_password, body.new_password);
    res.status(result.statusCode).json({ success: result.success, message: result.message });
  }),
);

router.get(
  '/me',
  requireAuth,
  (req: Request, res: Response) => {
    res.json({ success: true, user: req.user });
  },
);

export default router;
