import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { students } from '../db/schema.js';

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
