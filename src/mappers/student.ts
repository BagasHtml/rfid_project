import { formatDateTime } from '../utils/date.js';
import type { StudentRecord } from '../types/student.js';
import type { StudentRow } from '../repositories/student.js';

export function toStudentRecord(row: StudentRow): StudentRecord {
  return {
    id: row.id,
    nis: row.nis,
    name: row.name,
    class: row.class,
    is_active: row.isActive,
    created_at: row.createdAt ? formatDateTime(row.createdAt) : null,
  };
}
