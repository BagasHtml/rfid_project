import type { CardWithStudent } from '../types/card.js';
import type { StudentInfo } from '../types/student.js';

export function buildStudentInfo(card: CardWithStudent): StudentInfo {
  return {
    name: card.student_name,
    class: card.student_class,
    nis: card.student_nis,
  };
}

export function normalizeClassName(value: string): string {
  return value.trim().toUpperCase();
}
