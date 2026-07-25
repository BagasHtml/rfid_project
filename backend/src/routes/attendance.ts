import { Router, Request, Response } from 'express';
import * as service from '../services/attendance.js';
import { registerClient } from '../sse/clients.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const UID_PATTERN = /^[0-9A-Fa-f]{8,24}$/;

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { uid } = req.body;

  if (!uid || typeof uid !== 'string') {
    res.status(400).json({ success: false, message: 'UID tidak valid' });
    return;
  }

  const sanitized = uid.trim().toUpperCase();

  if (!UID_PATTERN.test(sanitized)) {
    res.status(400).json({ success: false, message: 'Format UID tidak valid' });
    return;
  }

  const result = await service.processAttendance(sanitized);
  const statusCode = result.success ? 200 : 409;

  res.status(statusCode).json(result);
}));

router.get('/today', asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getTodayList();
  res.json({ success: true, data });
}));

router.get('/stream', (req: Request, res: Response) => {
  registerClient(req, res);
});

export default router;