import { Router } from 'express';
import * as service from '../services/students.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    const data = await service.listActive();
    res.json({ success: true, data });
}));
export default router;
