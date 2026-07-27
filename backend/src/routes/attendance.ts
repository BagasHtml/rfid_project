import { Router, Request, Response } from 'express';
import * as service from '../services/attendance.js';
import { registerClient } from '../sse/clients.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { PostAttendanceSchema, GetTodayQuerySchema } from '../validators/attendance.js';

const router = Router();

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = PostAttendanceSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Data tidak valid';
    res.status(400).json({ success: false, message });
    return;
  }

  const result = await service.processAttendance(parsed.data.uid);
  const statusCode = result.success ? 200 : 409;

  res.status(statusCode).json(result);
}));

router.get('/today', asyncHandler(async (req: Request, res: Response) => {
  const parsed = GetTodayQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Parameter tidak valid';
    res.status(400).json({ success: false, message });
    return;
  }

  const result = await service.getTodayList(parsed.data.limit, parsed.data.offset);
  res.json({ success: true, ...result });
}));

router.get('/stream', (req: Request, res: Response) => {
  registerClient(req, res);
});

export default router;
