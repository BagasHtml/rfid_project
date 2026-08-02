import { Router, Request, Response } from 'express';
import * as service from '../services/students.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { writeIpLimiter } from '../middleware/rateLimit.js';
import { RegisterStudentSchema, GetStudentsQuerySchema, type RegisterStudentInput, type GetStudentsQueryInput } from '../validators/students.js';

const router = Router();

router.get('/active', asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listActive();
  res.json({ success: true, data });
}));

router.get('/', validateQuery(GetStudentsQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = req.query as unknown as GetStudentsQueryInput;
  const result = await service.listStudents(limit, offset);
  res.json({ success: true, ...result });
}));

router.post('/', validate(RegisterStudentSchema), writeIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as unknown as RegisterStudentInput;
  const result = await service.createStudent(body.nis, body.name, body.class);
  res.status(result.statusCode).json(result);
}));

export default router;
