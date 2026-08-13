import { eq, and, desc, like, or, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { students } from '../db/schema.js';
import { countRows, getInsertId, getAffectedRows, clampPagination, findFirst } from '../db/helpers.js';

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

export function buildSearchWhere(search: string): SQL {
  const pattern = `%${escapeLike(search)}%`;
  return or(like(students.nis, pattern), like(students.name, pattern), like(students.class, pattern))!;
}

export async function listClasses(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ class: students.class })
    .from(students)
    .where(eq(students.isActive, true))
    .orderBy(students.class);
  return rows.map(r => r.class);
}

export async function countGroupByClass(): Promise<Array<{ class: string; count: number }>> {
  const rows = await db
    .select({ class: students.class, count: sql<number>`COUNT(*)`.as('total') })
    .from(students)
    .where(eq(students.isActive, true))
    .groupBy(students.class)
    .orderBy(students.class);
  return rows.map(r => ({ class: r.class, count: Number(r.count) }));
}

export async function findByNisList(nisList: string[]): Promise<string[]> {
  if (nisList.length === 0) return [];
  const rows = await db
    .select({ nis: students.nis })
    .from(students)
    .where(inArray(students.nis, nisList));
  return rows.map(r => r.nis);
}

export async function insertStudentsBulk(values: Array<{ nis: string; name: string; class: string }>): Promise<number> {
  if (values.length === 0) return 0;
  return getAffectedRows(db.insert(students).values(values));
}

export async function listActive(className?: string): Promise<StudentListItem[]> {
  const where = className ? and(eq(students.isActive, true), eq(students.class, className)) : eq(students.isActive, true);
  return db
    .select(baseColumns)
    .from(students)
    .where(where)
    .orderBy(students.name);
}

export async function countActive(className?: string): Promise<number> {
  const where = className ? and(eq(students.isActive, true), eq(students.class, className)) : eq(students.isActive, true);
  return countRows(students, where);
}

export async function findById(id: number): Promise<StudentListItem | null> {
  return findFirst(
    db
      .select(baseColumns)
      .from(students)
      .where(eq(students.id, id))
      .limit(1),
  );
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

export async function listStudents(limit: number = 20, offset: number = 0, search?: string, className?: string): Promise<{ data: StudentRow[]; total: number }> {
  const page = clampPagination(limit, offset, 100);

  const conditions: SQL[] = [];
  if (search) conditions.push(buildSearchWhere(search));
  if (className) conditions.push(eq(students.class, className));

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const query = db.select(fullColumns).from(students);
  const data = where
    ? await query.where(where).orderBy(desc(students.id)).limit(page.limit).offset(page.offset)
    : await query.orderBy(desc(students.id)).limit(page.limit).offset(page.offset);

  const total = await countRows(students, where);

  return { data, total };
}
