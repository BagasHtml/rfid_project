import { Router, Request, Response } from 'express';
import * as service from '../services/attendance.js';
import { registerClient } from '../sse/clients.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireAuth, enforceClassScope } from '../middleware/auth.js';
import { attendanceUidLimiter, attendanceIpLimiter, readIpLimiter, sseIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import {
  PostAttendanceSchema,
  GetTodayQuerySchema,
  GetStatusQuerySchema,
  type GetTodayQueryInput,
  type GetStatusQueryInput,
} from '../validators/attendance.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  validate(PostAttendanceSchema),
  attendanceUidLimiter,
  attendanceIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.processAttendance(req.body.uid, req.user!.class);
    sendResult(res, result);
  }),
);

router.get(
  '/today',
  requireAuth,
  validateQuery(GetTodayQuerySchema),
  readIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset, class: requestedClass } = req.query as unknown as GetTodayQueryInput;
    const className = enforceClassScope(req, res, requestedClass);
    if (className === null) return;
    const result = await service.getTodayList(limit, offset, className);
    res.json({ success: true, ...result });
  }),
);

router.get(
  '/status',
  requireAuth,
  validateQuery(GetStatusQuerySchema),
  readIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset, class: requestedClass, q } = req.query as unknown as GetStatusQueryInput;
    const className = enforceClassScope(req, res, requestedClass);
    if (className === null) return;
    const result = await service.getStatusList(limit, offset, className, q);
    res.json({ success: true, ...result });
  }),
);

router.get(
  '/stream',
  requireAuth,
  sseIpLimiter,
  (req: Request, res: Response) => {
    registerClient(req, res, req.user!.class);
  },
);

export default router;
