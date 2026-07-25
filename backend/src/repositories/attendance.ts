import { pool } from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { CardWithStudent, AttendanceRecord, AttendanceWithStudent, AttendanceStatus } from '../types/index.js';

export async function findActiveCardByUid(uid: string): Promise<CardWithStudent | null> {
  const query = `
    SELECT
      c.uid,
      c.student_id,
      s.name AS student_name,
      s.class AS student_class,
      s.nis AS student_nis
    FROM cards c
    INNER JOIN students s ON s.id = c.student_id
    WHERE c.uid = ?
      AND c.is_active = TRUE
      AND s.is_active = TRUE
    LIMIT 1
  `;

  const [rows] = await pool.query<RowDataPacket[]>(query, [uid]);
  return (rows[0] as CardWithStudent) ?? null;
}

export async function findTodayAttendance(studentId: number): Promise<AttendanceRecord | null> {
  const query = `
    SELECT id, student_id, date, time, status
    FROM attendance
    WHERE student_id = ?
      AND date = CURDATE()
    LIMIT 1
  `;

  const [rows] = await pool.query<RowDataPacket[]>(query, [studentId]);
  return (rows[0] as AttendanceRecord) ?? null;
}

export async function insertAttendance(
  studentId: number,
  time: string,
  status: AttendanceStatus
): Promise<number> {
  const query = `
    INSERT INTO attendance (student_id, date, time, status)
    VALUES (?, CURDATE(), ?, ?)
  `;

  const [result] = await pool.query<ResultSetHeader>(query, [studentId, time, status]);
  return result.insertId;
}

export async function getTodayList(): Promise<AttendanceWithStudent[]> {
  const query = `
    SELECT
      a.id,
      a.student_id,
      a.date,
      a.time,
      a.status,
      s.name AS student_name,
      s.class AS student_class
    FROM attendance a
    INNER JOIN students s ON s.id = a.student_id
    WHERE a.date = CURDATE()
    ORDER BY a.time DESC
  `;

  const [rows] = await pool.query<RowDataPacket[]>(query);
  return rows as AttendanceWithStudent[];
}

export async function getSetting(key: string): Promise<string | null> {
  const query = `SELECT value FROM settings WHERE \`key\` = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(query, [key]);
  return rows[0]?.value ?? null;
}