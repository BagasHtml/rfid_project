import { Router, Request, Response } from 'express';
import * as service from '../services/attendance.js';
import { registerClient } from '../sse/clients.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireAuth, requireAdmin, enforceClassScope } from '../middleware/auth.js';
import { attendanceUidLimiter, attendanceIpLimiter, readIpLimiter, sseIpLimiter, writeIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import {
  PostAttendanceSchema,
  UpdateStatusSchema,
  ManualAttendanceSchema,
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

router.put(
  '/:id/status',
  requireAuth,
  requireAdmin,
  validate(UpdateStatusSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID tidak valid' });
      return;
    }
    const result = await service.updateStatus(id, req.body.status, req.body.keterangan);
    sendResult(res, result);
  }),
);

router.post(
  '/manual',
  requireAuth,
  requireAdmin,
  validate(ManualAttendanceSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.setManualStatus(req.body.student_id, req.body.status, req.body.keterangan);
    sendResult(res, result);
  }),
);

export default router;
