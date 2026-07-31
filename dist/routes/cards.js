import { Router } from 'express';
import * as service from '../services/cards.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { RegisterCardSchema, GetRecentCardsQuerySchema } from '../validators/cards.js';
const router = Router();
router.get('/', validateQuery(GetRecentCardsQuerySchema), asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const data = await service.listRecent(limit);
    res.json({ success: true, data });
}));
router.post('/', validate(RegisterCardSchema), asyncHandler(async (req, res) => {
    const result = await service.registerCard(req.body.uid, req.body.student_id);
    res.status(result.statusCode).json(result);
}));
export default router;
