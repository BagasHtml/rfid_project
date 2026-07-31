import { Router } from 'express';
import * as service from '../services/attendance.js';
import { registerClient } from '../sse/clients.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { PostAttendanceSchema, GetTodayQuerySchema } from '../validators/attendance.js';
const router = Router();
router.post('/', validate(PostAttendanceSchema), asyncHandler(async (req, res) => {
    const result = await service.processAttendance(req.body.uid);
    res.status(result.statusCode).json(result);
}));
router.get('/today', validateQuery(GetTodayQuerySchema), asyncHandler(async (req, res) => {
    const { limit, offset } = req.query;
    const result = await service.getTodayList(limit, offset);
    res.json({ success: true, ...result });
}));
router.get('/stream', (req, res) => {
    registerClient(req, res);
});
export default router;
