import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { attendance, students } from '../db/schema.js';
import { countRows, getInsertId, clampPagination, findFirst } from '../db/helpers.js';
import type { AttendanceStatus } from '../types/attendance.js';
import { buildSearchWhere } from './student.js';

export interface AttendanceRow {
  id: number;
  studentId: number;
  date: string;
  time: string;
  status: string;
}

export interface AttendanceWithStudentRow extends AttendanceRow {
  studentName: string;
  studentClass: string;
  studentNis: string;
}

const attendanceColumns = {
  id: attendance.id,
  studentId: attendance.studentId,
  date: attendance.date,
  time: attendance.time,
  status: attendance.status,
};

const withStudentColumns = {
  ...attendanceColumns,
  studentName: students.name,
  studentClass: students.class,
  studentNis: students.nis,
};

export async function findTodayAttendance(studentId: number, date: string): Promise<AttendanceRow | null> {
  return findFirst(
    db
      .select(attendanceColumns)
      .from(attendance)
      .where(and(eq(attendance.studentId, studentId), eq(attendance.date, date)))
      .limit(1),
  );
}

export async function insertAttendance(
  studentId: number,
  date: string,
  time: string,
  status: AttendanceStatus
): Promise<number> {
  return getInsertId(db.insert(attendance).values({ studentId, date, time, status }));
}

const studentJoinCond = eq(attendance.studentId, students.id);

function todayWhere(date: string, className?: string): SQL {
  if (!className) return eq(attendance.date, date);
  return and(eq(attendance.date, date), eq(students.class, className))!;
}

async function countToday(date: string, className: string | undefined, extra?: SQL): Promise<number> {
  const base = db.select({ total: sql<number>`COUNT(*)` }).from(attendance);
  const query = className ? base.innerJoin(students, studentJoinCond) : base;
  const where = extra ? and(todayWhere(date, className), extra) : todayWhere(date, className);
  const rows = await query.where(where);
  return Number(rows[0].total);
}

export async function getTodayStats(date: string, className?: string): Promise<{ onTime: number; late: number }> {
  const [onTime, late] = await Promise.all([
    countToday(date, className, eq(attendance.status, 'Tepat Waktu')),
    countToday(date, className, eq(attendance.status, 'Terlambat')),
  ]);
  return { onTime, late };
}

export async function getTodayList(
  date: string,
  limit: number = 100,
  offset: number = 0,
  className?: string,
): Promise<{ data: AttendanceWithStudentRow[]; total: number }> {
  const page = clampPagination(limit, offset, 200);
  const where = todayWhere(date, className);

  const data = await db
    .select(withStudentColumns)
    .from(attendance)
    .innerJoin(students, studentJoinCond)
    .where(where)
    .orderBy(desc(attendance.time))
    .limit(page.limit)
    .offset(page.offset);

  const total = await countToday(date, className);

  return { data, total };
}

export async function getStudentHistory(studentId: number, limit: number = 30): Promise<AttendanceRow[]> {
  return db
    .select(attendanceColumns)
    .from(attendance)
    .where(eq(attendance.studentId, studentId))
    .orderBy(desc(attendance.date), desc(attendance.time))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export interface StudentStatusRow {
  id: number;
  nis: string;
  name: string;
  class: string;
  time: string | null;
  status: string | null;
}

const studentStatusColumns = {
  id: students.id,
  nis: students.nis,
  name: students.name,
  class: students.class,
  time: attendance.time,
  status: attendance.status,
};

export async function getStudentsStatusList(
  date: string,
  limit: number = 20,
  offset: number = 0,
  className?: string,
  search?: string,
): Promise<{ data: StudentStatusRow[]; total: number }> {
  const page = clampPagination(limit, offset, 200);

  const conditions: SQL[] = [eq(students.isActive, true)];
  if (className) conditions.push(eq(students.class, className));
  if (search) conditions.push(buildSearchWhere(search));
  const where = and(...conditions);

  const dateCond = and(studentJoinCond, eq(attendance.date, date));

  const data = await db
    .select(studentStatusColumns)
    .from(students)
    .leftJoin(attendance, dateCond)
    .where(where)
    .orderBy(sql`${attendance.id} IS NULL DESC, ${students.name} ASC`)
    .limit(page.limit)
    .offset(page.offset);

  const total = await countRows(students, where);

  return { data, total };
}
