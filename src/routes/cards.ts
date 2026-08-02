import { Router, Request, Response } from 'express';
import * as service from '../services/cards.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { writeIpLimiter } from '../middleware/rateLimit.js';
import { RegisterCardSchema, GetRecentCardsQuerySchema, type GetRecentCardsQueryInput } from '../validators/cards.js';

const router = Router();

router.get('/', validateQuery(GetRecentCardsQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { limit } = req.query as unknown as GetRecentCardsQueryInput;
  const data = await service.listRecent(limit);
  res.json({ success: true, data });
}));

router.post('/', validate(RegisterCardSchema), writeIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const result = await service.registerCard(req.body.uid, req.body.student_id);
  res.status(result.statusCode).json(result);
}));

export default router;
