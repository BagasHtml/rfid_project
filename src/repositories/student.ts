import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { students } from '../db/schema.js';
import { formatDateTime } from '../utils/date.js';
import type { StudentRecord } from '../types/index.js';

export interface StudentListItem {
  id: number;
  nis: string;
  name: string;
  class: string;
}

export async function listActive(): Promise<StudentListItem[]> {
  const rows = await db
    .select({
      id: students.id,
      nis: students.nis,
      name: students.name,
      class: students.class,
    })
    .from(students)
    .where(eq(students.isActive, true))
    .orderBy(students.name);

  return rows.map(r => ({ id: r.id, nis: r.nis, name: r.name, class: r.class }));
}

export async function findById(id: number): Promise<StudentListItem | null> {
  const rows = await db
    .select({
      id: students.id,
      nis: students.nis,
      name: students.name,
      class: students.class,
    })
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertStudent(nis: string, name: string, className: string): Promise<number> {
  const [header] = await db
    .insert(students)
    .values({ nis, name, class: className })
    .then(r => r as unknown as [import('mysql2/promise').ResultSetHeader]);

  return header.insertId;
}

export async function listStudents(limit: number = 20, offset: number = 0): Promise<{ data: StudentRecord[]; total: number }> {
  const rows = await db
    .select({
      id: students.id,
      nis: students.nis,
      name: students.name,
      class: students.class,
      isActive: students.isActive,
      createdAt: students.createdAt,
    })
    .from(students)
    .orderBy(desc(students.id))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(students);

  return {
    data: rows.map(r => ({
      id: r.id,
      nis: r.nis,
      name: r.name,
      class: r.class,
      is_active: r.isActive,
      created_at: r.createdAt ? formatDateTime(r.createdAt) : null,
    })),
    total: Number(countResult[0].total),
  };
}
