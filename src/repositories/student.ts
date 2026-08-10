import { eq, desc, like, or, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { students } from '../db/schema.js';
import { countRows, getInsertId, getAffectedRows, clampPagination } from '../db/helpers.js';

export interface StudentListItem {
  id: number;
  nis: string;
  name: string;
  class: string;
}

export interface StudentRow extends StudentListItem {
  isActive: boolean;
  createdAt: Date | null;
}

const baseColumns = {
  id: students.id,
  nis: students.nis,
  name: students.name,
  class: students.class,
};

const fullColumns = {
  ...baseColumns,
  isActive: students.isActive,
  createdAt: students.createdAt,
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function buildSearchWhere(search: string): SQL {
  const pattern = `%${escapeLike(search)}%`;
  return or(like(students.nis, pattern), like(students.name, pattern), like(students.class, pattern))!;
}

export async function listActive(): Promise<StudentListItem[]> {
  return db
    .select(baseColumns)
    .from(students)
    .where(eq(students.isActive, true))
    .orderBy(students.name);
}

export async function countActive(): Promise<number> {
  return countRows(students, eq(students.isActive, true));
}

export async function findById(id: number): Promise<StudentListItem | null> {
  const rows = await db
    .select(baseColumns)
    .from(students)
    .where(eq(students.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertStudent(nis: string, name: string, className: string): Promise<number> {
  return getInsertId(db.insert(students).values({ nis, name, class: className }));
}

export async function updateStudent(
  id: number,
  values: { nis: string; name: string; class: string }
): Promise<number> {
  return getAffectedRows(db.update(students).set(values).where(eq(students.id, id)));
}

export async function deleteStudent(id: number): Promise<number> {
  return getAffectedRows(db.delete(students).where(eq(students.id, id)));
}

export async function listStudents(limit: number = 20, offset: number = 0, search?: string): Promise<{ data: StudentRow[]; total: number }> {
  const page = clampPagination(limit, offset, 100);
  const where = search ? buildSearchWhere(search) : undefined;

  const query = db.select(fullColumns).from(students);
  const data = where
    ? await query.where(where).orderBy(desc(students.id)).limit(page.limit).offset(page.offset)
    : await query.orderBy(desc(students.id)).limit(page.limit).offset(page.offset);

  const total = await countRows(students, where);

  return { data, total };
}
