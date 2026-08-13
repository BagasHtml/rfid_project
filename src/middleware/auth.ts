import { Request, Response, NextFunction } from 'express';
import { getSessionUser } from '../utils/auth.js';
import { normalizeClassName } from '../utils/format.js';
import type { AuthUser } from '../types/user.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Sesi tidak valid atau sudah berakhir' });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Sesi tidak valid atau sudah berakhir' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Halaman ini khusus administrator.' });
    return;
  }
  next();
}

export function canonicalClass(value: string): string {
  return normalizeClassName(value).replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function enforceClassScope(req: Request, res: Response, requestedClass?: string): string | undefined | null {
  const user = req.user!;
  if (user.role === 'admin') {
    return requestedClass ? normalizeClassName(requestedClass) : undefined;
  }
  const ownClass = normalizeClassName(user.class ?? '') || undefined;
  if (requestedClass && canonicalClass(requestedClass) !== canonicalClass(ownClass ?? '')) {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda hanya dapat mengakses data kelas Anda sendiri.',
    });
    return null;
  }
  return ownClass;
}

export function requirePageAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.redirect('/login?msg=sesi');
    return;
  }
  req.user = user;
  next();
}

export function requirePageAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    res.redirect('/login');
    return;
  }
  if (user.role !== 'admin') {
    res.redirect(`/kelas/${encodeURIComponent(user.class ?? '')}`);
    return;
  }
  next();
}
