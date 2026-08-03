import type { StudentInfo } from './student.js';

export interface CardWithStudent {
  uid: string;
  student_id: number;
  student_name: string;
  student_class: string;
  student_nis: string;
}

export interface CardRecord {
  id: number;
  uid: string;
  is_active: boolean;
  student_name: string;
  student_class: string;
  student_nis: string;
  created_at: string | null;
}

export interface RegisterCardResult {
  success: boolean;
  message: string;
  statusCode: number;
  student?: StudentInfo;
}
