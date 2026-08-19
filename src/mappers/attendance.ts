import type { AttendanceRecord, AttendanceStatus, AttendanceWithStudent } from '../types/attendance.js';
import type { AttendanceWithStudentRow, AttendanceRow, StudentStatusRow } from '../repositories/attendance.js';

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

export function toAttendanceRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    student_id: row.studentId,
    date: toDateStr(row.date),
    time: toTimeStr(row.time),
    status: row.status as AttendanceStatus,
    keterangan: row.keterangan ?? null,
  };
}

export function toAttendanceWithStudent(row: AttendanceWithStudentRow): AttendanceWithStudent {
  return {
    ...toAttendanceRecord(row),
    student_name: row.studentName,
    student_class: row.studentClass,
    student_nis: row.studentNis,
  };
}

export interface StudentStatusRecord {
  id: number;
  nis: string;
  name: string;
  class: string;
  time: string | null;
  status: string;
  attendanceId: number | null;
  keterangan: string | null;
}

export function toStudentStatus(row: StudentStatusRow): StudentStatusRecord {
  return {
    id: row.id,
    nis: row.nis,
    name: row.name,
    class: row.class,
    time: row.time,
    status: row.status ?? 'Belum Absen',
    attendanceId: row.attendanceId ?? null,
    keterangan: row.keterangan ?? null,
  };
}
