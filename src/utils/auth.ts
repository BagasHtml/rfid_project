import { Request } from 'express';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { env } from '../config/env.js';
import type { AuthUser, UserRole } from '../types/user.js';

const COOKIE_NAME = 'sid';
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

interface TokenPayload {
  sub: number;
  username: string;
  class: string | null;
  iat: number;
  exp: number;
}

function sign(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', env.sessionSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verify(token: string): TokenPayload | null {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex <= 0) return null;

  const body = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = createHmac('sha256', env.sessionSecret).update(body).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!Number.isInteger(payload.sub) || typeof payload.username !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }
    if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const salt = parts[1];
  let expected: Buffer;
  try {
    expected = Buffer.from(parts[2], 'hex');
  } catch {
    return false;
  }

  const candidate = scryptSync(password, salt, expected.length) as Buffer;
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function roleOf(userClass: string | null): UserRole {
  return userClass === null ? 'admin' : 'class';
}

export function createSession(user: { id: number; username: string; class: string | null }): string {
  const now = Math.floor(Date.now() / 1000);
  return sign({
    sub: user.id,
    username: user.username,
    class: user.class,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  });
}

export function createAuthCookie(token: string): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${TOKEN_TTL_SECONDS}`,
  ];
  if (env.nodeEnv === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function getSessionUser(req: Request): AuthUser | null {
  const header = req.headers.cookie;
  if (!header) return null;

  const token = header
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE_NAME}=`));

  if (!token) return null;

  const payload = verify(token.slice(COOKIE_NAME.length + 1));
  if (!payload) return null;

  return {
    id: payload.sub,
    username: payload.username,
    class: payload.class,
    role: roleOf(payload.class),
  };
}
