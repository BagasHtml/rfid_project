import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
    res.render('index');
});
router.get('/register', (_req, res) => {
    res.render('register');
});
export default router;
