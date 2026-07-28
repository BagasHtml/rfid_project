export interface Student {
  id: number;
  nis: string;
  name: string;
  class: string;
  is_active: boolean;
}

export interface Card {
  id: number;
  uid: string;
  student_id: number;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  date: string;
  time: string;
  status: AttendanceStatus;
}

export interface AttendanceWithStudent extends AttendanceRecord {
  student_name: string;
  student_class: string;
  student_nis: string;
}

export type AttendanceStatus = 'Tepat Waktu' | 'Terlambat';

export interface CardWithStudent {
  uid: string;
  student_id: number;
  student_name: string;
  student_class: string;
  student_nis: string;
}

export interface StudentInfo {
  name: string;
  class: string;
  nis: string;
}

export interface AttendanceResult {
  success: boolean;
  message: string;
  student?: StudentInfo;
  status?: AttendanceStatus;
  time?: string;
}

export interface AttendanceDuplicate {
  is_duplicate: boolean;
  message: string;
  student?: StudentInfo;
  status?: AttendanceStatus;
  time?: string;
}