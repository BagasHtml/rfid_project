import { formatDateTime } from '../utils/date.js';
import type { CardRecord, CardWithStudent } from '../types/card.js';
import type { ActiveCardRow, RecentCardRow } from '../repositories/card.js';

export function toCardWithStudent(row: ActiveCardRow): CardWithStudent {
  return {
    uid: row.uid,
    student_id: row.studentId,
    student_name: row.studentName,
    student_class: row.studentClass,
    student_nis: row.studentNis,
  };
}

export function toCardRecord(row: RecentCardRow): CardRecord {
  return {
    ...toCardWithStudent(row),
    id: row.id,
    is_active: row.isActive,
    created_at: row.createdAt ? formatDateTime(row.createdAt) : null,
  };
}
