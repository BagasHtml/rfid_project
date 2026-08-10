import { Router, Request, Response } from 'express';
import * as service from '../services/students.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { writeIpLimiter, readIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import {
  RegisterStudentSchema,
  UpdateStudentSchema,
  GetStudentsQuerySchema,
  StudentIdParamSchema,
  type RegisterStudentInput,
  type UpdateStudentInput,
  type GetStudentsQueryInput,
  type StudentIdParamInput,
} from '../validators/students.js';

const router = Router();

router.get('/active', readIpLimiter, asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listActive();
  res.json({ success: true, data });
}));

router.get('/', validateQuery(GetStudentsQuerySchema), readIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset, q } = req.query as unknown as GetStudentsQueryInput;
  const result = await service.listStudents(limit, offset, q);
  res.json({ success: true, ...result });
}));

router.post('/', validate(RegisterStudentSchema), writeIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as unknown as RegisterStudentInput;
  const result = await service.createStudent(body.nis, body.name, body.class);
  sendResult(res, result);
}));

router.put('/:id', validate(StudentIdParamSchema, 'params'), validate(UpdateStudentSchema), writeIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as StudentIdParamInput;
  const body = req.body as unknown as UpdateStudentInput;
  const result = await service.updateStudent(id, body.nis, body.name, body.class);
  sendResult(res, result);
}));

router.delete('/:id', validate(StudentIdParamSchema, 'params'), writeIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as StudentIdParamInput;
  const result = await service.deleteStudent(id);
  sendResult(res, result);
}));

export default router;
