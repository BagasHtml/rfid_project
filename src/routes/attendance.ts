import { Router, Request, Response } from 'express';
import * as service from '../services/attendance.js';
import { registerClient } from '../sse/clients.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { attendanceUidLimiter, attendanceIpLimiter, readIpLimiter, sseIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import { PostAttendanceSchema, GetTodayQuerySchema, type GetTodayQueryInput } from '../validators/attendance.js';

const router = Router();

router.post('/', validate(PostAttendanceSchema), attendanceUidLimiter, attendanceIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const result = await service.processAttendance(req.body.uid);
  sendResult(res, result);
}));

router.get('/today', validateQuery(GetTodayQuerySchema), readIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = req.query as unknown as GetTodayQueryInput;
  const result = await service.getTodayList(limit, offset);
  res.json({ success: true, ...result });
}));

router.get('/stream', sseIpLimiter, (req: Request, res: Response) => {
  registerClient(req, res);
});

export default router;
