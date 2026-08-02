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
  statusCode: number;
  student?: StudentInfo;
  status?: AttendanceStatus;
  time?: string;
}

export interface AttendanceDuplicate {
  is_duplicate: boolean;
  message: string;
  statusCode: number;
  student?: StudentInfo;
  status?: AttendanceStatus;
  time?: string;
}

export interface RegisterCardResult {
  success: boolean;
  message: string;
  statusCode: number;
  student?: StudentInfo;
}

export interface CardRecord {
  id: number;
  uid: string;
  is_active: boolean;
  student_name: string;
  student_class: string;
  student_nis: string;
}