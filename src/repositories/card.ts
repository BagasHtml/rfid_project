import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cards, students } from '../db/schema.js';
import { countRows, getInsertId } from '../db/helpers.js';

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

export async function insertCard(uid: string, studentId: number): Promise<number> {
  return getInsertId(db.insert(cards).values({ uid, studentId }));
}

export async function listRecent(limit: number = 20, offset: number = 0): Promise<{ data: RecentCardRow[]; total: number }> {
  const data = await db
    .select(recentColumns)
    .from(cards)
    .innerJoin(students, eq(cards.studentId, students.id))
    .orderBy(desc(cards.id))
    .limit(limit)
    .offset(offset);

  const total = await countRows(cards);

  return { data, total };
}

export async function findActiveByUid(uid: string): Promise<ActiveCardRow | null> {
  const rows = await db
    .select(activeColumns)
    .from(cards)
    .innerJoin(students, eq(cards.studentId, students.id))
    .where(and(eq(cards.uid, uid), eq(cards.isActive, true), eq(students.isActive, true)))
    .limit(1);

  return rows[0] ?? null;
}
