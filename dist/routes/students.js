import { Router } from 'express';
import * as service from '../services/students.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { writeIpLimiter } from '../middleware/rateLimit.js';
import { RegisterStudentSchema, GetStudentsQuerySchema } from '../validators/students.js';
const router = Router();
router.get('/active', asyncHandler(async (_req, res) => {
    const data = await service.listActive();
    res.json({ success: true, data });
}));
router.get('/', validateQuery(GetStudentsQuerySchema), asyncHandler(async (req, res) => {
    const { limit, offset } = req.query;
    const result = await service.listStudents(limit, offset);
    res.json({ success: true, ...result });
}));
router.post('/', validate(RegisterStudentSchema), writeIpLimiter, asyncHandler(async (req, res) => {
    const body = req.body;
    const result = await service.createStudent(body.nis, body.name, body.class);
    res.status(result.statusCode).json(result);
}));
export default router;
