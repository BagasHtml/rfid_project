import * as userRepo from '../repositories/user.js';
import * as studentRepo from '../repositories/student.js';
import { hashPassword } from '../utils/auth.js';
import { normalizeClassName } from '../utils/format.js';
import { ok, fail } from '../utils/http.js';
import type { AdminActionResult, ClassAccountInfo, ClassListEntry } from '../types/admin.js';

const DEFAULT_PASSWORD = process.env.CLASS_DEFAULT_PASSWORD ?? 'ganti123';

export function classToUsername(className: string): string {
  return normalizeClassName(className).toLowerCase().replace(/[\s._-]+/g, '.');
}

export async function listClasses(): Promise<ClassListEntry[]> {
  const [byClass, accounts] = await Promise.all([
    studentRepo.countGroupByClass(),
    userRepo.listClassAccounts(),
  ]);

  const countByClass = new Map(byClass.map(row => [row.class, row.count]));
  const accountByClass = new Map<string, ClassAccountInfo>(
    accounts.map(account => [account.class, { username: account.username, createdAt: account.createdAt }]),
  );

  const classNames = new Set<string>([...countByClass.keys(), ...accountByClass.keys()]);

  return [...classNames]
    .sort((a, b) => a.localeCompare(b, 'id'))
    .map(name => ({
      class: name,
      student_count: countByClass.get(name) ?? 0,
      account: accountByClass.get(name) ?? null,
    }));
}

export async function createClass(className: string): Promise<AdminActionResult> {
  const name = normalizeClassName(className);

  if (!name) return fail('Nama kelas tidak valid', 400);

  const existingAccount = await userRepo.findByClass(name);
  if (existingAccount) return fail(`Akun wali untuk kelas ${name} sudah ada ("${existingAccount.username}")`, 409);

  const username = classToUsername(name);
  const existingUser = await userRepo.findByUsername(username);
  if (existingUser) return fail(`Username "${username}" sudah dipakai akun lain`, 409);

  await userRepo.createUser(username, hashPassword(DEFAULT_PASSWORD), name);

  return ok(`Kelas ${name} dibuat beserta akun wali "${username}"`, {
    class: name,
    username,
    default_password: DEFAULT_PASSWORD,
  });
}

export async function resetClassPassword(className: string): Promise<AdminActionResult> {
  const name = normalizeClassName(className);
  const account = await userRepo.findByClass(name);

  if (!account) return fail(`Akun wali untuk kelas ${name} belum ada`, 404);

  await userRepo.updatePassword(account.id, hashPassword(DEFAULT_PASSWORD));

  return ok(`Password "${account.username}" direset ke default`, {
    username: account.username,
    default_password: DEFAULT_PASSWORD,
  });
}

export async function removeClassAccount(className: string): Promise<AdminActionResult> {
  const name = normalizeClassName(className);
  const deleted = await userRepo.deleteByClass(name);

  if (!deleted) return fail(`Akun wali untuk kelas ${name} belum ada`, 404);

  return ok(`Akun wali kelas ${name} dihapus`);
}
