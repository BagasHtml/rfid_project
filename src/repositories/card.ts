import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cards, students } from '../db/schema.js';
import { countRows, getInsertId, clampPagination, findFirst } from '../db/helpers.js';

export interface ActiveCardRow {
  uid: string;
  studentId: number;
  studentName: string;
  studentClass: string;
  studentNis: string;
}

export interface RecentCardRow extends ActiveCardRow {
  id: number;
  isActive: boolean;
  createdAt: Date | null;
}

const studentColumns = {
  studentName: students.name,
  studentClass: students.class,
  studentNis: students.nis,
};

const activeColumns = {
  uid: cards.uid,
  studentId: cards.studentId,
  ...studentColumns,
};

const recentColumns = {
  id: cards.id,
  isActive: cards.isActive,
  createdAt: cards.createdAt,
  ...activeColumns,
};

const cardJoinCond = eq(cards.studentId, students.id);

export async function insertCard(uid: string, studentId: number): Promise<number> {
  return getInsertId(db.insert(cards).values({ uid, studentId }));
}

async function countCards(className?: string): Promise<number> {
  if (!className) return countRows(cards);

  const rows = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(cards)
    .innerJoin(students, cardJoinCond)
    .where(and(eq(cards.isActive, true), eq(students.class, className)));
  return Number(rows[0].total);
}

export async function listRecent(
  limit: number = 20,
  offset: number = 0,
  className?: string,
): Promise<{ data: RecentCardRow[]; total: number }> {
  const page = clampPagination(limit, offset, 100);
  const where = className ? eq(students.class, className) : undefined;

  const data = await db
    .select(recentColumns)
    .from(cards)
    .innerJoin(students, cardJoinCond)
    .where(where)
    .orderBy(desc(cards.id))
    .limit(page.limit)
    .offset(page.offset);

  const total = await countCards(className);

  return { data, total };
}

export async function findActiveByUid(uid: string): Promise<ActiveCardRow | null> {
  return findFirst(
    db
      .select(activeColumns)
      .from(cards)
      .innerJoin(students, cardJoinCond)
      .where(and(eq(cards.uid, uid), eq(cards.isActive, true), eq(students.isActive, true)))
      .limit(1),
  );
}
