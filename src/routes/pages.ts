import { Router } from 'express';
import { getSessionUser } from '../utils/auth.js';
import { requirePageAuth, requirePageAdmin, canonicalClass } from '../middleware/auth.js';

const router = Router();

router.get(
  '/login',
  (req, res) => {
    const user = getSessionUser(req);
    if (user) {
      const target = user.role === 'admin' ? '/' : `/kelas/${encodeURIComponent(user.class ?? '')}`;
      res.redirect(target);
      return;
    }
    res.render('login', { page: 'login' });
  },
);

router.get(
  '/',
  requirePageAuth,
  requirePageAdmin,
  (req, res) => {
    res.render('index', { page: 'index', user: req.user });
  },
);

router.get(
  '/kelas/:className',
  requirePageAuth,
  (req, res) => {
    const user = req.user!;
    const className = req.params.className;

    if (user.role === 'class' && canonicalClass(className) !== canonicalClass(user.class ?? '')) {
      res.status(403).send('Akses ditolak. Anda hanya dapat mengakses halaman kelas Anda sendiri.');
      return;
    }

    const displayClass = user.role === 'class' ? (user.class ?? className) : canonicalClass(className);
    res.render('perkelas', { page: 'kelas', user, className: displayClass });
  },
);

router.get(
  '/register',
  requirePageAuth,
  requirePageAdmin,
  (_req, res) => {
    res.render('register', { page: 'register', user: _req.user });
  },
);

router.get(
  '/students',
  requirePageAuth,
  requirePageAdmin,
  (_req, res) => {
    res.render('students', { page: 'students', user: _req.user });
  },
);

export default router;
