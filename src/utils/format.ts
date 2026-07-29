import type { CardWithStudent, StudentInfo } from '../types/index.js';

export function buildStudentInfo(card: CardWithStudent): StudentInfo {
  return {
    name: card.student_name,
    class: card.student_class,
    nis: card.student_nis,
  };
}
