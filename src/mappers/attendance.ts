import type { AttendanceRecord, AttendanceStatus, AttendanceWithStudent } from '../types/attendance.js';
import type { AttendanceWithStudentRow, AttendanceRow } from '../repositories/attendance.js';

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
