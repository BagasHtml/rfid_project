import * as userRepo from '../repositories/user.js';
import { hashPassword, verifyPassword, createSession, createAuthCookie } from '../utils/auth.js';
import { ok, fail } from '../utils/http.js';
import type { AuthUser, ChangePasswordResult, LoginResult } from '../types/user.js';

function toAuthUser(user: userRepo.UserRow): AuthUser {
  return {
    id: user.id,
    username: user.username,
    class: user.class,
    role: user.class === null ? 'admin' : 'class',
  };
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const user = await userRepo.findByUsername(username);

  if (!user) {
    console.log(`[AUTH] Login gagal: username "${username}" tidak ditemukan`);
    return fail('Username atau password salah', 401);
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);

  if (!passwordOk) {
    console.log(`[AUTH] Login gagal: password salah untuk "${user.username}"`);
    return fail('Username atau password salah', 401);
  }

  const authUser = toAuthUser(user);
  const token = createSession({ id: authUser.id, username: authUser.username, class: authUser.class });
  console.log(`[AUTH] Login berhasil: "${authUser.username}" (${authUser.role})`);

  return ok('Login berhasil', { user: authUser, cookie: createAuthCookie(token) });
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<ChangePasswordResult> {
  const user = await userRepo.findById(userId);

  if (!user) return fail('Sesi tidak valid', 401);

  const passwordOk = await verifyPassword(oldPassword, user.passwordHash);

  if (!passwordOk) return fail('Password lama salah', 400);

  await userRepo.updatePassword(userId, hashPassword(newPassword));
  console.log(`[AUTH] Password diubah: "${user.username}"`);

  return ok('Password berhasil diubah');
}
