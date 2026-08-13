import { Router, Request, Response } from 'express';
import * as service from '../services/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { writeIpLimiter, readIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import { ClassNameSchema, type ClassNameInput } from '../validators/admin.js';

const router = Router();

router.get(
  '/classes',
  requireAuth,
  requireAdmin,
  readIpLimiter,
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await service.listClasses();
    res.json({ success: true, data });
  }),
);

router.post(
  '/classes',
  requireAuth,
  requireAdmin,
  validate(ClassNameSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as ClassNameInput;
    const result = await service.createClass(body.class);
    sendResult(res, result);
  }),
);

router.post(
  '/classes/reset-password',
  requireAuth,
  requireAdmin,
  validate(ClassNameSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as ClassNameInput;
    const result = await service.resetClassPassword(body.class);
    sendResult(res, result);
  }),
);

router.post(
  '/classes/remove-account',
  requireAuth,
  requireAdmin,
  validate(ClassNameSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as ClassNameInput;
    const result = await service.removeClassAccount(body.class);
    sendResult(res, result);
  }),
);

export default router;
