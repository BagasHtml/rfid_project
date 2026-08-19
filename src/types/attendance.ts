import type { StudentInfo } from './student.js';

export type AttendanceStatus = 'Tepat Waktu' | 'Terlambat' | 'Alpha' | 'Izin' | 'Sakit' | 'Dispen';

export interface AttendanceRecord {
  id: number;
  student_id: number;
  date: string;
  time: string;
  status: AttendanceStatus;
  keterangan: string | null;
}

export interface AttendanceWithStudent extends AttendanceRecord {
  student_name: string;
  student_class: string;
  student_nis: string;
}

export interface AttendanceResult {
  success: boolean;
  message: string;
  statusCode: number;
  student?: StudentInfo;
  status?: AttendanceStatus;
  time?: string;
}

export interface AttendanceDuplicate {
  success: boolean;
  is_duplicate: boolean;
  message: string;
  statusCode: number;
  student?: StudentInfo;
  status?: AttendanceStatus;
  time?: string;
}
