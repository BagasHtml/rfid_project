import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AnyMySqlTable } from 'drizzle-orm/mysql-core';
import type { ResultSetHeader } from 'mysql2/promise';
import { db } from './index.js';

export async function getInsertId(promise: PromiseLike<unknown>): Promise<number> {
  const [header] = (await promise) as unknown as [ResultSetHeader];
  return header.insertId;
}

export async function getAffectedRows(promise: PromiseLike<unknown>): Promise<number> {
  const [header] = (await promise) as unknown as [ResultSetHeader];
  return header.affectedRows;
}

export async function countRows(table: AnyMySqlTable, where?: SQL): Promise<number> {
  const builder = db.select({ total: sql<number>`COUNT(*)` }).from(table);
  const rows = where ? await builder.where(where) : await builder;
  return Number(rows[0].total);
}

export async function findFirst<T>(promise: PromiseLike<T[]>, fallback: T | null = null): Promise<T | null> {
  const rows = await promise;
  return rows[0] ?? fallback;
}

export function clampPagination(limit: number, offset: number, maxLimit: number = 200): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(Math.floor(limit), 1), maxLimit),
    offset: Math.max(Math.floor(offset), 0),
  };
}
