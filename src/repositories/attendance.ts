import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { attendance, students } from '../db/schema.js';
import type { AttendanceRecord, AttendanceWithStudent, AttendanceStatus } from '../types/index.js';

function toDateStr(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeStr(t: Date | string): string {
  if (typeof t === 'string') return t;
  return t.toTimeString().slice(0, 8);
}

export async function findTodayAttendance(studentId: number, date: string): Promise<AttendanceRecord | null> {
  const rows = await db
    .select({
      id: attendance.id,
      studentId: attendance.studentId,
      date: attendance.date,
      time: attendance.time,
      status: attendance.status,
    })
    .from(attendance)
    .where(and(eq(attendance.studentId, studentId), eq(attendance.date, date)))
    .limit(1);

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    student_id: rows[0].studentId,
    date: toDateStr(rows[0].date),
    time: toTimeStr(rows[0].time),
    status: rows[0].status as AttendanceStatus,
  };
}

export async function insertAttendance(
  studentId: number,
  date: string,
  time: string,
  status: AttendanceStatus
): Promise<number> {
  const [header] = await db.insert(attendance).values({
    studentId,
    date,
    time,
    status,
  }).then(r => r as unknown as [import('mysql2/promise').ResultSetHeader]);

  return header.insertId;
}

export async function getTodayList(date: string, limit: number = 100, offset: number = 0): Promise<{ data: AttendanceWithStudent[]; total: number }> {
  const rows = await db
    .select({
      id: attendance.id,
      studentId: attendance.studentId,
      date: attendance.date,
      time: attendance.time,
      status: attendance.status,
      studentName: students.name,
      studentClass: students.class,
      studentNis: students.nis,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .where(eq(attendance.date, date))
    .orderBy(desc(attendance.time))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(attendance)
    .where(eq(attendance.date, date));

  return {
    data: rows.map(r => ({
      id: r.id,
      student_id: r.studentId,
      date: toDateStr(r.date),
      time: toTimeStr(r.time),
      status: r.status as AttendanceStatus,
      student_name: r.studentName,
      student_class: r.studentClass,
      student_nis: r.studentNis,
    })),
    total: Number(countResult[0].total),
  };
}
