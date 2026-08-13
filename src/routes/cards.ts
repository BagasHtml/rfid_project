import { Router, Request, Response } from 'express';
import * as service from '../services/cards.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireAuth, requireAdmin, enforceClassScope } from '../middleware/auth.js';
import { writeIpLimiter, readIpLimiter } from '../middleware/rateLimit.js';
import { sendResult } from '../utils/http.js';
import { RegisterCardSchema, GetRecentCardsQuerySchema, type GetRecentCardsQueryInput } from '../validators/cards.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  validateQuery(GetRecentCardsQuerySchema),
  readIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset, class: requestedClass } = req.query as unknown as GetRecentCardsQueryInput;
    const className = enforceClassScope(req, res, requestedClass);
    if (className === null) return;
    const result = await service.listRecent(limit, offset, className);
    res.json({ success: true, ...result });
  }),
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(RegisterCardSchema),
  writeIpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.registerCard(req.body.uid, req.body.student_id);
    sendResult(res, result);
  }),
);

export default router;
