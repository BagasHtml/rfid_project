import { Router, Request, Response } from 'express';
import * as service from '../services/students.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireAuth, requireAdmin, enforceClassScope } from '../middleware/auth.js';
import { writeIpLimiter, readIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import {
  RegisterStudentSchema,
  UpdateStudentSchema,
  GetStudentsQuerySchema,
  StudentIdParamSchema,
  ImportStudentsSchema,
  GetStudentHistoryQuerySchema,
  type RegisterStudentInput,
  type UpdateStudentInput,
  type GetStudentsQueryInput,
  type StudentIdParamInput,
  type ImportStudentsInput,
  type GetStudentHistoryQueryInput,
} from '../validators/students.js';

const router = Router();

router.get(
  '/active',
  requireAuth,
  readIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const className = req.user!.role === 'admin' ? undefined : req.user!.class ?? undefined;
    const data = await service.listActive(className);
    res.json({ success: true, data });
  }),
);

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

router.get(
  '/',
  requireAuth,
  validateQuery(GetStudentsQuerySchema),
  readIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset, q, class: requestedClass } = req.query as unknown as GetStudentsQueryInput;
    const className = enforceClassScope(req, res, requestedClass);
    if (className === null) return;
    const result = await service.listStudents(limit, offset, q, className);
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(RegisterStudentSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as RegisterStudentInput;
    const result = await service.createStudent(body.nis, body.name, body.class);
    sendResult(res, result);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(StudentIdParamSchema, 'params'),
  validate(UpdateStudentSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as StudentIdParamInput;
    const body = req.body as unknown as UpdateStudentInput;
    const result = await service.updateStudent(id, body.nis, body.name, body.class);
    sendResult(res, result);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(StudentIdParamSchema, 'params'),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as StudentIdParamInput;
    const result = await service.deleteStudent(id);
    sendResult(res, result);
  }),
);

router.post(
  '/import',
  requireAuth,
  requireAdmin,
  validate(ImportStudentsSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as unknown as ImportStudentsInput;
    const result = await service.importStudents(body.lines);
    sendResult(res, result);
  }),
);

router.get(
  '/:id/attendance',
  requireAuth,
  validate(StudentIdParamSchema, 'params'),
  validateQuery(GetStudentHistoryQuerySchema),
  readIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as StudentIdParamInput;
    const { days } = req.query as unknown as GetStudentHistoryQueryInput;
    const result = await service.getStudentHistory(id, days, req.user!.class);
    sendResult(res, result);
  }),
);

export default router;
