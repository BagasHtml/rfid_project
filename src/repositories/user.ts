import { eq, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { getInsertId, getAffectedRows, findFirst } from '../db/helpers.js';

export interface UserRow {
  id: number;
  username: string;
  passwordHash: string;
  class: string | null;
  createdAt: Date | null;
}

const userColumns = {
  id: users.id,
  username: users.username,
  passwordHash: users.passwordHash,
  class: users.class,
  createdAt: users.createdAt,
};

export async function findByUsername(username: string): Promise<UserRow | null> {
  return findFirst(
    db
      .select(userColumns)
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1),
  );
}

export async function findById(id: number): Promise<UserRow | null> {
  return findFirst(
    db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1),
  );
}

export async function createUser(username: string, passwordHash: string, className: string | null): Promise<number> {
  return getInsertId(db.insert(users).values({ username: username.toLowerCase(), passwordHash, class: className }));
}

export interface ClassAccountRow {
  id: number;
  username: string;
  class: string;
  createdAt: Date | null;
}

const classAccountColumns = {
  id: users.id,
  username: users.username,
  class: users.class,
  createdAt: users.createdAt,
};

function withNonNullClass<T extends { class: string | null }>(row: T): Omit<T, 'class'> & { class: string } {
  return { ...row, class: row.class! };
}

export async function findByClass(className: string): Promise<ClassAccountRow | null> {
  const row = await findFirst(
    db
      .select(classAccountColumns)
      .from(users)
      .where(eq(users.class, className))
      .limit(1),
  );
  return row ? withNonNullClass(row) : null;
}

export async function listClassAccounts(): Promise<ClassAccountRow[]> {
  const rows = await db
    .select(classAccountColumns)
    .from(users)
    .where(isNotNull(users.class));
  return rows.map(withNonNullClass);
}

export async function updatePassword(id: number, passwordHash: string): Promise<number> {
  return getAffectedRows(db.update(users).set({ passwordHash }).where(eq(users.id, id)));
}

export async function deleteByClass(className: string): Promise<number> {
  return getAffectedRows(db.delete(users).where(eq(users.class, className)));
}
