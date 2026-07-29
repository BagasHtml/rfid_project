import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cards, students } from '../db/schema.js';
import type { CardWithStudent } from '../types/index.js';

export async function findActiveByUid(uid: string): Promise<CardWithStudent | null> {
  const rows = await db
    .select({
      uid: cards.uid,
      studentId: cards.studentId,
      studentName: students.name,
      studentClass: students.class,
      studentNis: students.nis,
    })
    .from(cards)
    .innerJoin(students, eq(cards.studentId, students.id))
    .where(and(eq(cards.uid, uid), eq(cards.isActive, true), eq(students.isActive, true)))
    .limit(1);

  if (rows.length === 0) return null;

  return {
    uid: rows[0].uid,
    student_id: rows[0].studentId,
    student_name: rows[0].studentName,
    student_class: rows[0].studentClass,
    student_nis: rows[0].studentNis,
  };
}
