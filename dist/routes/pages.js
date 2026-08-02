import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
    res.render('index', { page: 'index' });
});
router.get('/register', (_req, res) => {
    res.render('register', { page: 'register' });
});
router.get('/students', (_req, res) => {
    res.render('students', { page: 'students' });
});
export default router;
