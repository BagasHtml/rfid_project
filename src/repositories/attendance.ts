import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { attendance, students } from '../db/schema.js';
import { countRows, getInsertId } from '../db/helpers.js';
import type { AttendanceStatus } from '../types/attendance.js';

export interface AttendanceRow {
  id: number;
  studentId: number;
  date: Date | string;
  time: Date | string;
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
  const rows = await db
    .select(attendanceColumns)
    .from(attendance)
    .where(and(eq(attendance.studentId, studentId), eq(attendance.date, date)))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertAttendance(
  studentId: number,
  date: string,
  time: string,
  status: AttendanceStatus
): Promise<number> {
  return getInsertId(db.insert(attendance).values({ studentId, date, time, status }));
}

export async function getTodayStats(date: string): Promise<{ onTime: number; late: number }> {
  const onTime = await countRows(attendance, and(eq(attendance.date, date), eq(attendance.status, 'Tepat Waktu')));
  const late = await countRows(attendance, and(eq(attendance.date, date), eq(attendance.status, 'Terlambat')));
  return { onTime, late };
}

export async function getTodayList(date: string, limit: number = 100, offset: number = 0): Promise<{ data: AttendanceWithStudentRow[]; total: number }> {
  const data = await db
    .select(withStudentColumns)
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .where(eq(attendance.date, date))
    .orderBy(desc(attendance.time))
    .limit(limit)
    .offset(offset);

  const total = await countRows(attendance, eq(attendance.date, date));

  return { data, total };
}
