import { Router, Request, Response } from 'express';
import * as service from '../services/cards.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { writeIpLimiter } from '../middleware/rateLimit.js';
import { RegisterCardSchema, GetRecentCardsQuerySchema, type GetRecentCardsQueryInput } from '../validators/cards.js';

const router = Router();

router.get('/', validateQuery(GetRecentCardsQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = req.query as unknown as GetRecentCardsQueryInput;
  const result = await service.listRecent(limit, offset);
  res.json({ success: true, ...result });
}));

router.post('/', validate(RegisterCardSchema), writeIpLimiter, asyncHandler(async (req: Request, res: Response) => {
  const result = await service.registerCard(req.body.uid, req.body.student_id);
  res.status(result.statusCode).json(result);
}));

export default router;
