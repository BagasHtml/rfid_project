import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { attendance, students } from '../db/schema.js';
import type { AttendanceRecord, AttendanceWithStudent, AttendanceStatus } from '../types/index.js';

function toDateStr(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function toTimeStr(t: Date | string): string {
  if (typeof t === 'string') return t;
  return t.toTimeString().slice(0, 8);
}

export async function findTodayAttendance(studentId: number): Promise<AttendanceRecord | null> {
  const rows = await db
    .select({
      id: attendance.id,
      studentId: attendance.studentId,
      date: attendance.date,
      time: attendance.time,
      status: attendance.status,
    })
    .from(attendance)
    .where(and(eq(attendance.studentId, studentId), sql`date = CURDATE()`))
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
  time: string,
  status: AttendanceStatus
): Promise<number> {
  const [header] = await db.insert(attendance).values({
    studentId,
    date: sql`CURDATE()`,
    time,
    status,
  }).then(r => r as unknown as [import('mysql2/promise').ResultSetHeader]);

  return header.insertId;
}

export async function getTodayList(limit: number = 100, offset: number = 0): Promise<{ data: AttendanceWithStudent[]; total: number }> {
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
    .where(sql`${attendance.date} = CURDATE()`)
    .orderBy(desc(attendance.time))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(attendance)
    .where(sql`date = CURDATE()`);

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
